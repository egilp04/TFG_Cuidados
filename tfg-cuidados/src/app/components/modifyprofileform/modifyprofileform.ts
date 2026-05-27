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
  OnDestroy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { ButtonComponent } from '../button/button';
import { Inputs } from '../inputs/inputs';
import { AuthService } from '../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { comunities } from '../../core/constants/locations';
import { LucideAngularModule } from 'lucide-angular';
import { UserProfileModel, FormSubmitEvent } from '../../models/ModifyProfileForm';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { MessageService } from '../../services/message-service';
import { AuthentificatorComponent } from '../authentificator/authentificator.component';

/**
 * Componente que proporciona un formulario dinámico para editar perfiles de usuario.
 * Adapta sus campos y validaciones basándose en el rol del usuario (Cliente, Negocio o Administrador).
 */
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
    AvatarComponent,
    AuthentificatorComponent,
  ],
  templateUrl: './modifyprofileform.html',
  styleUrl: './modifyprofileform.css',
})
export class Modifyprofileform implements OnInit, OnChanges, OnDestroy {
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  public comunities: string[] = comunities;
  @Input() isProcessing: boolean = false;

  public previewUrl: string | null = null;
  public selectedImageFile: File | null = null;

  public messageService = inject(MessageService);

  @Input() userData: UserProfileModel | null = null;
  @Input() userRole: 'client' | 'business' | 'administrator' = 'client';

  @Output() formSubmitted = new EventEmitter<FormSubmitEvent>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();
  @Output() removeAvatar = new EventEmitter<void>();

  private targetUser: UserProfileModel | null = null;
  public isAdminViewer: boolean = false;
  public ownProfile: boolean = true;

  public profileForm = this.fb.group({
    userName: this.fb.control<string>(''),
    surname1: this.fb.control<string>(''),
    surname2: this.fb.control<string>(''),
    companyName: this.fb.control<string>(''),
    phone: this.fb.control<string>(''),
    email: this.fb.control<string>('', [Validators.email]),
    address: this.fb.control<string>(''),
    city: this.fb.control<string>(''),
    postcode: this.fb.control<string>(''),
    comunity: this.fb.control<string | null>(null),
    description: this.fb.control<string>(''),
  });

  /**
   * Función para la modificación de los datos de modificar perfil
   * @param changes parámetros que provoncan el cambio de los datos del usuario
   */

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userData'] && this.userData) {
      this.updateOwnProfileStatus();
      this.loadProfileFormData();
    }
    if (changes['userRole']) {
      this.checkValidators();
    }
  }

  ngOnInit(): void {
    const activeRole = this.authService.userRol();
    this.isAdminViewer = activeRole === 'administrator';
    this.updateOwnProfileStatus();
    if (!this.userData) {
      this.loadProfileFormData();
    }
  }

  private updateOwnProfileStatus(): void {
    const currentUser = this.authService.currentUser() as UserProfileModel | null;
    if (this.userData && currentUser) {
      this.ownProfile = this.userData.id_user === currentUser.id_user;
    } else {
      this.ownProfile = true;
    }
  }

  ngOnDestroy(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  /**
   * Carga los datos del usuario en el formulario reactivo basándose en su tipo de perfil.
   */
  private loadProfileFormData(): void {
    this.targetUser = this.userData || (this.authService.currentUser() as UserProfileModel);

    if (this.targetUser) {
      this.profileForm.patchValue({
        phone: this.targetUser.phone,
        email: this.targetUser.email,
      });

      const nameValue = this.targetUser.name;

      if (this.userRole === 'business') {
        this.profileForm.patchValue({ companyName: nameValue });
      } else {
        this.profileForm.patchValue({ userName: nameValue });
      }

      if (this.userRole !== 'administrator') {
        this.profileForm.patchValue({
          address: this.targetUser.address,
          city: this.targetUser.city,
          postcode: this.targetUser.postcode,
          comunity: this.targetUser.comunity,
        });

        if (this.userRole === 'business') {
          this.profileForm.patchValue({ description: this.targetUser.description || '' });
        } else {
          this.profileForm.patchValue({
            surname1: this.targetUser.surname1,
            surname2: this.targetUser.surname2,
          });
        }
      }
    }

    this.checkValidators();
    this.cd.detectChanges();
  }

  /**
   * Reinicia y recalcula qué campos son obligatorios basándose en el rol del perfil.
   */
  private checkValidators(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      this.profileForm.get(key)?.clearValidators();
      this.profileForm.get(key)?.updateValueAndValidity();
    });

    this.setValidators(['email', 'phone']);

    if (this.userRole === 'business') {
      this.setValidators(['companyName', 'description']);
    } else {
      this.setValidators(['userName']);
    }

    if (this.userRole !== 'administrator') {
      this.setValidators(['address', 'city', 'postcode', 'comunity']);

      if (this.userRole === 'client') {
        this.setValidators(['surname1', 'surname2']);
      }
    }
  }

  /**
   * Aplica reglas de validación específicas a un array de nombres de controles de formulario.
   * @param fields Array de nombres de controles de formulario a validar.
   */
  private setValidators(fields: string[]): void {
    const namePattern = '^[A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\\s]*$';

    fields.forEach((f) => {
      const control = this.profileForm.get(f);
      const validators = [Validators.required];

      if (f === 'phone')
        validators.push(Validators.pattern(/^(?:(?:\+|00)34\s?)?[6789](?:\s?\d){8}$/));
      if (f === 'postcode') validators.push(Validators.pattern('^[0-9]{5}$'));
      if (f === 'email') validators.push(Validators.email);
      if (f === 'userName' || f === 'surname1' || f === 'surname2') {
        validators.push(Validators.minLength(3));
        validators.push(Validators.pattern(namePattern));
      }

      control?.setValidators(validators);
      control?.updateValueAndValidity();
    });
  }

  /**
   * Obtiene una instancia de control de formulario por su nombre.
   */
  getCtrl(name: string): FormControl {
    return this.profileForm.get(name) as FormControl;
  }

  /**
   * Computa el mensaje de error traducido para un control de formulario específico.
   */
  getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (!control || !control.touched) return '';

    const errors = control.errors;
    if (!errors) return '';

    const firstError = Object.keys(errors)[0];

    if (firstError === 'pattern') {
      return this.getPatternMessage(controlName);
    }

    const errorMessages: Record<string, string> = {
      required: this.translate.instant('MODIFY_PROFILE.ERRORS.REQUIRED'),
      email: this.translate.instant('MODIFY_PROFILE.ERRORS.EMAIL'),
      minlength: this.translate.instant('MODIFY_PROFILE.ERRORS.MIN_LENGTH', {
        value: errors['minlength']?.requiredLength,
      }),
    };
    return errorMessages[firstError] || this.translate.instant('MODIFY_PROFILE.ERRORS.INVALID');
  }

  private getPatternMessage(controlName: string): string {
    const patterns: Record<string, string> = {
      phone: 'MODIFY_PROFILE.ERRORS.PATTERN.PHONE',
      postcode: 'MODIFY_PROFILE.ERRORS.PATTERN.ZIP',
      userName: 'MODIFY_PROFILE.ERRORS.PATTERN.USERNAME',
      surname1: 'MODIFY_PROFILE.ERRORS.PATTERN.SURNAME',
      surname2: 'MODIFY_PROFILE.ERRORS.PATTERN.SURNAME',
    };
    const key = patterns[controlName];
    return key
      ? this.translate.instant(key)
      : this.translate.instant('MODIFY_PROFILE.ERRORS.INVALID');
  }

  /**
   * Valida el formulario y emite los datos estructurados al componente padre.
   */
  onSubmit(): void {
    if (this.isProcessing) return;
    if (this.profileForm.valid) {
      const formValue = this.profileForm.getRawValue();

      const databasePayload: UserProfileModel = {
        email: formValue.email ?? undefined,
        phone: formValue.phone ?? undefined,
        name:
          (this.userRole === 'business' ? formValue.companyName : formValue.userName) ?? undefined,
      };

      if (this.userRole !== 'administrator') {
        databasePayload.address = formValue.address ?? undefined;
        databasePayload.city = formValue.city ?? undefined;
        databasePayload.postcode = formValue.postcode ?? undefined;
        databasePayload.comunity = formValue.comunity ?? undefined;

        if (this.userRole === 'client') {
          databasePayload.surname1 = formValue.surname1 ?? undefined;
          databasePayload.surname2 = formValue.surname2 ?? undefined;
        } else if (this.userRole === 'business') {
          databasePayload.description = formValue.description ?? undefined;
        }
      }

      this.formSubmitted.emit({
        data: databasePayload,
        rol: this.userRole,
        avatarFile: this.selectedImageFile,
      });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  /**
   * Emite un evento para señalar la cancelación de la actualización de perfil.
   */
  onCancel(): void {
    if (this.isProcessing) return;
    this.cancelRequested.emit();
  }

  /**
   * Emite un evento para señalar una solicitud de eliminar la cuenta.
   */
  onDeleteAccount(): void {
    if (this.isProcessing) return;
    this.deleteRequested.emit();
  }

  /**
   * Función para la modificación de la foto de perfil del usuario
   * @param event
   * @returns void
   */

  onFileSelected(event: Event): void {
    if (this.isProcessing) return;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (!validTypes.includes(file.type)) {
        this.translate.get('MODIFY_PROFILE.ERRORS.INVALID_IMAGE_TYPE').subscribe((msg: string) => {
          this.messageService.showMessage(msg, 'error');
        });
        input.value = '';
        return;
      }
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        this.translate.get('MODIFY_PROFILE.ERRORS.IMAGE_TOO_LARGE').subscribe((msg: string) => {
          this.messageService.showMessage(msg, 'error');
        });
        input.value = '';
        return;
      }

      this.selectedImageFile = file;

      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.previewUrl = URL.createObjectURL(file);
    }
  }

  deleteAvatar(event: Event): void {
    if (this.isProcessing) return;
    event.stopPropagation();
    event.preventDefault();
    if (this.previewUrl) {
      this.previewUrl = null;
      this.selectedImageFile = null;
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      this.cd.markForCheck();
      return;
    }
    if (this.userData?.avatar_url) {
      this.removeAvatar.emit();
    }
  }
}
