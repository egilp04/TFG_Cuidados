import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

/**
 * Componente para el widget de chat de soporte flotante.
 * Permite a clientes y negocios enviar tickets de soporte directamente a administradores.
 */
@Component({
  selector: 'app-chat-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-soporte.component.html',
  styleUrls: ['./chat-soporte.component.css'],
})
export class ChatSoporteComponent {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private cd = inject(ChangeDetectorRef);

  public isOpen = false;
  public newMessage = '';
  public currentUser = this.authService.currentUser();

  public isSending = false;
  public messageSent = false;

  /**
   * Alterna la visibilidad de la ventana de chat de soporte.
   */
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.messageSent = false;
    }
  }

  /**
   * Envía el mensaje del usuario a la API de soporte del servidor.
   */
  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    this.isSending = true;

    const payload = {
      message: this.newMessage,
      userEmail: this.currentUser?.email || 'Email desconocido',
      username: this.currentUser?.name || 'Usuario anónimo',
    };

    this.http.post('/api/support', payload).subscribe({
      next: () => {
        this.isSending = false;
        this.messageSent = true;
        this.newMessage = '';
        this.cd.detectChanges();

        setTimeout(() => {
          this.isOpen = false;
          this.messageSent = false;
          this.cd.detectChanges();
        }, 3000);
      },
      error: (err: Error) => {
        console.error('Error enviando ticket de soporte:', err);
        this.isSending = false;
        this.cd.detectChanges();
      },
    });
  }
}
