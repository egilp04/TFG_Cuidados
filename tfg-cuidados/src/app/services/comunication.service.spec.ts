import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ComunicationService } from './comunication.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { of } from 'rxjs';

declare var jasmine: any;
declare var spyOn: any;

describe('ComunicationService', () => {
  let service: ComunicationService;
  let supabaseMock: any;
  let authServiceMock: any;
  let queryBuilder: any;

  beforeEach(() => {
    // 1. Mock Universal Thenable
    queryBuilder = {
      select: jasmine.createSpy('select'),
      insert: jasmine.createSpy('insert'),
      update: jasmine.createSpy('update'),
      delete: jasmine.createSpy('delete'),
      eq: jasmine.createSpy('eq'),
      or: jasmine.createSpy('or'),
      order: jasmine.createSpy('order'),
      single: jasmine.createSpy('single'),
      // Importante: método then para que RxJS lo trate como promesa
      then: function (resolve: any, reject: any) {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    };
    queryBuilder.select.and.returnValue(queryBuilder);
    queryBuilder.insert.and.returnValue(queryBuilder);
    queryBuilder.update.and.returnValue(queryBuilder);
    queryBuilder.eq.and.returnValue(queryBuilder);
    queryBuilder.or.and.returnValue(queryBuilder);
    queryBuilder.order.and.returnValue(queryBuilder);
    queryBuilder.single.and.callFake(() => {
      const p: any = Promise.resolve({ data: { id_comunicacion: '1' }, error: null });
      return p;
    });

    // 2. Mock Channel Completo
    const channelMock = {
      on: jasmine.createSpy('on').and.returnValue({
        on: jasmine.createSpy('on').and.returnValue({
          subscribe: jasmine.createSpy('subscribe'),
        }),
        subscribe: jasmine.createSpy('subscribe'),
      }),
      subscribe: jasmine.createSpy('subscribe'),
    };

    supabaseMock = {
      from: jasmine.createSpy('from').and.returnValue(queryBuilder),
      channel: jasmine.createSpy('channel').and.returnValue(channelMock),
    };

    authServiceMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id_usuario: 'user1' }),
    };

    TestBed.configureTestingModule({
      providers: [
        ComunicationService,
        { provide: SupabaseService, useValue: { getClient: () => supabaseMock } },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
    service = TestBed.inject(ComunicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMessagesObservable should fetch and update list', fakeAsync(() => {
    service.getMessagesObservable().subscribe();
    tick();
    expect(supabaseMock.from).toHaveBeenCalledWith('Comunicacion');
  }));

  it('getUnreadMessagesCount should count ONLY unread messages for the current user', fakeAsync(() => {
    authServiceMock.currentUser.and.returnValue({ id_usuario: 'user1' });
    const messages = [
      { id_receptor: 'user1', leido: false },
      { id_receptor: 'user1', leido: true },
      { id_receptor: 'other', leido: false },
      { id_receptor: 'user1', leido: false },
    ];
    (service as any).mensajesList$.next(messages);

    service.getUnreadMessagesCount().subscribe((count: number) => {
      expect(count).toBe(2);
    });
  }));

  it('insertComunicacion should throw error on invalid type', fakeAsync(() => {
    service.insertComunicacion({ tipo_comunicacion: 'invalid' } as any).subscribe({
      error: (err: any) => expect(err).toBeDefined(),
    });
  }));

  it('insertComunicacion (mensaje) should trigger sendNotification', fakeAsync(() => {
    spyOn(service as any, 'sendNotification').and.returnValue(of(null));
    const msg: any = { tipo_comunicacion: 'mensaje', id_receptor: 'r1' };
    queryBuilder.then = (resolve: any) => resolve({ error: null });

    service.insertComunicacion(msg).subscribe();
    tick();

    expect(supabaseMock.from).toHaveBeenCalledWith('Comunicacion');
    expect((service as any).sendNotification).toHaveBeenCalled();
  }));

  it('deleteComunicacion should mark deleted_by_emisor', fakeAsync(() => {
    const msg: any = {
      id_comunicacion: '1',
      tipo_comunicacion: 'mensaje',
      id_emisor: 'user1',
      id_receptor: 'other',
    };
    (service as any).mensajesList$.next([msg]);

    service.deleteComunicacion(msg).subscribe();
    tick();

    expect(supabaseMock.from().update).toHaveBeenCalledWith({ eliminado_por_emisor: true });
  }));

  it('notifyAdmins should find admins and send notifications', fakeAsync(() => {
    const adminsData = [{ id_usuario: 'admin1' }];
    queryBuilder.then = (resolve: any) => resolve({ data: adminsData, error: null });
    spyOn(service as any, 'sendNotification').and.returnValue(of(null));
    service.notifyAdmins('Subject', 'Body').subscribe();
    tick();
    expect((service as any).sendNotification).toHaveBeenCalledWith('admin1', 'Subject', 'Body');
  }));
});
