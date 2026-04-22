import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { ButtonComponent } from '../button/button';
import { Inputs } from '../inputs/inputs';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LoginModalData } from '../../models/Login-Modal';
import { CloseBtnComponent } from '../close-btn/close-btn.component';
import { getHomeRouteByRole } from '../../core/utils/routerUtils';

/**
 * Componente para manejar la modal de inicio de sesión, recuperación de contraseña y verificación de correo.
 */
@Component({
  selector: 'app-loginmodal',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    ButtonComponent,
    Inputs,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    CloseBtnComponent,
  ],
  templateUrl: './loginmodal.html',
  styleUrl: './loginmodal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loginmodal implements OnInit {
  public data = inject<LoginModalData | null>(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<Loginmodal>);
  private cd = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  public messageService = inject(MessageService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  public currentMode: 'login' | 'register' | 'recover' | 'resend' = 'login';

  public loginForm = this.fb.group({
    email: this.fb.control<string>('', [Validators.required, Validators.email]),
    password: this.fb.control<string>('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/),
    ]),
  });

  public emailCtrl = new FormControl('', [Validators.required, Validators.email]);

  ngOnInit(): void {
    if (this.data && this.data.mode) {
      const modeMapping: Record<string, 'login' | 'register' | 'recover' | 'resend'> = {
        login: 'login',
        registro: 'register',
        register: 'register',
        recuperar: 'recover',
        recover: 'recover',
        reenviar: 'resend',
        resend: 'resend',
      };
      this.currentMode = modeMapping[this.data.mode] || 'login';
    }
  }

  /**
   * Obtiene un control de formulario específico del formulario de inicio de sesión.
   * @param name El nombre del control.
   */
  getCtrl(name: string): FormControl {
    return this.loginForm.get(name) as FormControl;
  }

  /**
   * Procesa el intento de autenticación y navega al usuario según su rol.
   */
  toEnterApp(): void {
    if (this.loginForm.valid) {
      const rawForm = this.loginForm.getRawValue();
      const email = rawForm.email ?? '';
      const password = rawForm.password ?? '';

      this.authService
        .signIn(email, password)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.dialogRef.close({ loginSuccess: true });
            this.dialog.closeAll();
            this.cd.detectChanges();

            const user = this.authService.currentUser();
            const role = user?.rol;
            const route = getHomeRouteByRole(role);
            this.router.navigate([route]);
          },
          error: (err: Error) => {
            console.error('Error al iniciar sesión:', err);

            if (err.message && err.message.includes('Email not confirmed')) {
              this.messageService.showMessage(
                this.translate.instant('LOGIN_MODAL.FEEDBACK.EMAIL_NOT_CONFIRMED'),
                'error',
              );
            } else {
              this.messageService.showMessage(
                this.translate.instant('LOGIN_MODAL.FEEDBACK.LOGIN_ERROR'),
                'error',
              );
            }
            this.cd.markForCheck();
          },
        });
    } else {
      this.loginForm.markAllAsTouched();
      this.messageService.showMessage(
        this.translate.instant('LOGIN_MODAL.FEEDBACK.FILL_FIELDS'),
        'error',
      );
      this.cd.markForCheck();
    }
  }

  /**
   * Valida el correo e inicia el flujo de recuperación de contraseña.
   */
  toRecoverPasswd(): void {
    if (this.emailCtrl.invalid) {
      this.messageService.showMessage(
        this.translate.instant('LOGIN_MODAL.FEEDBACK.INVALID_EMAIL'),
        'error',
      );
      this.emailCtrl.markAsTouched();
      this.cd.markForCheck();
      return;
    }

    const email = this.emailCtrl.value || '';
    if (!email) return;

    this.authService.checkEmailExists(email).subscribe({
      next: (exists: boolean) => {
        if (!exists) {
          this.messageService.showMessage(
            this.translate.instant('LOGIN_MODAL.FEEDBACK.EMAIL_NOT_FOUND'),
            'error',
          );
          return;
        }
        this.processPasswordRecovery(email);
      },
      error: (err: Error) => {
        console.error(err);
        this.messageService.showMessage(
          this.translate.instant('LOGIN_MODAL.FEEDBACK.CONN_ERROR'),
          'error',
        );
      },
    });
  }

  /**
   * Llama al servicio de autenticación para enviar un correo de recuperación de contraseña.
   * @param email La dirección de correo electrónico de destino.
   */
  private processPasswordRecovery(email: string): void {
    this.authService
      .recoverPassword(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.showMessage(
            this.translate.instant('LOGIN_MODAL.FEEDBACK.LINK_SENT'),
            'success',
          );
          setTimeout(() => {
            this.messageService.clear();
            this.currentMode = 'login';
            this.cd.detectChanges();
          }, 3000);
          this.cd.markForCheck();
        },
        error: (err: Error) => {
          console.error(err);
          const errorMsg = err.message || this.translate.instant('LOGIN_MODAL.FEEDBACK.CONN_ERROR');
          this.messageService.showMessage(errorMsg, 'error');
          this.cd.markForCheck();
        },
      });
  }

  /**
   * Valida el correo e inicia el flujo de reenvío de correo de verificación.
   */
  toRecoverEmail(): void {
    if (this.emailCtrl.invalid) {
      this.messageService.showMessage(
        this.translate.instant('LOGIN_MODAL.FEEDBACK.WITH_ERROR'),
        'error',
      );
      return;
    }

    const email = this.emailCtrl.value || '';
    if (!email) return;

    this.authService.checkEmailExists(email).subscribe({
      next: (exists: boolean) => {
        if (!exists) {
          this.messageService.showMessage(
            this.translate.instant('LOGIN_MODAL.FEEDBACK.EMAIL_NOT_FOUND'),
            'error',
          );
          return;
        }
        this.processEmailResend(email);
      },
      error: (err: Error) => {
        console.error(err);
        this.messageService.showMessage(
          this.translate.instant('LOGIN_MODAL.FEEDBACK.WITH_ERROR'),
          'error',
        );
      },
    });
  }

  /**
   * Llama al servicio de autenticación para reenviar el correo de verificación de cuenta.
   * @param email La dirección de correo electrónico de destino.
   */
  private processEmailResend(email: string): void {
    this.authService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.messageService.showMessage(
          this.translate.instant('LOGIN_MODAL.FEEDBACK.NO_ERROR'),
          'success',
        );
        setTimeout(() => {
          this.messageService.clear();
          this.currentMode = 'login';
          this.cd.detectChanges();
        }, 2000);
        this.cd.markForCheck();
      },
      error: (err: Error) => {
        console.error(err);
        this.messageService.showMessage(
          this.translate.instant('LOGIN_MODAL.FEEDBACK.WITH_ERROR'),
          'error',
        );
        this.cd.markForCheck();
      },
    });
  }
}
