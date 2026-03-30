import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);
  private readonly API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${environment.geminiApiKey}`;

  private readonly CONTEXTO_CUIDADOS = `
    Eres el Asistente Virtual Oficial de CuidaDos, una plataforma web que conecta a personas que requieren cuidados con empresas y profesionales del sector sociosanitario.
    Tu objetivo es ayudar a los usuarios a usar la plataforma basándote ÚNICAMENTE en esta información oficial:

    1. ROLES Y REGISTRO:
    - Registro gratuito para Clientes (Particulares) y Empresas desde la página de inicio en la página registro con el boton registrarse.
    - Clientes: Buscan y contratan servicios, revisan su calendario y cancelan contratos. No pueden modificar un contrato realizado.
    - Empresas/Profesionales: Publican su catálogo y cancelan las contrataciones recibidas.
    - Si un contrato es cancelado, no se puede volver a recuperar.

    2. CÓMO CONTRATAR UN SERVICIO (Para Clientes):
    - Se debe usar el buscador para encontrar empresas o servicios.
    - En la tarjeta de la empresa, seleccionar un servicio y horario en el desplegable y pulsar "Contratar".

    3. COMUNICACIÓN Y SEGURIDAD:
    - La plataforma cuenta con mensajería interna.
    - Según el Protocolo de Calidad: Las empresas se encargan de los pagos, se pueden comunicar/compartir por medios de fuera del chat interno.

    4. Consultas y ayuda:
    - Pueden ver el manual de usuario al pie de la web.
    - Pueden mandar un mensaje al administrador (admin@cuidados.es) o abrir un ticket de ayuda.

    REGLAS DE RESPUESTA: sé muy conciso (1 o 2 párrafos máximo), amable y profesional.
  `;

  askAssistant(userMessage: string, lang: string = 'es'): Promise<string> {
    const idiomaSeleccionado = lang === 'en' ? 'ENGLISH' : 'ESPAÑOL';

    const body = {
      systemInstruction: {
        parts: [
          {
            text: `${this.CONTEXTO_CUIDADOS}\n\nREGLA OBLIGATORIA: Debes responder SIEMPRE en ${idiomaSeleccionado}.`,
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return firstValueFrom(
      this.http.post(this.API_URL, body, { headers }).pipe(
        map((response: any) => {
          if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return response.candidates[0].content.parts[0].text;
          }
          throw new Error('Respuesta inválida');
        }),
        catchError((error) => {
          console.error('ERROR REAL DE LA API:', error.status, error.error);
          const isEn = lang === 'en';

          let fallback = isEn
            ? 'I understand your query. My advanced services are currently busy, but you can check the PDF manuals.'
            : 'Entiendo tu consulta. Mis servicios avanzados están saturados, pero puedes consultar los manuales en PDF.';

          const input = userMessage.toLowerCase();
          if (input.includes('hola') || input.includes('hello') || input.includes('hi')) {
            fallback = isEn
              ? "Hello! I'm the CuidaDos assistant. How can I help you?"
              : '¡Hola! Soy el asistente de CuidaDos. ¿En qué puedo ayudarte?';
          } else if (input.includes('contratar') || input.includes('hire')) {
            fallback = isEn
              ? 'To hire a service, search for a business, select the service and click "Hire".'
              : 'Para contratar, busca una empresa, selecciona el servicio y horario, y pulsa "Contratar".';
          }

          return of(fallback);
        }),
      ),
    );
  }
}
