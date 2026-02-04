import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Footer } from './components/footer/footer';
import { Navbar } from './components/navbar/navbar';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('tfg_app');
  public router = inject(Router);
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.translate.setDefaultLang('es');
    this.translate.addLangs(['es', 'en']);

    if (isPlatformBrowser(this.platformId)) {
      const lenguajeGuardado = localStorage.getItem('idioma_seleccionado');

      if (lenguajeGuardado) {
        this.translate.use(lenguajeGuardado);
      } else {
        const browserLang = this.translate.getBrowserLang();
        const idiomaInicial = browserLang?.match(/en|es/) ? browserLang : 'es';
        this.translate.use(idiomaInicial);
      }
    } else {
      this.translate.use('es');
    }
  }
}
