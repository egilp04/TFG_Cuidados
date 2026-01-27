import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Registerform } from './registerform';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { ChevronDown, Eye, EyeOff, LucideAngularModule } from 'lucide-angular';
import { SimpleChange } from '@angular/core';
import { FormControl } from '@angular/forms';

declare var jasmine: any;
declare var spyOn: any;

describe('Registerform', () => {
  let component: Registerform;
  let fixture: ComponentFixture<Registerform>;
  let translateServiceSpy: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Registerform,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ Eye, EyeOff, ChevronDown }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Registerform);
    component = fixture.componentInstance;
    translateServiceSpy = TestBed.inject(TranslateService);

    spyOn(translateServiceSpy, 'instant').and.callFake((key: string) => key);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should switch to company mode when isUser changes', () => {
    component.isUser = false;
    component.ngOnChanges({
      isUser: new SimpleChange(true, false, false),
    });
    const cifControl = component.registerForm.get('cif');
    const ape1Control = component.registerForm.get('ape1');

    cifControl?.setValue('');
    cifControl?.updateValueAndValidity();

    expect(cifControl?.invalid).toBe(true);
    expect(ape1Control?.validator).toBeNull();
  });

  it('should switch to user mode when isUser changes', () => {
    component.isUser = true;
    component.ngOnChanges({
      isUser: new SimpleChange(false, true, false),
    });
    const cifControl = component.registerForm.get('cif');
    const ape1Control = component.registerForm.get('ape1');

    ape1Control?.setValue('');
    ape1Control?.updateValueAndValidity();

    expect(ape1Control?.invalid).toBe(true);
    expect(cifControl?.validator).toBeNull();
  });

  it('should not submit if form is invalid', () => {
    spyOn(component.formSubmitted, 'emit');
    component.onSubmit();
    expect(component.formSubmitted.emit).not.toHaveBeenCalled();
    expect(component.registerForm.touched).toBe(true);
  });

  it('should submit valid user data', () => {
    spyOn(component.formSubmitted, 'emit');
    component.isUser = true;

    (component as any).configurarValidadores();

    const validDNI = '00000000T';
    const today = new Date();
    const adultDate = new Date(today.getFullYear() - 20, 0, 1).toISOString().split('T')[0];

    component.registerForm.patchValue({
      nombre: 'TestUser',
      ape1: 'Surname1',
      ape2: 'Surname2',
      fechnac: adultDate,
      dni: validDNI,
      telef: '123456789',
      email: 'test@test.com',
      direccion: 'Fake St',
      localidad: 'City',
      codpostal: '28001',
      comunidad: 'Madrid',
      password: 'Password1!',
      repassword: 'Password1!',
      termsCondition: true,
    });

    component.onSubmit();

    expect(component.formSubmitted.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        esCliente: true,
        datos: jasmine.objectContaining({
          rol: 'cliente',
          email: 'test@test.com',
        }),
      }),
    );
  });

  it('should submit valid company data', () => {
    spyOn(component.formSubmitted, 'emit');
    component.isUser = false;
    component.ngOnChanges({ isUser: new SimpleChange(true, false, false) });

    component.registerForm.patchValue({
      nombreEmpresa: 'Company S.L.',
      cif: 'B12345678',
      descripcion: 'Tech company',
      telef: '123456789',
      email: 'company@test.com',
      direccion: 'Business Park',
      localidad: 'City',
      codpostal: '28001',
      comunidad: 'Madrid',
      password: 'Password1!',
      repassword: 'Password1!',
      termsCondition: true,
    });

    const cifCtrl = component.registerForm.get('cif');
    cifCtrl?.clearValidators();
    cifCtrl?.updateValueAndValidity();

    component.onSubmit();

    expect(component.formSubmitted.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({
        esCliente: false,
        datos: jasmine.objectContaining({
          rol: 'empresa',
          nombre: 'Company S.L.',
        }),
      }),
    );
  });

  it('passwordMatchValidator should return error on mismatch', () => {
    component.registerForm.patchValue({
      password: 'Pass1',
      repassword: 'Pass2',
    });
    (component as any).passwordMatchValidator(component.registerForm);
    expect(component.registerForm.get('repassword')?.errors).toEqual({ mismatch: true });
  });

  it('passwordMatchValidator should return null on match', () => {
    component.registerForm.patchValue({
      password: 'Pass1',
      repassword: 'Pass1',
    });
    const result = (component as any).passwordMatchValidator(component.registerForm);
    expect(result).toBeNull();
  });

  it('isAdult should validate age', () => {
    const ctrl = new FormControl('');

    expect((component as any).isAdult(ctrl)).toBeNull();

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    ctrl.setValue(futureDate.toISOString());
    expect((component as any).isAdult(ctrl)).toEqual({ invalidDate: true });

    const childDate = new Date();
    childDate.setFullYear(childDate.getFullYear() - 10);
    ctrl.setValue(childDate.toISOString());
    expect((component as any).isAdult(ctrl)).toEqual({ notAdult: true });

    const adultDate = new Date();
    adultDate.setFullYear(adultDate.getFullYear() - 20);
    ctrl.setValue(adultDate.toISOString());
    expect((component as any).isAdult(ctrl)).toBeNull();
  });

  it('dniValidator should validate format and letter', () => {
    const ctrl = new FormControl('');
    expect((component as any).dniValidator(ctrl)).toBeNull();

    ctrl.setValue('123');
    expect((component as any).dniValidator(ctrl)).toEqual({ invalidDniFormat: true });

    ctrl.setValue('00000000Z');
    expect((component as any).dniValidator(ctrl)).toEqual({ invalidDniLetter: true });

    ctrl.setValue('00000000T');
    expect((component as any).dniValidator(ctrl)).toBeNull();
  });

  it('cifValidator should validate CIF logic', () => {
    const ctrl = new FormControl('');
    expect((component as any).cifValidator(ctrl)).toBeNull();

    ctrl.setValue('INVALID');
    expect((component as any).cifValidator(ctrl)).toEqual({ invalidCifFormat: true });

    ctrl.setValue('P12345678');
    expect((component as any).cifValidator(ctrl)).toEqual({ invalidCifChecksum: true });

    ctrl.setValue('A1234567A');
    expect((component as any).cifValidator(ctrl)).toEqual({ invalidCifChecksum: true });

    ctrl.setValue('A58818501');
    expect((component as any).cifValidator(ctrl)).toBeNull();
  });

  it('getErrorMessage should return correct strings', () => {
    const ctrl = component.registerForm.get('email');
    if (ctrl) {
      ctrl.markAsTouched();

      ctrl.setErrors({ required: true });
      expect(component.getErrorMessage('email')).toBe('REGISTER.ERRORS.REQUIRED');

      ctrl.setErrors({ email: true });
      expect(component.getErrorMessage('email')).toBe('REGISTER.ERRORS.EMAIL');
    }

    const passCtrl = component.registerForm.get('password');
    if (passCtrl) {
      passCtrl.markAsTouched();
      passCtrl.setErrors({ minlength: { requiredLength: 6 } });
      expect(component.getErrorMessage('password')).toBe('REGISTER.ERRORS.MIN_LENGTH');
    }

    const termsCtrl = component.registerForm.get('termsCondition');
    if (termsCtrl) {
      termsCtrl.markAsTouched();
      termsCtrl.setErrors({ requiredTrue: true });
      expect(component.getErrorMessage('termsCondition')).toBe('REGISTER.ERRORS.TERMS_REQUIRED');
    }

    const phoneCtrl = component.registerForm.get('telef');
    if (phoneCtrl) {
      phoneCtrl.markAsTouched();
      phoneCtrl.setErrors({ pattern: true });
      expect(component.getErrorMessage('telef')).toBe('REGISTER.ERRORS.PATTERN.PHONE');
    }
  });

  it('should return default pattern message for unknown controls', () => {
    const mockCtrl = new FormControl('');
    component.registerForm.addControl('unknown', mockCtrl);
    mockCtrl.markAsTouched();
    mockCtrl.setErrors({ pattern: true });
    expect(component.getErrorMessage('unknown')).toBe('REGISTER.ERRORS.INVALID');
  });
});
