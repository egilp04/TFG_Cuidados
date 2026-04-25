export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  const { message, userEmail } = req.body;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error('❌ ERROR: Faltan las variables de entorno en Vercel.');
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }
  const escapeHTML = (str) =>
    str.replace(
      /[&<>"']/g,
      (m) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[m],
    );

  const userToSendMessage = escapeHTML(userEmail || 'Usuario Anónimo');
  const messageSent = escapeHTML(message || '');

  const textoHTML =
    `<b>NUEVO TICKET DE SOPORTE</b>\n\n` +
    `<b>Usuario:</b> ${userToSendMessage}\n` +
    `<b>Email:</b> <code>${userToSendMessage}</code>\n` +
    `<b>💬 Mensaje:</b>\n${messageSent}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: textoHTML,
        parse_mode: 'HTML',
      }),
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error de Telegram API:', data);
      return res.status(data.error_code || 400).json({
        error: 'Telegram rechazó el mensaje',
        details: data.description,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(
      'Error crítico en la función:',
      error.name === 'AbortError' ? 'Timeout' : error.message,
    );

    return res.status(500).json({
      error: 'Error interno',
      message: error.name === 'AbortError' ? 'El servidor tardó mucho en responder' : error.message,
    });
  }
}
