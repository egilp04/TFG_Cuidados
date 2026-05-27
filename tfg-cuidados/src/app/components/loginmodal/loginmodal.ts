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
  public authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private translate = inject(TranslateService);

  public currentMode: 'login' | 'register' | 'recover' | 'resend' | 'verify2fa' = 'login';

  public loginForm = this.fb.group({
    email: this.fb.control<string>('', [Validators.required, Validators.email]),
    password: this.fb.control<string>('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/),
    ]),
  });

  // 🌟 Controles y variables de estado para el 2FA
  public mfaCodeCtrl = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(6),
    Validators.pattern(/^[0-9]+$/),
  ]);
  private pendingFactorId: string | null = null;
  private pendingChallengeId: string | null = null;

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
  isLoading = false;
  public modalFeedback: { text: string; type: 'error' | 'success' } | null = null;
  private timeoutId: any;

  private pendingUser: any = null;
  toEnterApp(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.cd.markForCheck();
      const rawForm = this.loginForm.getRawValue();

      this.authService
        .signIn(rawForm.email ?? '', rawForm.password ?? '')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: async (user) => {
            this.pendingUser = user;
            try {
              const status = await this.authService.check2FAStatus();

              if (status.needs2FA) {
                const factors = await this.authService.getVerifiedFactors();
                const totpFactor = factors.find((f) => f.factor_type === 'totp');

                if (totpFactor) {
                  this.pendingFactorId = totpFactor.id;
                  const challenge = await this.authService.createChallenge(this.pendingFactorId);
                  this.pendingChallengeId = challenge.id;
                  this.isLoading = false;
                  this.currentMode = 'verify2fa';
                  this.showModalFeedback(
                    this.translate.instant('LOGIN_MODAL.FEEDBACK.ENTER_2FA_CODE') ||
                      'Introduce tu código de seguridad.',
                    'success',
                  );
                  this.cd.markForCheck();
                  return;
                }
              }
              this.completeLoginProcess();
            } catch (error) {
              console.error('Error al comprobar estado 2FA:', error);
              this.completeLoginProcess();
            }
          },
          error: (err: Error) => {
            this.isLoading = false;
            if (err.message && err.message.includes('USER_INACTIVE')) {
              this.showModalFeedback(
                this.translate.instant('LOGIN_MODAL.FEEDBACK.USER_INACTIVE'),
                'error',
              );
            } else if (err.message && err.message.includes('Email not confirmed')) {
              this.showModalFeedback(
                this.translate.instant('LOGIN_MODAL.FEEDBACK.EMAIL_NOT_CONFIRMED'),
                'error',
              );
            } else {
              this.showModalFeedback(
                this.translate.instant('LOGIN_MODAL.FEEDBACK.LOGIN_ERROR'),
                'error',
              );
            }
            this.cd.markForCheck();
          },
        });
    } else {
      this.loginForm.markAllAsTouched();
      this.showModalFeedback(this.translate.instant('LOGIN_MODAL.FEEDBACK.FILL_FIELDS'), 'error');
      this.cd.markForCheck();
    }
  }

  /**
   *  Verifica el código introducido por el usuario para completar el inicio de sesión
   */
  async verify2FACode(): Promise<void> {
    if (this.mfaCodeCtrl.invalid || !this.pendingFactorId || !this.pendingChallengeId) {
      this.mfaCodeCtrl.markAsTouched();
      this.showModalFeedback(
        this.translate.instant('LOGIN_MODAL.FEEDBACK.INVALID_CODE') || 'Código inválido',
        'error',
      );
      return;
    }
    this.isLoading = true;
    this.cd.markForCheck();

    try {
      await this.authService.verifyChallenge(
        this.pendingFactorId,
        this.pendingChallengeId,
        this.mfaCodeCtrl.value || '',
      );
      if (this.pendingUser) {
        this.authService.updateUserSignal(this.pendingUser);
      }
      this.completeLoginProcess();
    } catch (error) {
      this.isLoading = false;
      this.showModalFeedback(
        this.translate.instant('LOGIN_MODAL.FEEDBACK.WRONG_CODE') ||
          'Código incorrecto. Inténtalo de nuevo.',
        'error',
      );
      this.cd.markForCheck();
    }
  }

  /**
   * Centraliza el cierre de modales y la redirección al home correspondiente
   */
  private completeLoginProcess(): void {
    const user = this.authService.currentUser();
    const route = getHomeRouteByRole(user?.rol);
    this.dialogRef.close({ loginSuccess: true });
    this.dialog.closeAll();
    setTimeout(() => this.router.navigate([route]), 100);
  }

  /**
   * Valida el correo e inicia el flujo de recuperación de contraseña.
   */
  toRecoverPasswd(): void {
    if (this.emailCtrl.invalid) {
      this.showModalFeedback(this.translate.instant('LOGIN_MODAL.FEEDBACK.INVALID_EMAIL'), 'error');
      this.emailCtrl.markAsTouched();
      this.cd.markForCheck();
      return;
    }

    const email = this.emailCtrl.value || '';
    if (!email) return;

    this.authService.check_user_email_active(email).subscribe({
      next: (exists: boolean) => {
        if (!exists) {
          this.showModalFeedback(
            this.translate.instant('LOGIN_MODAL.FEEDBACK.EMAIL_NOT_FOUND'),
            'error',
          );
          return;
        }
        this.processPasswordRecovery(email);
      },
      error: (err: Error) => {
        this.showModalFeedback(this.translate.instant('LOGIN_MODAL.FEEDBACK.CONN_ERROR'), 'error');
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
          this.showModalFeedback(
            this.translate.instant('LOGIN_MODAL.FEEDBACK.LINK_SENT'),
            'success',
          );
          setTimeout(() => {
            this.modalFeedback = null;
            this.currentMode = 'login';
            this.cd.detectChanges();
          }, 3000);
          this.cd.markForCheck();
        },
        error: (err: Error) => {
          console.error(err);
          const errorMsg = err.message || this.translate.instant('LOGIN_MODAL.FEEDBACK.CONN_ERROR');
          this.showModalFeedback(errorMsg, 'error');
          this.cd.markForCheck();
        },
      });
  }

  /**
   * Muestra un mensaje local en el modal y lo oculta automáticamente
   */
  showModalFeedback(
    text: string,
    type: 'success' | 'error' = 'success',
    duration: number = 3000,
  ): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.modalFeedback = { text, type };
    this.cd.markForCheck();
    this.timeoutId = setTimeout(() => {
      this.clearModalFeedback();
    }, duration);
  }

  /**
   * Borra el mensaje local inmediatamente y limpia el temporizador
   */
  clearModalFeedback(): void {
    this.modalFeedback = null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.cd.markForCheck();
  }
}
