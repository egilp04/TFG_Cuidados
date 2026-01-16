import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Registerform } from '../../components/registerform/registerform';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message-service';
import { Buttonback } from '../../components/buttonback/buttonback';
import { CommonModule, Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap, delay, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [Registerform, CommonModule, Buttonback, TranslateModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private location = inject(Location);

  isUser: boolean = true;

  get esAdminReal(): boolean {
    const user = this.authService.currentUser();
    return user?.rol === 'administrador';
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.detectarTipo();
      });
    this.detectarTipo();
  }

  private detectarTipo(): void {
    const state = history.state as { tipo?: string };
    if (state && state.tipo) {
      this.isUser = state.tipo !== 'empresa';
      this.cd.detectChanges();
    }
  }

  onRegister(event: { datos: any; esCliente: boolean }) {
    const user = this.authService.currentUser();
    const soyAdmin = user?.rol === 'administrador';

    if (user && !soyAdmin) {
      console.error('🛑 INTENTO DE REGISTRO PÚBLICO MIENTRAS ESTÁS LOGUEADO');
      this.messageService.showMessage(
        'Error: Cierra sesión antes de registrar una cuenta nueva.',
        'error'
      );
      return;
    }

    const registro$ = soyAdmin
      ? this.authService.registerByAdmin(event.datos, event.esCliente)
      : this.authService.register(event.datos, event.esCliente);

    registro$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.translate.get('REGISTER.MESSAGES.SUCCESS')),

        tap((msg) => {
          this.messageService.showMessage(msg, 'exito');
          this.cd.detectChanges();
        }),

        delay(2000),

        tap(() => {
          if (soyAdmin) {
            const tipoPestana = event.esCliente ? 'cliente' : 'empresa';
            this.router.navigate(['/admin-gestion'], { queryParams: { tipo: tipoPestana } });
          } else {
            this.router.navigate(['/login']);
          }
        }),

        catchError((err) => {
          console.error('Error en registro:', err);

          const key =
            err.message === 'EMAIL_EXISTS' || err.message?.includes('registered')
              ? 'REGISTER.MESSAGES.ERROR_EMAIL'
              : 'REGISTER.MESSAGES.ERROR_GENERIC';

          return this.translate.get(key).pipe(
            tap((msg) => {
              this.messageService.showMessage(msg, 'error');
              this.cd.detectChanges();
            }),
            switchMap(() => EMPTY)
          );
        })
      )
      .subscribe();
  }
}
