export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { mensaje, emailUsuario } = req.body;

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: "Faltan credenciales del servidor" });
  }

  const textoParaTelegram = `🚨 *SOPORTE CUIDADOS* 🚨\n\n*Usuario:* ${emailUsuario}\n*Mensaje:* ${mensaje}`;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: textoParaTelegram,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      throw new Error("Error al comunicar con Telegram");
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
