import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComunicationService } from '../../services/comunication.service';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { ComunicacionModel } from '../../models/Comunicacion';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-chat-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-admin.component.html',
  styleUrls: ['./chat-admin.component.css'],
})
export class ChatAdminComponent implements OnInit {
  private comunicationService = inject(ComunicationService);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService).getClient();

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
    if (!this.newMessage.trim() || !this.adminId || !this.currentUser) return;

    this.isSending = true;
    this.messageSent = false;

    const mensaje: ComunicacionModel = {
      tipo_comunicacion: 'mensaje',
      id_emisor: this.currentUser.id_usuario,
      id_receptor: this.adminId,
      asunto: 'Soporte Directo',
      contenido: this.newMessage.trim(),
      fecha_envio: new Date(),
      leido: false,
      eliminado_por_emisor: false,
      eliminado_por_receptor: false,
    };

    this.comunicationService.insertComunicacion(mensaje).subscribe({
      next: () => {
        this.isSending = false;
        this.messageSent = true;
        this.newMessage = '';
        this.comunicationService.refreshUsersData();
      },
      error: (err) => {
        this.isSending = false;
        console.error('Error enviando ticket al admin:', err);
      },
    });
  }
}
