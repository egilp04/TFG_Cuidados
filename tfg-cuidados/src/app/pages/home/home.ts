import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../components/button/button';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ButtonComponent, TranslateModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private authService = inject(AuthService);
  rol = this.authService.userRol();
  private router = inject(Router);

  buscarEmpresas() {
    this.router.navigate(['/search-business']);
  }
  gestionarServicios() {
    this.router.navigate(['/admin-services']);
  }
  verContratos() {
    this.router.navigate(['/contract']);
  }

  gestionarEmpresas() {
    this.router.navigate(['/admin-gestion'], { queryParams: { tipo: 'empresa' } });
  }

  gestionarUsuarios() {
    this.router.navigate(['/admin-gestion'], { queryParams: { tipo: 'cliente' } });
  }

  verDashboard() {
    this.router.navigate(['/dashboard']);
  }
  actividadesProgramadas() {
    this.router.navigate(['/activities']);
  }
  gestionrServiciosGlobales() {
    this.router.navigate(['/global-services']);
  }
  gestionrHorariosGlobales() {
    this.router.navigate(['/global-times']);
  }
}
