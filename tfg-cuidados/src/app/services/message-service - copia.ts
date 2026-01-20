import { Injectable, signal } from '@angular/core';
export interface ToastData {
  mensaje: string;
  tipo: 'exito' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private messageSignal = signal<ToastData | null>(null);
  public readonly messageData = this.messageSignal.asReadonly();

  /**
   * Muestra un mensaje temporal en pantalla
   * @param texto Contenido del mensaje
   * @param tipo Estilo visual (exito, error o info)
   * @param duracion Tiempo en milisegundos (default 3s)
   */
  showMessage(texto: string, tipo: 'exito' | 'error' = 'exito', duracion: number = 3000) {
    this.messageSignal.set({ mensaje: texto, tipo });
    setTimeout(() => {
      this.clear();
    }, duracion);
  }
  clear() {
    this.messageSignal.set(null);
  }
}
