import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { ComunicationService } from './comunication.service';
import { Injector } from '@angular/core';
import { of } from 'rxjs';

declare var jasmine: any;

const createSupabaseMock = () => {
  const queryBuilder: any = {
    select: jasmine.createSpy('select'),
    insert: jasmine.createSpy('insert'),
    update: jasmine.createSpy('update'),
    delete: jasmine.createSpy('delete'),
    eq: jasmine.createSpy('eq'),
    single: jasmine.createSpy('single'),
    maybeSingle: jasmine.createSpy('maybeSingle'),
  };

  queryBuilder.select.and.returnValue(queryBuilder);
  queryBuilder.insert.and.returnValue(queryBuilder);
  queryBuilder.update.and.returnValue(queryBuilder);
  queryBuilder.delete.and.returnValue(queryBuilder);
  queryBuilder.eq.and.returnValue(queryBuilder);
  queryBuilder.single.and.returnValue(
    Promise.resolve({ data: { rol: 'cliente', id_usuario: '123' }, error: null }),
  );
  queryBuilder.maybeSingle.and.returnValue(Promise.resolve({ data: null, error: null }));

  return {
    from: jasmine.createSpy('from').and.returnValue(queryBuilder),
    rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: false, error: null })),
    auth: {
      getUser: jasmine
        .createSpy('getUser')
        .and.returnValue(Promise.resolve({ data: { user: { id: '123' } } })),
      signInWithPassword: jasmine
        .createSpy('signInWithPassword')
        .and.returnValue(Promise.resolve({ data: { user: { id: '123' } }, error: null })),
      signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve({ error: null })),
      signUp: jasmine
        .createSpy('signUp')
        .and.returnValue(
          Promise.resolve({ data: { user: { id: '123', identities: [{}] } }, error: null }),
        ),
      updateUser: jasmine
        .createSpy('updateUser')
        .and.returnValue(Promise.resolve({ data: {}, error: null })),
      resetPasswordForEmail: jasmine
        .createSpy('resetPasswordForEmail')
        .and.returnValue(Promise.resolve({ data: {}, error: null })),
      resend: jasmine
        .createSpy('resend')
        .and.returnValue(Promise.resolve({ data: {}, error: null })),
    },
    queryBuilder,
  };
};

describe('AuthService', () => {
  let service: AuthService;
  let supabaseMock: any;
  let comunicationServiceSpy: any;

  beforeEach(() => {
    supabaseMock = createSupabaseMock();
    comunicationServiceSpy = jasmine.createSpyObj('ComunicationService', ['notifyAdmins']);
    comunicationServiceSpy.notifyAdmins.and.returnValue(of(true));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: { getClient: () => supabaseMock } },
        { provide: ComunicationService, useValue: comunicationServiceSpy },
        Injector,
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('signIn should success', fakeAsync(() => {
    service.signIn('a@a.com', '123').subscribe((u) => {
      expect(u).toBeDefined();
      expect(service.currentUser()).toEqual(jasmine.objectContaining({ id_usuario: '123' }));
    });
    tick();
  }));

  it('signIn should handle error', fakeAsync(() => {
    supabaseMock.auth.signInWithPassword.and.returnValue(
      Promise.resolve({ error: { message: 'err' } }),
    );
    service.signIn('a', 'b').subscribe({ error: (e) => expect(e.message).toBe('err') });
    tick();
  }));

  it('register should call signUp and notify', fakeAsync(() => {
    service.register({ email: 'new@a.com' }, true).subscribe(() => {
      expect(supabaseMock.auth.signUp).toHaveBeenCalled();
      expect(comunicationServiceSpy.notifyAdmins).toHaveBeenCalled();
    });
    tick();
  }));

  it('register should fail if email exists', fakeAsync(() => {
    supabaseMock.rpc.and.returnValue(Promise.resolve({ data: true, error: null }));
    service.register({ email: 'old@a.com' }, true).subscribe({
      error: (e) => expect(e.message).toContain('registrado'),
    });
    tick();
  }));

  it('recoverPassword should call reset', fakeAsync(() => {
    service.recoverPassword('a@a.com').subscribe();
    expect(supabaseMock.auth.resetPasswordForEmail).toHaveBeenCalled();
    tick();
  }));

  it('checkEmailExists should return boolean', fakeAsync(() => {
    supabaseMock.rpc.and.returnValue(Promise.resolve({ data: true }));
    service.checkEmailExists('a').subscribe((r) => expect(r).toBe(true));
    tick();
  }));
});
