import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
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
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LoginModalData } from '../../models/Login-Modal';
import { CloseBtnComponent } from '../close-btn/close-btn.component';
import { Cancelmodal } from "../cancelmodal/cancelmodal";

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
    Cancelmodal
],
  templateUrl: './loginmodal.html',
  styleUrl: './loginmodal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loginmodal {
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

  modoActual: 'login' | 'registro' | 'recuperar' | 'reenviar' = 'login';

  loginForm = this.fb.group({
    email: this.fb.control<string>('', [Validators.required, Validators.email]),
    password: this.fb.control<string>('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/),
    ]),
  });

  emailCtrl = new FormControl('', [Validators.required, Validators.email]);

  getCtrl(name: string): FormControl {
    return this.loginForm.get(name) as FormControl;
  }

  ngOnInit() {
    if (this.data && this.data.modo) {
      this.modoActual = this.data.modo;
    }
  }

  toEnterApp() {
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
            this.router.navigate(['/home']);
          },
          error: (err) => {
            console.log('Error login:', err);

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

  toRecoverPasswd() {
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
      next: (existe) => {
        if (!existe) {
          this.messageService.showMessage(
            this.translate.instant('LOGIN_MODAL.FEEDBACK.EMAIL_NOT_FOUND'),
            'error',
          );
          return;
        }
        this.askRecoverPasswd(email);
      },
      error: (err) => {
        console.error(err);
        this.messageService.showMessage(
          this.translate.instant('LOGIN_MODAL.FEEDBACK.CONN_ERROR'),
          'error',
        );
      },
    });
  }

  private askRecoverPasswd(email: string) {
    this.authService
      .recoverPassword(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.showMessage(
            this.translate.instant('LOGIN_MODAL.FEEDBACK.LINK_SENT'),
            'exito',
          );
          setTimeout(() => {
            this.messageService.clear();
            this.modoActual = 'login';
            this.cd.detectChanges();
          }, 3000);
          this.cd.markForCheck();
        },
        error: (err) => {
          console.error(err);
          const errorMsg = err.message || this.translate.instant('LOGIN_MODAL.FEEDBACK.CONN_ERROR');
          this.messageService.showMessage(errorMsg, 'error');
          this.cd.markForCheck();
        },
      });
  }

  toRecoverEmail() {
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
      next: (existe) => {
        if (!existe) {
          this.messageService.showMessage(
            this.translate.instant('LOGIN_MODAL.FEEDBACK.EMAIL_NOT_FOUND'),
            'error',
          );
          return;
        }
        this.askResendEmail(email);
      },
      error: (err) => {
        console.error(err);
        this.messageService.showMessage('LOGIN_MODAL.FEEDBACK.WITH_ERROR', 'error');
      },
    });
  }
  private askResendEmail(email: string) {
    this.authService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.messageService.showMessage(
          this.translate.instant('LOGIN_MODAL.FEEDBACK.NO_ERROR'),
          'exito',
        );
        setTimeout(() => {
          this.messageService.clear();
          this.modoActual = 'login';
          this.cd.detectChanges();
        }, 2000);
        this.cd.markForCheck();
      },
      error: (err) => {
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
