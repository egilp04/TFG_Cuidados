import { Component, inject, ChangeDetectorRef, DestroyRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.css',
})
export class AiAssistantComponent implements OnInit {
  private aiService = inject(AiService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  private destroyRef = inject(DestroyRef);

  isOpen = false;
  newMessage = '';
  isLoading = false;

  messages: ChatMessage[] = [];

  isEn = false;

  ngOnInit() {
    this.isEn = this.isEnglish();
    if (this.messages.length === 0) {
      this.messages.push({
        text: this.getGreetingText(),
        isUser: false,
      });
    }

    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isEn = this.isEnglish();
      this.updateGreetingMessage();
      this.cdr.detectChanges();
    });
  }

  private getGreetingText(): string {
    return this.isEn
      ? 'Hello! I am the CuidaDos smart assistant. Do you have any questions about the manuals or how the platform works? To start helping you, here you have a video about this app:<br><br> <a class="underline text-gray-500 hover:text-primary" href="https://youtu.be/okBBfYk9x3I?si=TXp7t2F1XyDVUOtA" target="_blank">Watch video tutorial</a>'
      : '¡Hola! Soy el asistente inteligente de CuidaDos. ¿Tienes alguna duda sobre los manuales o cómo funciona la plataforma? Para ayudarte, te dejo el enlace a un videotutorial:<br><br> <a class="underline text-gray-500 hover:text-primary" href="https://youtu.be/okBBfYk9x3I?si=TXp7t2F1XyDVUOtA" target="_blank">Ver videotutorial</a>';
  }

  private updateGreetingMessage() {
    if (this.messages.length > 0 && !this.messages[0].isUser) {
      this.messages[0].text = this.getGreetingText();
    }
  }

  private isEnglish(): boolean {
    const lang = this.translate.currentLang || this.translate.getDefaultLang() || 'es';
    return lang === 'en';
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async sendMessage() {
    if (!this.newMessage.trim() || this.isLoading) return;
    const userText = this.newMessage.trim();

    this.messages.push({ text: userText, isUser: true });
    this.newMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();
    this.scrollToBottom();

    try {
      const lang = this.translate.currentLang || this.translate.getDefaultLang() || 'es';
      const aiResponse = await this.aiService.askAssistant(userText, lang);
      this.messages.push({ text: aiResponse, isUser: false });
      this.cdr.detectChanges();
    } catch (error) {
      this.messages.push({
        text: this.isEn
          ? 'Oops, I had a little wiring problem. Can you repeat that?'
          : 'Ups, he tenido un pequeño cruce de cables. ¿Puedes repetirlo?',
        isUser: false,
      });
      this.cdr.detectChanges();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.scrollToBottom();
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
