import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../button/button';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nav-home',
  imports: [ButtonComponent, TranslateModule],
  templateUrl: './nav-home.component.html',
  styleUrl: './nav-home.component.css',
})
export class NavHomeComponent {
  private authService = inject(AuthService);
  rol = this.authService.userRol();
}
