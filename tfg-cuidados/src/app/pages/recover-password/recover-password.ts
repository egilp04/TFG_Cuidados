import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, tap, delay, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message-service';
import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Inputs, ButtonComponent, TranslateModule],
  templateUrl: './recover-password.html',
  styleUrl: './recover-password.css',
})
export class RecoverPasswordPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);

  recoverForm: FormGroup = this.fb.group({
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/
        ),
      ],
    ],
  });

  getCtrl(name: string): FormControl {
    return this.recoverForm.get(name) as FormControl;
  }

  getErrorMessage(controlName: string): string {
    const control = this.recoverForm.get(controlName);
    if (!control || !control.touched || !control.errors) return '';
    const errors = control.errors;
    const primerError = Object.keys(errors)[0];
    const errorKeys: { [key: string]: string } = {
      required: 'RECOVER_PASSWORD.ERRORS.REQUIRED',
      minlength: 'RECOVER_PASSWORD.ERRORS.MIN_LENGTH',
      pattern: 'RECOVER_PASSWORD.ERRORS.PATTERN',
    };

    const key = errorKeys[primerError] || 'RECOVER_PASSWORD.ERRORS.INVALID';
    return this.translate.instant(key);
  }

  onSubmit() {
    if (this.recoverForm.invalid) {
      this.recoverForm.markAllAsTouched();
      return;
    }
    const newPass = this.recoverForm.value.password!;
    this.recoverForm.disable();
    this.authService
      .updatePass(newPass)
      .pipe(
        switchMap(() => this.translate.get('RECOVER_PASSWORD.TOAST.SUCCESS')),
        tap((msg) => this.messageService.showMessage(msg, 'exito')),
        delay(2000),
        switchMap(() => this.authService.signOut()),
        tap(() => this.router.navigate(['/'])),
        catchError((err) => {
          console.error(err);
          this.recoverForm.enable();

          return this.translate.get('RECOVER_PASSWORD.TOAST.ERROR').pipe(
            tap((msg) => this.messageService.showMessage(msg, 'error')),
            switchMap(() => EMPTY)
          );
        })
      )
      .subscribe();
  }
}
