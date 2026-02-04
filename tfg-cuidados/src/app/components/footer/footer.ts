import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  private translate = inject(TranslateService);
  private authService = inject(AuthService);

  homeLink = computed(() => (this.authService.isAuthenticated() ? '/home' : '/'));

  cambiarIdioma(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('idioma_seleccionado', lang);
  }
}
