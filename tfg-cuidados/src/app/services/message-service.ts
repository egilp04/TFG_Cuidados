import { Injectable, signal } from '@angular/core';
import { ToastData } from '../models/Message-Service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private messageSignal = signal<ToastData | null>(null);
  public readonly messageData = this.messageSignal.asReadonly();

  /**
   * Muestra un mensaje temporal en pantalla
   * @param text Contenido del mensaje
   * @param type Estilo visual (success, error o info)
   * @param duration Tiempo en milisegundos (default 3s)
   */
  showMessage(text: string, type: 'success' | 'error' = 'success', duration: number = 3000) {
    this.messageSignal.set({ message: text, type });
    setTimeout(() => {
      this.clear();
    }, duration);
  }
  clear() {
    this.messageSignal.set(null);
  }
}
