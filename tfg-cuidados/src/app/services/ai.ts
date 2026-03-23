import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom, of } from 'rxjs'; // Añadimos 'of'
import { catchError, map } from 'rxjs/operators'; // Añadimos los operadores

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);
  private readonly API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${environment.geminiApiKey}`;
  askAssistant(userMessage: string): Promise<string> {
    const body = {
      contents: [{ parts: [{ text: userMessage }] }],
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return firstValueFrom(
      this.http.post(this.API_URL, body, { headers }).pipe(
        map((response: any) => {
          return response.candidates[0].content.parts[0].text;
        }),
        catchError((error) => {
          console.warn('IA saturada o error, enviando respaldo manual.');
          const input = userMessage.toLowerCase();

          let fallback = `Entiendo tu consulta sobre "${userMessage}". Actualmente mis servicios avanzados están saturados (Error 429), pero puedes consultar los manuales PDF.`;

          if (input.includes('hola')) {
            fallback =
              '¡Hola! Soy el asistente de CuidaDos. ¿En qué puedo ayudarte con los manuales?';
          } else if (
            input.includes('manual') ||
            input.includes('pdf') ||
            input.includes('descargar')
          ) {
            fallback =
              'Puedes descargar los manuales de CuidaDos en los botones "Descargar PDF" que aparecen en esta página.';
          } else if (input.includes('contratar')) {
            fallback =
              'Para contratar un servicio, debes elegir un cuidador del catálogo y solicitar una cita.';
          }
          return of(fallback);
        }),
      ),
    );
  }
}
