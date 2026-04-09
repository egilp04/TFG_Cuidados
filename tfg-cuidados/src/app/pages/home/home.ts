import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../components/button/button';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AiAssistantComponent } from '../../components/ai-assistant/ai-assistant.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ButtonComponent, TranslateModule, AiAssistantComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export default class Home {
  private authService = inject(AuthService);
  rol = this.authService.userRol();
  private router = inject(Router);

  searchForBussiness() {
    this.router.navigate(['/search-business']);
  }
  manageServices() {
    this.router.navigate(['/admin-services']);
  }
  checkContracts() {
    this.router.navigate(['/contract']);
  }

  manageBussinesses() {
    this.router.navigate(['/admin-gestion'], { queryParams: { tipo: 'empresa' } });
  }

  manageUsers() {
    this.router.navigate(['/admin-gestion'], { queryParams: { tipo: 'cliente' } });
  }

  checkDashboard() {
    this.router.navigate(['/dashboard']);
  }
  programedActivities() {
    this.router.navigate(['/activities']);
  }
  manageGlobalServices() {
    this.router.navigate(['/global-services']);
  }
  manageGlobalTimes() {
    this.router.navigate(['/global-times']);
  }
}
