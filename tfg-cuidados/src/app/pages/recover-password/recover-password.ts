import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, tap, delay, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message-service';
import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Componente para manejar el flujo de recuperación y restablecimiento de contraseña.
 */
@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Inputs, ButtonComponent, TranslateModule],
  templateUrl: './recover-password.html',
  styleUrl: './recover-password.css',
})
export default class RecoverPasswordPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  recoverForm = this.fb.group({
    password: this.fb.control<string>('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/,
      ),
    ]),
  });

  /**
   * Recupera un control de formulario por su nombre.
   * @param name El nombre del control.
   */
  getCtrl(name: string): FormControl {
    return this.recoverForm.get(name) as FormControl;
  }

  /**
   * Resuelve la clave de traducción apropiada para el primer error de validación activo.
   * @param controlName El nombre del control a validar.
   */
  getErrorMessage(controlName: string): string {
    const control = this.recoverForm.get(controlName);
    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;
    const firstError = Object.keys(errors)[0];

    const errorKeys: Record<string, string> = {
      required: 'RECOVER_PASSWORD.ERRORS.REQUIRED',
      minlength: 'RECOVER_PASSWORD.ERRORS.MIN_LENGTH',
      pattern: 'RECOVER_PASSWORD.ERRORS.PATTERN',
    };

    const key = errorKeys[firstError] || 'RECOVER_PASSWORD.ERRORS.INVALID';
    return this.translate.instant(key);
  }

  /**
   * Envía la nueva contraseña y maneja el flujo de actualización.
   */
  onSubmit(): void {
    if (this.recoverForm.invalid) {
      this.recoverForm.markAllAsTouched();
      return;
    }

    const newPass = this.recoverForm.value.password as string;
    this.recoverForm.disable();

    this.authService
      .updatePass(newPass)
      .pipe(
        switchMap(() => this.translate.get('RECOVER_PASSWORD.TOAST.SUCCESS')),
        tap((msg) => this.messageService.showMessage(msg, 'success')),
        delay(2000),
        switchMap(() => this.authService.signOut()),
        tap(() => this.router.navigate(['/'])),
        catchError((err) => {
          console.error(err);
          this.recoverForm.enable();

          return this.translate.get('RECOVER_PASSWORD.TOAST.ERROR').pipe(
            tap((msg) => this.messageService.showMessage(msg, 'error')),
            switchMap(() => EMPTY),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /**
   * Cancela el proceso, cierra la sesión del usuario y navega a la página de inicio.
   */
  goHome(): void {
    this.authService
      .signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.router.navigate(['/']);
      });
  }
}
