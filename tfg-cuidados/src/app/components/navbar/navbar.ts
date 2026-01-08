import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ButtonComponent } from '../button/button';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { Loginmodal } from '../../components/loginmodal/loginmodal';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { ComunicationService } from '../../services/comunication.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ButtonComponent, LucideAngularModule, TranslateModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private comunicationService = inject(ComunicationService);

  ngOnInit() {
    if (this.authService.currentUser()) {
      this.comunicationService.refreshUsersData();
    }
  }

  backHome() {
    const user = this.authService.currentUser();
    if (user) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/landing']);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  logout() {
    this.authService
      .signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.router.navigate(['/']);
      });
  }

  iniciarSesion() {
    const dialogRef = this.dialog.open(Loginmodal, {
      data: { modo: 'login' },
      width: '500px',
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result && result.loginSuccess) {
          this.comunicationService.refreshUsersData();
          this.cd.markForCheck();
        }
      });
  }
  registrarse() {
    this.dialog.open(Loginmodal, { data: { modo: 'registro' }, width: '500px' });
  }
  modificarPerfil() {
    this.router.navigate(['/modify-profile']);
  }
  verComunicaciones(tipo: string) {
    switch (tipo) {
      case 'mensajes':
        this.router.navigate(['/messages']);

        return;
      case 'notificaciones':
        this.router.navigate(['/notifications']);

        return;
    }
  }

  countMensajes$ = this.comunicationService.getUnreadMessagesCount();
  countNotificaciones$ = this.comunicationService.getUnreadNotificationsCount();
}
