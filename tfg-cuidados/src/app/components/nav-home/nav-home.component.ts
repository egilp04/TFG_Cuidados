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

  private router = inject(Router);

  searchForBussiness() {
    this.router.navigate(['/services-directory']);
  }
  manageServices() {
    this.router.navigate(['/admin-services']);
  }
  checkContracts() {
    this.router.navigate(['/contract']);
  }

  manageBussinesses() {
    this.router.navigate(['/admin-management'], { queryParams: { type: 'business' } });
  }

  manageUsers() {
    this.router.navigate(['/admin-management'], { queryParams: { type: 'client' } });
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
