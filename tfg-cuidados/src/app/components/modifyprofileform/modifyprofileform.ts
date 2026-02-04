import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { ButtonComponent } from '../button/button';
import { Inputs } from '../inputs/inputs';
import { AuthService } from '../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { comunidades } from '../../core/constants/locations';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-modifyprofileform',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    Inputs,
    ReactiveFormsModule,
    TranslateModule,
    LucideAngularModule,
  ],
  templateUrl: './modifyprofileform.html',
  styleUrl: './modifyprofileform.css',
})
export class Modifyprofileform implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  public comunidades: string[] = comunidades;
  @Input() userData: any = null;
  @Input() userRole: 'cliente' | 'empresa' | 'administrador' = 'cliente';
  @Output() formSubmitted = new EventEmitter<{ datos: any; rol: string }>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

  private targetUser: any = null;
  public isAdminViewer: boolean = false;

  profileForm: FormGroup = this.fb.group({
    usuario: ['', [Validators.required, Validators.minLength(3)]],
    primerApe: [''],
    segundoApe: [''],
    nombreEmpresa: [''],
    telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
    email: ['', [Validators.required, Validators.email]],
    direccion: [''],
    localidad: [''],
    codpostal: [''],
    comunidad: [null],
    descripcion: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userData'] && this.userData) {
      this.cargarDatosFormulario();
    }
    if (changes['userRole']) {
      this.configurarValidadores();
    }
  }

  ngOnInit(): void {
    this.isAdminViewer = this.authService.userRol() === 'administrador';
    if (!this.userData) {
      this.cargarDatosFormulario();
    }
  }

  private cargarDatosFormulario() {
    this.targetUser = this.userData || this.authService.currentUser();
    if (this.targetUser) {
      this.profileForm.patchValue({
        telefono: this.targetUser.telef,
        email: this.targetUser.email,
      });
      if (this.userRole === 'empresa') {
        this.profileForm.patchValue({ nombreEmpresa: this.targetUser.nombre });
      } else {
        this.profileForm.patchValue({ usuario: this.targetUser.nombre });
      }
      if (this.userRole !== 'administrador') {
        this.profileForm.patchValue({
          direccion: this.targetUser.direccion,
          localidad: this.targetUser.localidad,
          codpostal: this.targetUser.codpostal,
          comunidad: this.targetUser.comunidad,
        });
        if (this.userRole === 'empresa') {
          this.profileForm.patchValue({ descripcion: this.targetUser.descripcion || '' });
        } else {
          this.profileForm.patchValue({
            primerApe: this.targetUser.ape1,
            segundoApe: this.targetUser.ape2,
          });
        }
      }
    }
    this.configurarValidadores();
    this.cd.detectChanges();
  }

  private configurarValidadores() {
    Object.keys(this.profileForm.controls).forEach((key) => {
      this.profileForm.get(key)?.clearValidators();
      this.profileForm.get(key)?.updateValueAndValidity();
    });
    this.setValidators(['email', 'telefono']);
    if (this.userRole === 'empresa') {
      this.setValidators(['nombreEmpresa']);
    } else {
      this.setValidators(['usuario']);
    }
    if (this.userRole !== 'administrador') {
      this.setValidators(['direccion', 'localidad', 'codpostal', 'comunidad']);
      if (this.userRole === 'cliente') {
        this.setValidators(['primerApe', 'segundoApe']);
      }
    }
  }

  private setValidators(fields: string[]) {
    fields.forEach((f) => {
      const control = this.profileForm.get(f);
      const validators = [Validators.required];
      if (f === 'telefono') validators.push(Validators.pattern('^[0-9]{9}$'));
      if (f === 'codpostal') validators.push(Validators.pattern('^[0-9]{5}$'));
      if (f === 'email') validators.push(Validators.email);
      if (f === 'usuario') validators.push(Validators.minLength(3));
      control?.setValidators(validators);
      control?.updateValueAndValidity();
    });
  }

  getCtrl(name: string): FormControl {
    return this.profileForm.get(name) as FormControl;
  }

  getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (!control || !control.touched) return '';
    const errors = control.errors;
    if (!errors) return '';
    const errorMessages: { [key: string]: string } = {
      required: this.translate.instant('MODIFY_PROFILE.ERRORS.REQUIRED'),
      email: this.translate.instant('MODIFY_PROFILE.ERRORS.EMAIL'),
      minlength: this.translate.instant('MODIFY_PROFILE.ERRORS.MIN_LENGTH', {
        value: errors['minlength']?.requiredLength,
      }),
      pattern: this.translate.instant('MODIFY_PROFILE.ERRORS.PATTERN'),
    };
    const primerError = Object.keys(errors)[0];
    return errorMessages[primerError] || this.translate.instant('MODIFY_PROFILE.ERRORS.INVALID');
  }

  onSubmit() {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.getRawValue();
      const datosParaBBDD: any = {
        email: formValue.email,
        telef: formValue.telefono,
        nombre: this.userRole === 'empresa' ? formValue.nombreEmpresa : formValue.usuario,
      };
      if (this.userRole !== 'administrador') {
        datosParaBBDD.direccion = formValue.direccion;
        datosParaBBDD.localidad = formValue.localidad;
        datosParaBBDD.codpostal = formValue.codpostal;
        datosParaBBDD.comunidad = formValue.comunidad;
        if (this.userRole === 'cliente') {
          datosParaBBDD.ape1 = formValue.primerApe;
          datosParaBBDD.ape2 = formValue.segundoApe;
        } else if (this.userRole === 'empresa') {
          datosParaBBDD.descripcion = formValue.descripcion;
        }
      }
      this.formSubmitted.emit({ datos: datosParaBBDD, rol: this.userRole });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancelRequested.emit();
  }

  onDeleteAccount() {
    this.deleteRequested.emit();
  }
}
