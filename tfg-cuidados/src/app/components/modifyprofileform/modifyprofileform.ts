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
  Validators,
  FormControl,
} from '@angular/forms';
import { ButtonComponent } from '../button/button';
import { Inputs } from '../inputs/inputs';
import { AuthService } from '../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { comunities } from '../../core/constants/locations';
import { LucideAngularModule } from 'lucide-angular';
import { UserProfileModel, FormSubmitEvent } from '../../models/ModifyProfileForm';

/**
 * Component providing a dynamic form to edit user profiles.
 * Adapts its fields and validations based on the user's role (Client, Business, or Admin).
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
  ],
  templateUrl: './modifyprofileform.html',
  styleUrl: './modifyprofileform.css',
})
export class Modifyprofileform implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private cd = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  public comunities: string[] = comunities;

  @Input() userData: UserProfileModel | null = null;
  @Input() userRole: 'client' | 'business' | 'administrator' = 'client';

  @Output() formSubmitted = new EventEmitter<FormSubmitEvent>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

  private targetUser: UserProfileModel | null = null;
  public isAdminViewer: boolean = false;

  public profileForm = this.fb.group({
    userName: this.fb.control<string>('', [Validators.required, Validators.minLength(3)]),
    surname1: this.fb.control<string>(''),
    surname2: this.fb.control<string>(''),
    companyName: this.fb.control<string>(''),
    phone: this.fb.control<string>('', [Validators.required, Validators.pattern('^[0-9]{9}$')]),
    email: this.fb.control<string>('', [Validators.required, Validators.email]),
    address: this.fb.control<string>(''),
    city: this.fb.control<string>(''),
    postcode: this.fb.control<string>(''),
    comunity: this.fb.control<string | null>(null),
    description: this.fb.control<string>(''),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userData'] && this.userData) {
      this.loadProfileFormData();
    }
    if (changes['userRole']) {
      this.checkValidators();
    }
  }

  ngOnInit(): void {
    const activeRole = this.authService.userRol();
    this.isAdminViewer = activeRole === 'administrator';
    
    if (!this.userData) {
      this.loadProfileFormData();
    }
  }

  /**
   * Loads the user's data into the reactive form based on their profile type.
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
          this.profileForm.patchValue({ description: this.targetUser.description || this.targetUser.descripcion || '' });
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
   * Resets and recalculates which fields are mandatory based on the profile role.
   */
  private checkValidators(): void {
    Object.keys(this.profileForm.controls).forEach((key) => {
      this.profileForm.get(key)?.clearValidators();
      this.profileForm.get(key)?.updateValueAndValidity();
    });

    this.setValidators(['email', 'phone']);
    
    if (this.userRole === 'business') {
      this.setValidators(['companyName']);
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
   * Applies specific validation rules to an array of form control names.
   * @param fields Array of form control names to validate.
   */
  private setValidators(fields: string[]): void {
    fields.forEach((f) => {
      const control = this.profileForm.get(f);
      const validators = [Validators.required];
      
      if (f === 'phone') validators.push(Validators.pattern('^[0-9]{9}$'));
      if (f === 'postcode') validators.push(Validators.pattern('^[0-9]{5}$'));
      if (f === 'email') validators.push(Validators.email);
      if (f === 'userName') validators.push(Validators.minLength(3));
      
      control?.setValidators(validators);
      control?.updateValueAndValidity();
    });
  }

  /**
   * Retrieves a form control instance by its name.
   */
  getCtrl(name: string): FormControl {
    return this.profileForm.get(name) as FormControl;
  }

  /**
   * Computes the translated error message for a specific form control.
   */
  getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (!control || !control.touched) return '';
    
    const errors = control.errors;
    if (!errors) return '';
    
    const errorMessages: Record<string, string> = {
      required: this.translate.instant('MODIFY_PROFILE.ERRORS.REQUIRED'),
      email: this.translate.instant('MODIFY_PROFILE.ERRORS.EMAIL'),
      minlength: this.translate.instant('MODIFY_PROFILE.ERRORS.MIN_LENGTH', {
        value: errors['minlength']?.requiredLength,
      }),
      pattern: this.translate.instant('MODIFY_PROFILE.ERRORS.PATTERN'),
    };
    
    const firstError = Object.keys(errors)[0];
    return errorMessages[firstError] || this.translate.instant('MODIFY_PROFILE.ERRORS.INVALID');
  }

  /**
   * Validates the form and emits the structured data to the parent component.
   */
  onSubmit(): void {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.getRawValue();

      const databasePayload: UserProfileModel = {
        email: formValue.email ?? undefined,
        phone: formValue.phone ?? undefined,
        name: (this.userRole === 'business' ? formValue.companyName : formValue.userName) ?? undefined
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
      
      this.formSubmitted.emit({ data: databasePayload, role: this.userRole });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  /**
   * Emits an event to signal cancellation of the profile update.
   */
  onCancel(): void {
    this.cancelRequested.emit();
  }

  /**
   * Emits an event to signal a request to delete the account.
   */
  onDeleteAccount(): void {
    this.deleteRequested.emit();
  }
}