import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { ButtonComponent } from '../button/button';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { ComunicationService } from '../../services/comunication.service';
import { DarkModeBtnComponent } from '../dark-mode-btn/dark-mode-btn.component';
import { filter } from 'rxjs';
import { ResponsiveSize } from '../../services/responsive-size';
import { getHomeRouteByRole } from '../../core/utils/routerUtils';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    LucideAngularModule,
    TranslateModule,
    DarkModeBtnComponent,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private comunicationService = inject(ComunicationService);
  private responsive = inject(ResponsiveSize);
  public isMenuOpen = false;

  homeLink = computed(() => (this.authService.isAuthenticated() ? '/home' : '/'));

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.comunicationService.refreshUsersData();
      }
    });
  }

  ngOnInit() {}
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  backHome() {
    this.closeMenu();
    const user = this.authService.currentUser();
    if (user) {
      const rol = user.rol;
      const route = getHomeRouteByRole(rol);
      this.router.navigate([route]);
    } else {
      this.router.navigate(['/']);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);

  logout() {
    this.closeMenu();
    this.authService
      .signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.router.navigate(['/']);
      });
  }

  async startSession() {
    this.closeMenu();
    const { Loginmodal } = await import('../../components/loginmodal/loginmodal');
    const dialogRef = this.dialog.open(Loginmodal, {
      data: { modo: 'login' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result && result.loginSuccess === true),
      )
      .subscribe(() => {
        this.comunicationService.refreshUsersData();
        this.cd.markForCheck();
      });
  }

  async registerFunction() {
    this.closeMenu();
    const { Loginmodal } = await import('../../components/loginmodal/loginmodal');
    this.dialog.open(Loginmodal, { data: { modo: 'registro' }, width: '500px' });
  }

  modifyProfileFunction() {
    this.closeMenu();
    this.router.navigate(['/modify-profile']);
  }

  showComunications(tipo: string) {
    this.closeMenu();
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
