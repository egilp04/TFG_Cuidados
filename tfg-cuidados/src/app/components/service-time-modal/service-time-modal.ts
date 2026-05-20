import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ServiceTimeService } from '../../services/service-time.service';
import { ServiceService } from '../../services/service.service';
import { TimeService } from '../../services/time.service';
import { AuthService } from '../../services/auth.service';
import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { Service_Time_Model } from '../../models/Service_Time_Model';
import { ServiceTimeModalData } from '../../models/Service_Time_Data_Model';
import { CloseBtnComponent } from '../close-btn/close-btn.component';
import { catchError, map, switchMap, of} from 'rxjs';
import { MessageService } from '../../services/message-service';
import { Observable, throwError } from 'rxjs';
/**
 * Componente modal para crear o editar la relación entre un servicio, una franja horaria y un negocio.
 */
@Component({
  selector: 'app-service-time-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Inputs,
    ButtonComponent,
    TranslateModule,
    LucideAngularModule,
    MatDialogModule,
    CloseBtnComponent,
  ],
  templateUrl: './service-time-modal.html',
  styleUrl: './service-time-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceTimeModal implements OnInit {
  public dialogRef = inject(MatDialogRef<ServiceTimeModal>);
  public data = inject<ServiceTimeModalData | null>(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);
  private serviceTimeService = inject(ServiceTimeService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  public services$ = inject(ServiceService).getServicesObservable();
  public times$ = inject(TimeService).getTimesObservable();
  public messageService = inject(MessageService);

  public form: FormGroup;
  public isEditing: boolean = false;

  constructor() {
    this.isEditing = !!this.data;

    this.form = this.fb.group({
      id_service: this.fb.control<string>(this.data?.id_service || '', Validators.required),
      id_time: this.fb.control<string>(this.data?.id_time || '', Validators.required),
      id_business: this.fb.control<string>(this.data?.id_business || ''),
      price: this.fb.control<string | number>(this.data?.price || '', [
        Validators.required,
        Validators.min(0),
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ]),
      description: this.fb.control<string>(this.data?.description || '', [Validators.required]),
    });
  }

  ngOnInit(): void {
    if (!this.isEditing) {
      const businessId = this.authService.currentUser()?.id_user;
      this.form.patchValue({ id_business: businessId });
    }
  }

  /**
   * Envía los datos del formulario para insertar o actualizar un registro de ServiceTime.
   */
 /**
   * Envía los datos del formulario para insertar o actualizar un registro de ServiceTime.
   * Incluye validación para evitar editar ofertas que tienen contratos activos.
   */
 save(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  const formPayload = this.form.getRawValue() as Service_Time_Model;
  formPayload.status = 'active'; 
  type ErrorResponse = { success: false; text: string; type: 'error' };
    let request$: Observable<void | ErrorResponse>;
  
  if (this.isEditing && this.data) {
    request$ = this.serviceTimeService.hasActiveContracts(this.data.id_service_time).pipe(
      switchMap((hasContracts: boolean) => {
        if (hasContracts) {
          return throwError(() => new Error('HAS_CONTRACTS'));
        }
        return this.serviceTimeService.updateServiceTime(this.data!.id_service_time, formPayload);
      })
    );
  } else {
    request$ = this.serviceTimeService.insertServiceTime(formPayload);
  }

  request$
    .pipe(
      catchError((err: unknown) => {
        let msgKey = 'MANAGEMENT_SERVICES.MESSAGES.ERROR_GENERIC';
                const errorObj = err as { message?: string; code?: string };
        
        if (errorObj.message === 'DUPLICATE_ENTRY' || errorObj.code === '23505') {
          msgKey = 'MANAGEMENT_SERVICES.MESSAGES.ERROR_DUPLICATE';
        } else if (errorObj.message === 'HAS_CONTRACTS') {
          msgKey = 'SERVICE_TIME_MODAL.ERRORS.HAS_CONTRACTS'; 
        }
        
        return this.translate
          .get(msgKey)
          .pipe(map((text: string): ErrorResponse => ({ success: false, text, type: 'error' })));
      }),
    )
    .subscribe({
      next: (result: void | ErrorResponse) => {
        
        if (result && typeof result === 'object' && 'success' in result && !result.success) {
          this.messageService.showMessage(result.text, result.type);
          return;
        }
        
        const successMsgKey = this.isEditing
          ? 'MANAGEMENT_SERVICES.MESSAGES.SUCCESS_UPDATE'
          : 'MANAGEMENT_SERVICES.MESSAGES.SUCCESS_CREATE';
          
        this.translate.get(successMsgKey).subscribe((text) => {
          this.messageService.showMessage(text, 'success');
        });
        this.dialogRef.close(true);
      },
      error: (err: Error) => console.error('Error fatal no capturado:', err.message)
    });
}

getCtrl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.touched) return '';

    const errors = control.errors;
    if (!errors) return '';

    const errorMessages: Record<string, string> = {
      required: this.translate.instant('SERVICE_TIME_MODAL.ERRORS.REQUIRED'),
      min: this.translate.instant('SERVICE_TIME_MODAL.ERRORS.MIN_VALUE', {
        value: errors['min']?.min,
      }),
      pattern: this.getPatternMessage(controlName),
    };

    const firstError = Object.keys(errors)[0];
    return (
      errorMessages[firstError] || this.translate.instant('SERVICE_TIME_MODAL.ERRORS.INVALID_FIELD')
    );
  }

  private getPatternMessage(controlName: string): string {
    if (controlName === 'price') {
      return this.translate.instant('SERVICE_TIME_MODAL.ERRORS.INVALID_PRICE');
    }
    return this.translate.instant('SERVICE_TIME_MODAL.ERRORS.INVALID_FORMAT');
  }
}
