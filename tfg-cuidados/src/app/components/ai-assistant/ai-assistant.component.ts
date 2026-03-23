import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai';
import { TranslateModule } from '@ngx-translate/core';

interface ChatMessage {
  text: string;
  isUser: boolean;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.css',
})
export class AiAssistantComponent {
  private aiService = inject(AiService);
  private cdr = inject(ChangeDetectorRef);
  isOpen = false;
  newMessage = '';
  isLoading = false;

  messages: ChatMessage[] = [
    {
      text: '¡Hola! Soy el asistente inteligente de CuidaDos. ¿Tienes alguna duda sobre los manuales o cómo funciona la plataforma?',
      isUser: false,
    },
  ];

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async sendMessage() {
    if (!this.newMessage.trim() || this.isLoading) return;

    const userText = this.newMessage.trim();

    this.messages.push({ text: userText, isUser: true });
    this.scrollToBottom();
    this.newMessage = '';
    this.isLoading = true;

    try {
      const aiResponse = await this.aiService.askAssistant(userText);
      this.messages.push({ text: aiResponse, isUser: false });
    } catch (error) {
      this.messages.push({
        text: 'Ups, he tenido un pequeño cruce de cables. ¿Puedes repetirlo?',
        isUser: false,
      });
    } finally {
      this.isLoading = false;
      this.scrollToBottom();
      this.cdr.detectChanges();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
}
