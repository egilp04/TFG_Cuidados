import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastData } from '../models/Message-Service';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private messageSignal = signal<ToastData | null>(null);
  public readonly messageData = this.messageSignal.asReadonly();
  private timeoutId: any;
  private router = inject(Router);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe(() => {
      this.clear();
    });
  }

  /**
   * Muestra un mensaje temporal en pantalla
   * @param text Contenido del mensaje
   * @param type Estilo visual (success, error o info)
   * @param duration Tiempo en milisegundos (default 3s)
   */
  showMessage(text: string, type: 'success' | 'error' = 'success', duration: number = 2000) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.messageSignal.set({ message: text, type });
    this.timeoutId = setTimeout(() => {
      this.clear();
    }, duration);
  }

  clear() {
    this.messageSignal.set(null);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
