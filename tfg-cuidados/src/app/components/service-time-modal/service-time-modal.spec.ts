import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceTimeModal } from './service-time-modal';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ServiceTimeService } from '../../services/service-time.service';
import { ServiceService } from '../../services/service.service';
import { TimeService } from '../../services/time.service';
import { AuthService } from '../../services/auth.service';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';

declare var jasmine: any;
declare var spyOn: any;

describe('ServiceTimeModal', () => {
  let component: ServiceTimeModal;
  let fixture: ComponentFixture<ServiceTimeModal>;
  let serviceTimeServiceSpy: any;
  let dialogRefSpy: any;
  let translateServiceSpy: any;

  // Mocks
  const mockDialogRef = { close: jasmine.createSpy('close') };

  const mockServiceTimeService = {
    insertServiceTime: jasmine.createSpy('insertServiceTime').and.returnValue(of({})),
    updateServiceTime: jasmine.createSpy('updateServiceTime').and.returnValue(of({})),
  };

  const mockServiceService = {
    getServicesObservable: jasmine.createSpy('getServicesObservable').and.returnValue(of([])),
  };

  const mockTimeService = {
    getTimesObservable: jasmine.createSpy('getTimesObservable').and.returnValue(of([])),
  };

  const mockAuthService = {
    currentUser: jasmine.createSpy('currentUser').and.returnValue({ id_usuario: 123 }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServiceTimeModal,
        TranslateModule.forRoot(),
        ReactiveFormsModule,
        LucideAngularModule.pick({ ChevronDown }),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ServiceTimeService, useValue: mockServiceTimeService },
        { provide: ServiceService, useValue: mockServiceService },
        { provide: TimeService, useValue: mockTimeService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceTimeModal);
    component = fixture.componentInstance;

    serviceTimeServiceSpy = TestBed.inject(ServiceTimeService);
    dialogRefSpy = TestBed.inject(MatDialogRef);
    translateServiceSpy = TestBed.inject(TranslateService);
    spyOn(translateServiceSpy, 'instant').and.callFake((key: string) => key);
    mockDialogRef.close.calls.reset();
    mockServiceTimeService.insertServiceTime.calls.reset();
    mockServiceTimeService.updateServiceTime.calls.reset();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Tests de Inicialización ---

  it('should patch id_empresa on init if not editing (Create Mode)', () => {
    expect(component.form.get('id_empresa')?.value).toBe(123);
    expect(component.isEditing).toBe(false);
  });

  it('should initialize form with data if editing (Edit Mode)', () => {
    TestBed.resetTestingModule();
    const editData = {
      id_servicio_horario: 99,
      id_servicio: 1,
      id_horario: 2,
      id_empresa: 55,
      precio: '10.50',
      descripcion: 'Test Edit',
    };

    TestBed.configureTestingModule({
      imports: [
        ServiceTimeModal,
        TranslateModule.forRoot(),
        ReactiveFormsModule,
        LucideAngularModule.pick({ ChevronDown }),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: editData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: ServiceTimeService, useValue: mockServiceTimeService },
        { provide: ServiceService, useValue: mockServiceService },
        { provide: TimeService, useValue: mockTimeService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    const fixtureEdit = TestBed.createComponent(ServiceTimeModal);
    const appEdit = fixtureEdit.componentInstance;
    fixtureEdit.detectChanges();

    expect(appEdit.isEditing).toBe(true);
    expect(appEdit.form.get('descripcion')?.value).toBe('Test Edit');
    expect(appEdit.form.get('precio')?.value).toBe('10.50');
  });

  // --- Tests de Guardado (Save) ---

  it('should not save if form is invalid', () => {
    // 1. Invalidar el formulario explícitamente
    component.form.setErrors({ invalid: true });
    component.form.updateValueAndValidity();
    component.save();

    // 3. Verificar que NO se llamó al servicio
    expect(serviceTimeServiceSpy.insertServiceTime).not.toHaveBeenCalled();
    expect(serviceTimeServiceSpy.updateServiceTime).not.toHaveBeenCalled();
  });

  it('should call insertServiceTime when saving in create mode', () => {
    component.form.patchValue({
      id_servicio: 1,
      id_horario: 1,
      precio: '10',
      descripcion: 'Nuevo Servicio',
    });

    component.save();

    expect(serviceTimeServiceSpy.insertServiceTime).toHaveBeenCalled();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should call updateServiceTime when saving in edit mode', () => {
    component.isEditing = true;
    component.data = { id_servicio_horario: 99 };
    component.form.patchValue({
      id_servicio: 1,
      id_horario: 1,
      precio: '20',
      descripcion: 'Update',
    });
    serviceTimeServiceSpy.insertServiceTime.and.returnValue(of({ success: true }));
    component.save();

    expect(serviceTimeServiceSpy.updateServiceTime).toHaveBeenCalledWith(99, jasmine.any(Object));
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should log error and NOT close dialog if save fails', () => {
    spyOn(console, 'error');

    // 1. Configurar el spy para devolver un error observable
    serviceTimeServiceSpy.insertServiceTime.and.returnValue(
      throwError(() => new Error('Simulated Error')),
    );

    component.form.patchValue({
      id_servicio: 1,
      id_horario: 1,
      precio: '10',
      descripcion: 'Fail',
    });
    component.save();
    expect(console.error).toHaveBeenCalled();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  // --- Tests de Utilidades y Errores ---

  it('getCtrl should return a control', () => {
    const ctrl = component.getCtrl('precio');
    expect(ctrl).toBeTruthy();
  });

  it('getErrorMessage should return correct messages', () => {
    expect(component.getErrorMessage('precio')).toBe('');

    const precioCtrl = component.form.get('precio');
    precioCtrl?.markAsTouched();
    precioCtrl?.setErrors({ required: true });

    expect(component.getErrorMessage('precio')).toBe('SERVICE_TIME_MODAL.ERRORS.REQUIRED');

    precioCtrl?.setErrors({ min: { min: 0 } });
    expect(component.getErrorMessage('precio')).toBe('SERVICE_TIME_MODAL.ERRORS.MIN_VALUE');

    precioCtrl?.setErrors({ pattern: true });
    expect(component.getErrorMessage('precio')).toBe('SERVICE_TIME_MODAL.ERRORS.INVALID_PRICE');

    const descCtrl = component.form.get('descripcion');
    descCtrl?.markAsTouched();
    descCtrl?.setErrors({ pattern: true });
    expect(component.getErrorMessage('descripcion')).toBe(
      'SERVICE_TIME_MODAL.ERRORS.INVALID_FORMAT',
    );

    precioCtrl?.setErrors({ unknownError: true });
    expect(component.getErrorMessage('precio')).toBe('SERVICE_TIME_MODAL.ERRORS.INVALID_FIELD');
  });
});
