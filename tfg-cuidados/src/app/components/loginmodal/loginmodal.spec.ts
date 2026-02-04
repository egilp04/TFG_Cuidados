import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Loginmodal } from './loginmodal';
import { TranslateModule } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message-service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

declare var jasmine: any;
declare var spyOn: any;

describe('Loginmodal', () => {
  let component: Loginmodal;
  let fixture: ComponentFixture<Loginmodal>;
  let authServiceSpy: any;
  let messageServiceSpy: any;
  let routerSpy: any;
  let dialogRefSpy: any;
  let matDialogSpy: any;

  const mockDialogRef = { close: jasmine.createSpy('close') };
  const mockMatDialog = { closeAll: jasmine.createSpy('closeAll') };

  const mockAuthService = {
    signIn: jasmine.createSpy('signIn'),
    checkEmailExists: jasmine.createSpy('checkEmailExists'),
    recoverPassword: jasmine.createSpy('recoverPassword'),
    resendVerificationEmail: jasmine.createSpy('resendVerificationEmail'),
  };

  const mockMessageService = {
    showMessage: jasmine.createSpy('showMessage'),
    clear: jasmine.createSpy('clear'),
    messageData: jasmine.createSpy('messageData').and.returnValue({ tipo: '', mensaje: '' }),
  };

  const mockRouter = { navigate: jasmine.createSpy('navigate') };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Loginmodal,
        TranslateModule.forRoot(),
        ReactiveFormsModule,
        LucideAngularModule.pick({ Eye, EyeOff }),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { modo: 'login' } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        // Aunque lo pongamos aquí, a veces el standalone lo ignora...
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: Router, useValue: mockRouter },
      ],
    })
      // ...por eso añadimos esto: FORZAR el uso del mock en el componente
      .overrideComponent(Loginmodal, {
        set: {
          providers: [{ provide: MatDialog, useValue: mockMatDialog }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Loginmodal);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService);
    messageServiceSpy = TestBed.inject(MessageService);
    routerSpy = TestBed.inject(Router);
    dialogRefSpy = TestBed.inject(MatDialogRef);
    matDialogSpy = TestBed.inject(MatDialog);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should init with provided mode', () => {
    component.data = { modo: 'registro' };
    component.ngOnInit();
    expect(component.modoActual).toBe('registro');
  });

  it('onEntrar should show error if form invalid', () => {
    component.loginForm.controls['email'].setValue('');
    component.onEntrar();
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('onEntrar should login successfully', () => {
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('Pass1234!');
    authServiceSpy.signIn.and.returnValue(of({ id: 1 }));

    component.onEntrar();

    expect(dialogRefSpy.close).toHaveBeenCalledWith({ loginSuccess: true });
    expect(matDialogSpy.closeAll).toHaveBeenCalled(); // Ahora esto funcionará sin dar error
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('onEntrar should handle email not confirmed error', () => {
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('Pass1234!');
    authServiceSpy.signIn.and.returnValue(throwError(() => ({ message: 'Email not confirmed' })));

    component.onEntrar();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('onEntrar should handle generic login error', () => {
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('Pass1234!');
    authServiceSpy.signIn.and.returnValue(throwError(() => ({ message: 'Other error' })));

    component.onEntrar();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('onRecuperar should error if email invalid', () => {
    component.emailCtrl.setValue('');
    component.onRecuperar();
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('onRecuperar should error if email does not exist', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(false));
    component.onRecuperar();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('onRecuperar should handle connection error on check', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(throwError(() => new Error('err')));
    component.onRecuperar();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('onRecuperar should send recovery email success', fakeAsync(() => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.recoverPassword.and.returnValue(of({ error: null }));

    component.onRecuperar();

    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'exito');
    tick(3000);
    expect(messageServiceSpy.clear).toHaveBeenCalled();
    expect(component.modoActual).toBe('login');
  }));

  it('onRecuperar should handle error from supabase', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.recoverPassword.and.returnValue(of({ error: { message: 'Supabase error' } }));

    component.onRecuperar();
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith('Supabase error', 'error');
  });

  it('onRecuperar should handle http error', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.recoverPassword.and.returnValue(throwError(() => new Error('Http error')));

    component.onRecuperar();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('onReenviarCorreo should error if email invalid', () => {
    component.emailCtrl.setValue('');
    component.onReenviarCorreo();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('onReenviarCorreo should error if email not exists', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(false));
    component.onReenviarCorreo();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('onReenviarCorreo should handle check error', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(throwError(() => new Error('err')));
    component.onReenviarCorreo();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('onReenviarCorreo success', fakeAsync(() => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.resendVerificationEmail.and.returnValue(of({ error: null }));

    component.onReenviarCorreo();

    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'exito');
    tick(2000);
    expect(messageServiceSpy.clear).toHaveBeenCalled();
    expect(component.modoActual).toBe('login');
  }));

  it('onReenviarCorreo handle service error', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.resendVerificationEmail.and.returnValue(of({ error: 'err' }));

    component.onReenviarCorreo();
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('onReenviarCorreo handle http error', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.resendVerificationEmail.and.returnValue(throwError(() => new Error('err')));

    component.onReenviarCorreo();
    expect(authServiceSpy.resendVerificationEmail).toHaveBeenCalled();
  });
});
