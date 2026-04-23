import {
  Component,
  inject,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormControl,
  AbstractControl,
  ValidationErrors,
  AsyncValidatorFn,
} from '@angular/forms';
import { ButtonComponent } from '../button/button';
import { Inputs } from '../inputs/inputs';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { comunities } from '../../core/constants/locations';
import { FormSubmittedEvent, RegisterFormData } from '../../models/RegisterForm';
import { AuthService } from '../../services/auth.service';
import { of, timer, Observable } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

/**
 * Componente que maneja el formulario de registro dinámico.
 * Alterna campos y validaciones basándose en el tipo de perfil seleccionado (Cliente o Negocio).
 */
@Component({
  selector: 'app-registerform',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    Inputs,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
    RouterLink,
  ],
  templateUrl: './registerform.html',
  styleUrl: './registerform.css',
})
export class Registerform implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  public authService = inject(AuthService);

  @Input() isClientProfile: boolean = true;
  @Output() formSubmitted = new EventEmitter<FormSubmittedEvent>();

  public comunities: string[] = comunities;

  registerForm = this.fb.group(
    {
      name: this.fb.control<string>('', [Validators.minLength(3)]),
      termsCondition: this.fb.control<boolean>(false, Validators.requiredTrue),
      surname1: this.fb.control<string>(''),
      surname2: this.fb.control<string>(''),
      birthDate: this.fb.control<string>(''),
      dni: this.fb.control<string>(''),
      companyName: this.fb.control<string>(''),
      cif: this.fb.control<string>(''),
      description: this.fb.control<string>(''),
      phone: this.fb.control<string>('', [Validators.required, Validators.pattern('^[0-9]{9}$')]),
      email: this.fb.control<string>(
        '',
        [Validators.required, Validators.email],
        [this.validatorEmailRegistered()],
      ),
      address: this.fb.control<string>('', Validators.required),
      city: this.fb.control<string>('', Validators.required),
      postcode: this.fb.control<string>('', [
        Validators.required,
        Validators.pattern('^[0-9]{5}$'),
      ]),
      comunity: this.fb.control<string | null>(null, Validators.required),
      password: this.fb.control<string>('', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/,
        ),
      ]),
      repassword: this.fb.control<string>('', [
        Validators.required,
        Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/,
        ),
      ]),
    },
    { validators: [this.passwordMatchValidator] },
  );

  ngOnInit(): void {
    this.checkValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isClientProfile']) {
      this.registerForm.reset();
      this.checkValidators();
    }
  }

  /**
   * Procesa el envío del formulario, mapea datos al esquema y emite al padre.
   */
  onSubmit(): void {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.getRawValue();
      let dataToSend: RegisterFormData;

      if (this.isClientProfile) {
        dataToSend = {
          rol: 'client',
          email: (formValue.email || '').trim(),
          password: (formValue.password || '').trim(),
          name: (formValue.name || '').trim(),
          surname1: (formValue.surname1 || '').trim(),
          surname2: (formValue.surname2 || '').trim(),
          dni: (formValue.dni || '').trim(),
          birthdate: formValue.birthDate ?? undefined,
          phone: (formValue.phone || '').trim(),
          address: (formValue.address || '').trim(),
          city: (formValue.city || '').trim(),
          postcode: (formValue.postcode || '').trim(),
          comunity: formValue.comunity ?? undefined,
        };
      } else {
        dataToSend = {
          rol: 'business',
          email: (formValue.email || '').trim(),
          password: (formValue.password || '').trim(),
          name: (formValue.companyName || '').trim(),
          cif: (formValue.cif || '').trim(),
          description: (formValue.description || '').trim(),
          phone: (formValue.phone || '').trim(),
          address: (formValue.address || '').trim(),
          city: (formValue.city || '').trim(),
          postcode: (formValue.postcode || '').trim(),
          comunity: formValue.comunity ?? undefined,
        };
      }
      this.formSubmitted.emit({ data: dataToSend, isClient: this.isClientProfile });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  /**
   * Obtiene un control de formulario específico por su nombre.
   */
  getCtrl(name: string): FormControl {
    return this.registerForm.get(name) as FormControl;
  }

  /**
   * Obtiene el mensaje de error traducido para un control específico.
   */
  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || (!control.touched && !control.dirty)) return '';

    const errors =
      control.errors || (controlName === 'repassword' ? this.registerForm.errors : null);
    if (!errors) return '';

    const firstError = Object.keys(errors)[0];
    const keyMap: Record<string, string> = {
      required: 'REGISTER.ERRORS.REQUIRED',
      email: 'REGISTER.ERRORS.EMAIL',
      requiredTrue: 'REGISTER.ERRORS.TERMS_REQUIRED',
      mismatch: 'REGISTER.ERRORS.MISMATCH',
      notAdult: 'REGISTER.ERRORS.NOT_ADULT',
      invalidDniFormat: 'REGISTER.ERRORS.DNI_FORMAT',
      invalidDniLetter: 'REGISTER.ERRORS.DNI_LETTER',
      invalidDate: 'REGISTER.ERRORS.FECHNACINVALID',
      invalidCifFormat: 'REGISTER.ERRORS.CIF_FORMAT',
      invalidCifChecksum: 'REGISTER.ERRORS.CIF_INVALID',
      emailTaken: 'REGISTER.ERRORS.EMAIL_TAKEN',
    };
    if (firstError === 'minlength') {
      return this.translate.instant('REGISTER.ERRORS.MIN_LENGTH', {
        value: errors['minlength']?.requiredLength,
      });
    }
    if (firstError === 'pattern') {
      return this.getPatternMessage(controlName);
    }
    const translationKey = keyMap[firstError] || 'REGISTER.ERRORS.INVALID';

    console.log('Idioma actual:', this.translate.currentLang);
    console.log('Traducción instantánea:', this.translate.instant(translationKey));
    console.log(translationKey);

    return this.translate.instant(translationKey);
  }

  private getPatternMessage(controlName: string): string {
    const patterns: Record<string, string> = {
      phone: 'REGISTER.ERRORS.PATTERN.PHONE',
      postcode: 'REGISTER.ERRORS.PATTERN.ZIP',
      password: 'REGISTER.ERRORS.PATTERN.PASSWORD',
    };
    const key = patterns[controlName];
    return key ? this.translate.instant(key) : this.translate.instant('REGISTER.ERRORS.INVALID');
  }

  /**
   * Establece y borra validadores dinámicamente basándose en el tipo de perfil actual.
   */
  private checkValidators(): void {
    const clientFields = ['surname1', 'surname2', 'birthDate', 'dni', 'name'];
    const businessFields = ['companyName', 'cif', 'description'];

    if (this.isClientProfile) {
      this.setValidators(clientFields);
      this.clearValidators(businessFields);
    } else {
      this.setValidators(businessFields);
      this.clearValidators(clientFields);
    }
  }

  /**
   * Aplica validadores específicos a una lista de campos de formulario.
   */
  private setValidators(fields: string[]): void {
    fields.forEach((f) => {
      const c = this.registerForm.get(f);
      if (f === 'birthDate') {
        c?.setValidators([Validators.required, this.isAdult.bind(this)]);
      } else if (f === 'dni') {
        c?.setValidators([Validators.required, this.dniValidator]);
      } else if (f === 'name') {
        c?.setValidators([Validators.required, Validators.minLength(3)]);
      } else if (f === 'cif') {
        c?.setValidators([Validators.required, this.cifValidator]);
      } else {
        c?.setValidators([Validators.required]);
      }
      c?.updateValueAndValidity();
    });
  }

  /**
   * Borra validadores de una lista de campos de formulario.
   */
  private clearValidators(fields: string[]): void {
    fields.forEach((f) => {
      const c = this.registerForm.get(f);
      c?.clearValidators();
      c?.updateValueAndValidity();
    });
  }

  /**
   * Validador personalizado para asegurar que las contraseñas coincidan.
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const repassword = control.get('repassword');
    if (password && repassword && password.value !== repassword.value) {
      repassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  /**
   * Validador personalizado para asegurar que el usuario tenga al menos 18 años de edad.
   */
  isAdult(control: AbstractControl): ValidationErrors | null {
    const birthDateValue = control.value;
    if (!birthDateValue) return null;

    const birthDate = new Date(birthDateValue);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (birthDate > today) return { invalidDate: true };
    return age >= 18 ? null : { notAdult: true };
  }

  /**
   * Validador personalizado para documento de identidad nacional español (DNI).
   */
  dniValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const dniRegex = /^\d{8}[a-zA-Z]$/;
    if (!dniRegex.test(value)) {
      return { invalidDniFormat: true };
    }

    const numberPart = parseInt(value.substring(0, 8), 10);
    const inputLetter = value.substring(8, 9).toUpperCase();
    const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const calculatedLetter = validLetters.charAt(numberPart % 23);

    if (inputLetter !== calculatedLetter) {
      return { invalidDniLetter: true };
    }
    return null;
  }

  /**
   * Validador personalizado para código de identificación fiscal español (CIF).
   */
  cifValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const cif = value.toUpperCase();
    const cifRegex = /^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/;

    if (!cifRegex.test(cif)) {
      return { invalidCifFormat: true };
    }

    const match = cif.match(cifRegex);
    const letter = match![1];
    const numberPart = match![2];
    const cifLastChar = match![3];

    let evenSum = 0;
    let oddSum = 0;

    for (let i = 0; i < numberPart.length; i++) {
      const n = parseInt(numberPart[i], 10);
      if (i % 2 === 0) {
        let odd = n * 2;
        if (odd > 9) odd -= 9;
        oddSum += odd;
      } else {
        evenSum += n;
      }
    }

    const sum = evenSum + oddSum;
    const unit = sum % 10;
    const controlDigit = unit === 0 ? 0 : 10 - unit;
    const controlLetterMap = 'JABCDEFGHI';
    const controlLetter = controlLetterMap[controlDigit];

    const mustBeLetter = 'PQSKW'.includes(letter);
    const mustBeNumber = 'ABEH'.includes(letter);
    let isValid = false;

    if (mustBeLetter) {
      isValid = cifLastChar === controlLetter;
    } else if (mustBeNumber) {
      isValid = cifLastChar === String(controlDigit);
    } else {
      isValid = cifLastChar === String(controlDigit) || cifLastChar === controlLetter;
    }

    return isValid ? null : { invalidCifChecksum: true };
  }

  /**
   * Validador asincrónico que verifica si un correo ya está registrado en la base de datos.
   */
  validatorEmailRegistered(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) return of(null);
      return timer(500).pipe(
        switchMap(() => this.authService.checkEmailExists(control.value)),
        map((exists: boolean) => (exists ? { emailTaken: true } : null)),
        catchError(() => of(null)),
      );
    };
  }
}
