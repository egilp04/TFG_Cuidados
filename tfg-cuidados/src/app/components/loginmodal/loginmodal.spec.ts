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
    messageData: jasmine.createSpy('messageData').and.returnValue({ type: '', mensaje: '' }),
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
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'login' } },
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
    component.data = { mode: 'registro' };
    component.ngOnInit();
    expect(component.modeActual).toBe('registro');
  });

  it('toEnterApp should show error if form invalid', () => {
    component.loginForm.controls['email'].setValue('');
    component.toEnterApp();
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('toEnterApp should login successfully', () => {
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('Pass1234!');
    authServiceSpy.signIn.and.returnValue(of({ id: 1 }));

    component.toEnterApp();

    expect(dialogRefSpy.close).toHaveBeenCalledWith({ loginSuccess: true });
    expect(matDialogSpy.closeAll).toHaveBeenCalled(); // Ahora esto funcionará sin dar error
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('toEnterApp should handle email not confirmed error', () => {
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('Pass1234!');
    authServiceSpy.signIn.and.returnValue(throwError(() => ({ message: 'Email not confirmed' })));

    component.toEnterApp();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('toEnterApp should handle generic login error', () => {
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('Pass1234!');
    authServiceSpy.signIn.and.returnValue(throwError(() => ({ message: 'Other error' })));

    component.toEnterApp();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('toRecoverPasswd should error if email invalid', () => {
    component.emailCtrl.setValue('');
    component.toRecoverPasswd();
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('toRecoverPasswd should error if email does not exist', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(false));
    component.toRecoverPasswd();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('toRecoverPasswd should handle connection error on check', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(throwError(() => new Error('err')));
    component.toRecoverPasswd();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('toRecoverPasswd should send recovery email success', fakeAsync(() => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.recoverPassword.and.returnValue(of({ error: null }));

    component.toRecoverPasswd();

    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'sucess');
    tick(3000);
    expect(messageServiceSpy.clear).toHaveBeenCalled();
    expect(component.modeActual).toBe('login');
  }));

  it('toRecoverPasswd should handle error from supabase', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.recoverPassword.and.returnValue(of({ error: { message: 'Supabase error' } }));

    component.toRecoverPasswd();
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith('Supabase error', 'error');
  });

  it('toRecoverPasswd should handle http error', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.recoverPassword.and.returnValue(throwError(() => new Error('Http error')));

    component.toRecoverPasswd();
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('toRecoverEmailhould error if email invalid', () => {
    component.emailCtrl.setValue('');
    component.toRecoverEmail;
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('toRecoverEmailhould error if email not exists', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(false));
    component.toRecoverEmail;
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('toRecoverEmailhould handle check error', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(throwError(() => new Error('err')));
    component.toRecoverEmail;
    expect(messageServiceSpy.showMessage).toHaveBeenCalled();
  });

  it('toRecoverEmailuccess', fakeAsync(() => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.resendVerificationEmail.and.returnValue(of({ error: null }));

    component.toRecoverEmail;

    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'sucess');
    tick(2000);
    expect(messageServiceSpy.clear).toHaveBeenCalled();
    expect(component.modeActual).toBe('login');
  }));

  it('toRecoverEmailandle service error', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.resendVerificationEmail.and.returnValue(of({ error: 'err' }));

    component.toRecoverEmail;
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('toRecoverEmailandle http error', () => {
    component.emailCtrl.setValue('test@test.com');
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    authServiceSpy.resendVerificationEmail.and.returnValue(throwError(() => new Error('err')));

    component.toRecoverEmail;
    expect(authServiceSpy.resendVerificationEmail).toHaveBeenCalled();
  });
});
