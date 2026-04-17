import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chat-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-soporte.component.html',
  styleUrls: ['./chat-soporte.component.css'],
})
export class ChatSoporteComponent implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService).getClient();
  private http = inject(HttpClient);
  
  isOpen = false;
  newMessage = '';
  adminId: string | null = null;
  currentUser = this.authService.currentUser();

  isSending = false;
  messageSent = false;

  async ngOnInit() {
    if (this.currentUser?.rol === 'administrador') {
      return;
    }

    const { data } = await this.supabase
      .from('Usuario')
      .select('id_usuario')
      .eq('rol', 'administrador')
      .eq('estado', true)
      .limit(1)
      .single();

    if (data) {
      this.adminId = data.id_usuario;
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.messageSent = false;
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.isSending = true;
    const payload = {
      mensaje: this.newMessage,
      emailUsuario: this.currentUser?.email || 'Usuario Anónimo',
    };
    this.http.post('/api/soporte', payload).subscribe({
      next: () => {
        this.isSending = false;
        this.messageSent = true;
        this.newMessage = '';
        setTimeout(() => {
          this.isOpen = false;
          this.messageSent = false;
        }, 3000);
      },
      error: (err: Error) => {
        console.error('Error al enviar el ticket:', err);
        this.isSending = false;
      },
    });
  }
}
