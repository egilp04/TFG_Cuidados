import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ServiceTimeService } from '../../services/service-time.service';
import { ServiceService } from '../../services/service.service';
import { TimeService } from '../../services/time.service';
import { AuthService } from '../../services/auth.service';
import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';

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
  ],
  templateUrl: './service-time-modal.html',
  styleUrl: './service-time-modal.css',
})
export class ServiceTimeModal implements OnInit {
  public dialogRef = inject(MatDialogRef<ServiceTimeModal>);
  public data = inject(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);
  private serviceTimeService = inject(ServiceTimeService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  servicios$ = inject(ServiceService).getServicesObservable();
  horarios$ = inject(TimeService).getTimesObservable();

  form: FormGroup;
  isEditing: boolean = false;

  constructor() {
    this.isEditing = !!this.data;
    this.form = this.fb.group({
      id_servicio: [this.data?.id_servicio || '', Validators.required],
      id_horario: [this.data?.id_horario || '', Validators.required],
      id_empresa: [this.data?.id_empresa || ''],
      precio: [
        this.data?.precio || '',
        [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,2})?$/)],
      ],
      descripcion: [this.data?.descripcion || '', [Validators.required]],
    });
  }

  ngOnInit() {
    if (!this.isEditing) {
      const empresaId = this.authService.currentUser()?.id_usuario;
      this.form.patchValue({ id_empresa: empresaId });
    }
  }

  save() {
    if (this.form.invalid) return;
    const request = this.isEditing
      ? this.serviceTimeService.updateServiceTime(this.data.id_servicio_horario, this.form.value)
      : this.serviceTimeService.insertServiceTime(this.form.value);
    request.subscribe({
      next: () => {
        this.dialogRef.close();
      },
      error: (err) => console.error('Error al guardar:', err),
    });
  }

  getCtrl(name: string) {
    return this.form.get(name) as any;
  }

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !control.touched) return '';

    const errors = control.errors;
    if (!errors) return '';
    const errorMessages: { [key: string]: string } = {
      required: this.translate.instant('SERVICE_TIME_MODAL.ERRORS.REQUIRED'),
      min: this.translate.instant('SERVICE_TIME_MODAL.ERRORS.MIN_VALUE', {
        value: errors['min']?.min,
      }),
      pattern: this.getPatternMessage(controlName),
    };

    const primerError = Object.keys(errors)[0];
    return (
      errorMessages[primerError] ||
      this.translate.instant('SERVICE_TIME_MODAL.ERRORS.INVALID_FIELD')
    );
  }

  private getPatternMessage(controlName: string): string {
    if (controlName === 'precio') {
      return this.translate.instant('SERVICE_TIME_MODAL.ERRORS.INVALID_PRICE');
    }
    return this.translate.instant('SERVICE_TIME_MODAL.ERRORS.INVALID_FORMAT');
  }
}
