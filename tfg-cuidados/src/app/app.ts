import { Component, inject, signal, PLATFORM_ID, HostListener } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Footer } from './components/footer/footer';
import { Navbar } from './components/navbar/navbar';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';
import { GlobalNotificationsComponent } from './components/global-notifications/global-notifications.component';
import { AiAssistantComponent } from './components/ai-assistant/ai-assistant.component';
import { AuthService } from './services/auth.service';
import { NavHomeComponent } from './components/nav-home/nav-home.component';
import { ChatSoporteComponent } from './components/chat-soporte/chat-soporte.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Footer,
    Navbar,
    GlobalNotificationsComponent,
    AiAssistantComponent,
    NavHomeComponent,
    ChatSoporteComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('tfg_app');
  public router = inject(Router);
  private translate = inject(TranslateService);
  authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  rol = this.authService.userRol();

  constructor() {
    this.translate.setDefaultLang('es');
    this.translate.addLangs(['es', 'en']);

    if (isPlatformBrowser(this.platformId)) {
      const storesLanguage = localStorage.getItem('idioma_seleccionado');

      if (storesLanguage) {
        this.translate.use(storesLanguage);
      } else {
        const browserLang = this.translate.getBrowserLang();
        const startLaguage = browserLang?.match(/en|es/) ? browserLang : 'es';
        this.translate.use(startLaguage);
      }

      this.router.events.pipe(
        filter((event: any) => event instanceof NavigationEnd)
      ).subscribe(() => {
        const container = document.querySelector('.main-container');
        if (container) {
          container.scrollTo(0, 0); 
        }
      });

    } else {
      this.translate.use('es');
    }
  }

  showScrollBtn = false;

  onContainerScroll(event: Event) {
    const element = event.target as HTMLElement;
    const scrollPosition = element.scrollTop;
    this.showScrollBtn = scrollPosition > 100;
  }

  scrollToTop() {
    const container = document.querySelector('.main-container');
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }
}
