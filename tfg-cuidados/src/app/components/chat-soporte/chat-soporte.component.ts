import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

/**
 * Component for the floating support chat widget.
 * Allows clients and businesses to send support tickets directly to administrators.
 */
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
  private cd = inject(ChangeDetectorRef);

  public isOpen = false;
  public newMessage = '';
  public adminId: string | null = null;
  public currentUser = this.authService.currentUser();

  public isSending = false;
  public messageSent = false;

  async ngOnInit(): Promise<void> {
    if (this.currentUser?.rol === 'administrator') {
      return;
    }

    const { data } = await this.supabase
      .from('User_public')
      .select('id_user')
      .eq('rol', 'administrator')
      .eq('state', true)
      .limit(1)
      .single();

    if (data) {
      this.adminId = data.id_user;
    }
  }

  /**
   * Toggles the visibility of the support chat window.
   */
  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.messageSent = false;
    }
  }

  /**
   * Sends the user's message to the backend support API.
   */
  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    
    this.isSending = true;
    
    const payload = {
      message: this.newMessage,
      userEmail: this.currentUser?.email || 'Anonymous User',
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
        console.error('Error sending support ticket:', err);
        this.isSending = false;
        this.cd.detectChanges();
      },
    });
  }
}