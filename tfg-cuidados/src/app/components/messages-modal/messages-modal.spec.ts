import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessagesModal } from './messages-modal';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { ComunicationService } from '../../services/comunication.service';
import { UserService } from '../../services/user.service';
import { MessageService } from '../../services/message-service';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';

declare var jasmine: any;

describe('MessagesModal', () => {
  let component: MessagesModal;
  let fixture: ComponentFixture<MessagesModal>;
  let authServiceSpy: any;
  let comunicationServiceSpy: any;
  let userServiceSpy: any;
  let messageServiceSpy: any;
  let dialogRefSpy: any;

  const mockDialogRef = { close: jasmine.createSpy('close') };
  const mockAuthService = { currentUser: jasmine.createSpy('currentUser') };
  const mockComunicationService = { insertComunicacion: jasmine.createSpy('insertComunicacion') };
  const mockUserService = { getUserByEmail: jasmine.createSpy('getUserByEmail') };
  const mockMessageService = {
    showMessage: jasmine.createSpy('showMessage'),
    messageData: jasmine.createSpy('messageData').and.returnValue(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesModal, TranslateModule.forRoot(), ReactiveFormsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { modo: 'escribir' } },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ComunicationService, useValue: mockComunicationService },
        { provide: UserService, useValue: mockUserService },
        { provide: MessageService, useValue: mockMessageService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MessagesModal);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService);
    comunicationServiceSpy = TestBed.inject(ComunicationService);
    userServiceSpy = TestBed.inject(UserService);
    messageServiceSpy = TestBed.inject(MessageService);
    dialogRefSpy = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch value in ngOnInit if verMensaje', () => {
    component.data = {
      modo: 'verMensaje',
      contenido: {
        Emisor: { nombre: 'Juan' },
        Receptor: { nombre: 'Pepe' },
        asunto: 'Hola',
        contenido: 'Mundo',
      },
    };
    component.ngOnInit();
    expect(component.mensajeForm.get('emisor')?.value).toBe('Juan');
    expect(component.mensajeForm.disabled).toBe(true);
  });

  it('should patch value in ngOnInit if escribir with receptor', () => {
    component.data = { modo: 'escribir', receptorEmail: 'test@test.com' };
    component.ngOnInit();
    expect(component.mensajeForm.get('receptor')?.value).toBe('test@test.com');
    expect(component.mensajeForm.get('receptor')?.disabled).toBe(true);
  });

  it('enviarMensaje should show error if no currentUser', () => {
    authServiceSpy.currentUser.and.returnValue(null);
    component.mensajeForm.patchValue({ receptor: 'a@a.com', asunto: 'a', contenido: 'a' });

    component.enviarMensaje();
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('enviarMensaje should success flow', () => {
    authServiceSpy.currentUser.and.returnValue({ id_usuario: 1 });
    component.mensajeForm.patchValue({
      receptor: 'dest@dest.com',
      asunto: 'Test',
      contenido: 'Contenido',
    });
    userServiceSpy.getUserByEmail.and.returnValue(of({ id_usuario: 2 }));
    comunicationServiceSpy.insertComunicacion.and.returnValue(of(true));

    component.enviarMensaje();

    expect(comunicationServiceSpy.insertComunicacion).toHaveBeenCalled();
    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'exito');
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('enviarMensaje should handle user not found error', () => {
    authServiceSpy.currentUser.and.returnValue({ id_usuario: 1 });
    component.mensajeForm.patchValue({
      receptor: 'dest@dest.com',
      asunto: 'Test',
      contenido: 'Contenido',
    });
    userServiceSpy.getUserByEmail.and.returnValue(of(null));

    component.enviarMensaje();

    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });

  it('enviarMensaje should handle generic error', () => {
    authServiceSpy.currentUser.and.returnValue({ id_usuario: 1 });
    component.mensajeForm.patchValue({
      receptor: 'dest@dest.com',
      asunto: 'Test',
      contenido: 'Contenido',
    });
    userServiceSpy.getUserByEmail.and.returnValue(throwError(() => new Error('Generic')));

    component.enviarMensaje();

    expect(messageServiceSpy.showMessage).toHaveBeenCalledWith(jasmine.any(String), 'error');
  });
});
