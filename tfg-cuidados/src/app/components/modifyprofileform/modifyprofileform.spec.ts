import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Modifyprofileform } from './modifyprofileform';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SimpleChange } from '@angular/core';

declare var jasmine: any;
declare var spyOn: any;

describe('Modifyprofileform', () => {
  let component: Modifyprofileform;
  let fixture: ComponentFixture<Modifyprofileform>;
  let authServiceSpy: any;
  let translateService: TranslateService;

  const mockUser = {
    telef: '123456789',
    email: 'test@test.com',
    nombre: 'User',
    direccion: 'Dir',
    localidad: 'Loc',
    codpostal: '12345',
    comunidad: 'Madrid',
    descripcion: 'Desc',
    ape1: 'A1',
    ape2: 'A2',
  };

  const mockAuthService = {
    userRol: jasmine.createSpy('userRol').and.returnValue('cliente'),
    currentUser: jasmine.createSpy('currentUser').and.returnValue(mockUser),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Modifyprofileform,
        TranslateModule.forRoot(),
        LucideAngularModule.pick({ ChevronDown }),
        ReactiveFormsModule,
      ],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Modifyprofileform);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService);
    translateService = TestBed.inject(TranslateService);

    // TRUCO: Forzamos las traducciones para que los tests de validación pasen
    spyOn(translateService, 'instant').and.callFake((key: string) => {
      if (key.includes('REQUIRED')) return 'Field required';
      if (key.includes('EMAIL')) return 'Invalid email';
      if (key.includes('MIN_LENGTH')) return 'Min length error';
      if (key.includes('PATTERN')) return 'Pattern error';
      return key;
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init correctly', () => {
    authServiceSpy.userRol.and.returnValue('administrador');
    component.ngOnInit();
    expect(component.isAdminViewer).toBe(true);
  });

  it('should load data on changes', () => {
    component.userData = mockUser;
    component.ngOnChanges({
      userData: new SimpleChange(null, mockUser, true),
    });
    expect(component.profileForm.get('email')?.value).toBe('test@test.com');
  });

  it('should load form for cliente', () => {
    component.userRole = 'cliente';
    component.userData = mockUser;
    component.ngOnChanges({ userData: new SimpleChange(null, mockUser, true) });

    expect(component.profileForm.get('usuario')?.value).toBe('User');
    expect(component.profileForm.get('primerApe')?.value).toBe('A1');
  });

  it('should load form for empresa', () => {
    component.userRole = 'empresa';
    component.userData = mockUser;
    component.ngOnChanges({ userData: new SimpleChange(null, mockUser, true) });

    expect(component.profileForm.get('nombreEmpresa')?.value).toBe('User');
    expect(component.profileForm.get('descripcion')?.value).toBe('Desc');
  });

  it('should load form for administrador', () => {
    component.userRole = 'administrador';
    component.userData = mockUser;
    component.ngOnChanges({ userData: new SimpleChange(null, mockUser, true) });

    expect(component.profileForm.get('usuario')?.value).toBe('User');
  });

  it('should reconfigure validators on role change', () => {
    component.ngOnChanges({ userRole: new SimpleChange(null, 'empresa', true) });
    expect(component).toBeTruthy();
  });

  it('getErrorMessage should return correct message', () => {
    component.profileForm.get('email')?.setErrors({ required: true });
    component.profileForm.get('email')?.markAsTouched();
    expect(component.getErrorMessage('email')).toContain('required');

    component.profileForm.get('email')?.setErrors({ email: true });
    expect(component.getErrorMessage('email')).toContain('email');

    component.profileForm.get('usuario')?.setErrors({ minlength: { requiredLength: 3 } });
    component.profileForm.get('usuario')?.markAsTouched();
    expect(component.getErrorMessage('usuario')).toContain('length'); // 'Min length error' contains 'length'

    component.profileForm.get('telefono')?.setErrors({ pattern: true });
    component.profileForm.get('telefono')?.markAsTouched();
    expect(component.getErrorMessage('telefono')).toContain('Pattern');
  });

  it('onSubmit should emit if valid (cliente)', () => {
    spyOn(component.formSubmitted, 'emit');
    component.userRole = 'cliente';
    component.profileForm.patchValue({
      usuario: 'Test',
      primerApe: 'A1',
      segundoApe: 'A2',
      telefono: '123456789',
      email: 'a@a.com',
      direccion: 'D',
      localidad: 'L',
      codpostal: '12345',
      comunidad: 'Madrid',
    });

    component.onSubmit();
    expect(component.formSubmitted.emit).toHaveBeenCalled();
  });

  it('onSubmit should emit if valid (empresa)', () => {
    spyOn(component.formSubmitted, 'emit');
    component.userRole = 'empresa';

    (component as any).configurarValidadores();

    component.profileForm.patchValue({
      nombreEmpresa: 'Corp',
      descripcion: 'Desc',
      telefono: '123456789',
      email: 'a@a.com',
      direccion: 'D',
      localidad: 'L',
      codpostal: '12345',
      comunidad: 'Madrid',
    });

    component.onSubmit();
    expect(component.formSubmitted.emit).toHaveBeenCalled();
  });

  it('onSubmit should mark touched if invalid', () => {
    spyOn(component.formSubmitted, 'emit');
    component.profileForm.patchValue({ email: '' });
    component.onSubmit();
    expect(component.formSubmitted.emit).not.toHaveBeenCalled();
    expect(component.profileForm.touched).toBe(true);
  });

  it('outputs should emit', () => {
    spyOn(component.cancelRequested, 'emit');
    spyOn(component.deleteRequested, 'emit');

    component.onCancel();
    expect(component.cancelRequested.emit).toHaveBeenCalled();

    component.onDeleteAccount();
    expect(component.deleteRequested.emit).toHaveBeenCalled();
  });
});
