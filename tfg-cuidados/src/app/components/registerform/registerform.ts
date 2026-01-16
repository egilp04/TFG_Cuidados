import {
  Component,
  inject,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  DestroyRef,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ButtonComponent } from '../button/button';
import { Inputs } from '../inputs/inputs';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { comunidades } from '../../core/constants/locations';

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
export class Registerform implements OnInit {
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  @Input() isUser: boolean = true;
  @Output() formSubmitted = new EventEmitter<{ datos: any; esCliente: boolean }>();

  public comunidades: string[] = comunidades;

  registerForm: FormGroup = this.fb.group(
    {
      nombre: ['', [Validators.minLength(3)]],
      termsCondition: [false, Validators.requiredTrue],
      ape1: [''],
      ape2: [''],
      fechnac: [''],
      dni: [''],
      nombreEmpresa: [''],
      cif: [''],
      descripcion: [''],
      telef: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email]],
      direccion: ['', Validators.required],
      localidad: ['', Validators.required],
      codpostal: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
      comunidad: [null, Validators.required],
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
      repassword: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/
          ),
        ],
      ],
    },
    { validators: [this.passwordMatchValidator] }
  );

  ngOnInit(): void {
    this.configurarValidadores();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isUser']) {
      this.registerForm.reset();
      this.configurarValidadores();
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.getRawValue();
      let datosParaEnviar = {};

      if (this.isUser) {
        datosParaEnviar = {
          rol: 'cliente',
          email: formValue.email.trim(),
          password: formValue.password.trim(),
          nombre: formValue.nombre.trim(),
          ape1: formValue.ape1.trim(),
          ape2: formValue.ape2 ? formValue.ape2.trim() : '',
          dni: formValue.dni.trim(),
          fechnac: formValue.fechnac,
          telef: formValue.telef.trim(),
          direccion: formValue.direccion.trim(),
          localidad: formValue.localidad.trim(),
          codpostal: formValue.codpostal.trim(),
          comunidad: formValue.comunidad,
        };
      } else {
        datosParaEnviar = {
          rol: 'empresa',
          email: formValue.email.trim(),
          password: formValue.password.trim(),
          nombre: formValue.nombreEmpresa.trim(),
          cif: formValue.cif.trim(),
          descripcion: formValue.descripcion ? formValue.descripcion.trim() : '',
          telef: formValue.telef.trim(),
          direccion: formValue.direccion.trim(),
          localidad: formValue.localidad.trim(),
          codpostal: formValue.codpostal.trim(),
          comunidad: formValue.comunidad,
        };
      }

      console.log('📤 Formulario válido, enviando datos al padre:', datosParaEnviar);
      this.formSubmitted.emit({ datos: datosParaEnviar, esCliente: this.isUser });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  getCtrl(name: string): FormControl {
    return this.registerForm.get(name) as FormControl;
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.touched) return '';

    const errors =
      control.errors || (controlName === 'repassword' ? this.registerForm.errors : null);
    if (!errors) return '';

    const errorMessages: { [key: string]: string } = {
      required: this.translate.instant('REGISTER.ERRORS.REQUIRED'),
      email: this.translate.instant('REGISTER.ERRORS.EMAIL'),
      minlength: this.translate.instant('REGISTER.ERRORS.MIN_LENGTH', {
        value: errors['minlength']?.requiredLength,
      }),
      requiredTrue: this.translate.instant('REGISTER.ERRORS.TERMS_REQUIRED'),
      mismatch: this.translate.instant('REGISTER.ERRORS.MISMATCH'),
      pattern: this.getPatternMessage(controlName),
      notAdult: this.translate.instant('REGISTER.ERRORS.NOT_ADULT'),
      invalidDniFormat: this.translate.instant('REGISTER.ERRORS.DNI_FORMAT'),
      invalidDniLetter: this.translate.instant('REGISTER.ERRORS.DNI_LETTER'),
      invalidDate: this.translate.instant('REGISTER.ERRORS.FECHNACINVALID'),
      invalidCifFormat: this.translate.instant('REGISTER.ERRORS.CIF_FORMAT'),
      invalidCifChecksum: this.translate.instant('REGISTER.ERRORS.CIF_INVALID'),
      emailTaken: this.translate.instant('REGISTER.ERRORS.EMAIL_TAKEN'),
    };

    const primerError = Object.keys(errors)[0];
    return errorMessages[primerError] || this.translate.instant('REGISTER.ERRORS.INVALID');
  }

  private getPatternMessage(controlName: string): string {
    const patterns: { [key: string]: string } = {
      telef: 'REGISTER.ERRORS.PATTERN.PHONE',
      codpostal: 'REGISTER.ERRORS.PATTERN.ZIP',
      password: 'REGISTER.ERRORS.PATTERN.PASSWORD',
    };
    const key = patterns[controlName];
    return key ? this.translate.instant(key) : this.translate.instant('REGISTER.ERRORS.INVALID');
  }

  private configurarValidadores() {
    const camposUser = ['ape1', 'ape2', 'fechnac', 'dni', 'nombre'];
    const camposEmpresa = ['nombreEmpresa', 'cif', 'descripcion'];
    if (this.isUser) {
      this.setValidators(camposUser);
      this.clearValidators(camposEmpresa);
    } else {
      this.setValidators(camposEmpresa);
      this.clearValidators(camposUser);
    }
  }

  private setValidators(fields: string[]) {
    fields.forEach((f) => {
      const c = this.registerForm.get(f);
      if (f === 'fechnac') {
        c?.setValidators([Validators.required, this.isAdult.bind(this)]);
      } else if (f === 'dni') {
        c?.setValidators([Validators.required, this.dniValidator]);
      } else if (f === 'nombre') {
        c?.setValidators([Validators.required, Validators.minLength(3)]);
      } else if (f === 'cif') {
        c?.setValidators([Validators.required, this.cifValidator]);
      } else if (f === 'descripcion') {
        c?.clearValidators();
      } else {
        c?.setValidators([Validators.required]);
      }
      c?.updateValueAndValidity();
    });
  }

  private clearValidators(fields: string[]) {
    fields.forEach((f) => {
      const c = this.registerForm.get(f);
      c?.clearValidators();
      c?.updateValueAndValidity();
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const repassword = control.get('repassword');
    if (password && repassword && password.value !== repassword.value) {
      repassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  isAdult(control: AbstractControl): ValidationErrors | null {
    const birthDateValue = control.value;
    if (!birthDateValue) {
      return null;
    }
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

  dniValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const dniRegex = /^\d{8}[a-zA-Z]$/;
    if (!dniRegex.test(value)) {
      return { invalidDniFormat: true };
    }
    const numero = parseInt(value.substring(0, 8), 10);
    const letraInput = value.substring(8, 9).toUpperCase();
    const letrasValidas = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const letraCalculada = letrasValidas.charAt(numero % 23);
    if (letraInput !== letraCalculada) {
      return { invalidDniLetter: true };
    }
    return null;
  }

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
}
