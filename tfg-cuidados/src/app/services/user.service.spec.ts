import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserService } from './user.service';
import { SupabaseService } from './supabase.service';
declare var jasmine: any;
declare var spyOn: any;
describe('UserService', () => {
  let service: UserService;
  let supabaseMock: any;
  let queryBuilder: any;

  beforeEach(() => {
    // Mock del QueryBuilder para operaciones CRUD
    queryBuilder = {
      select: jasmine.createSpy('select'),
      eq: jasmine.createSpy('eq'),
      neq: jasmine.createSpy('neq'),
      maybeSingle: jasmine.createSpy('maybeSingle'),
      rpc: jasmine.createSpy('rpc'),
      then: function (resolve: any, reject: any) {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    };

    // Configuración de encadenamiento del QueryBuilder
    queryBuilder.select.and.returnValue(queryBuilder);
    queryBuilder.eq.and.returnValue(queryBuilder);
    queryBuilder.neq.and.returnValue(queryBuilder);
    queryBuilder.maybeSingle.and.returnValue(queryBuilder);

    // Mock del Channel para Realtime (Soporta .on().on().subscribe())
    const channelMock = {
      on: jasmine.createSpy('on').and.callFake(() => channelMock), // Retorna 'this' para encadenar .on()
      subscribe: jasmine.createSpy('subscribe').and.returnValue({ unsubscribe: () => {} }),
    };

    // Mock Principal de Supabase
    supabaseMock = {
      from: jasmine.createSpy('from').and.returnValue(queryBuilder),
      channel: jasmine.createSpy('channel').and.returnValue(channelMock),
      rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: null, error: null })),
      getClient: () => supabaseMock, // Self-reference if needed
    };

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: SupabaseService, useValue: { getClient: () => supabaseMock } },
      ],
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getUsersObservable should fetch users and flatten data', fakeAsync(() => {
    const mockData = [
      { id: 1, Cliente: { direccion: 'Calle Falsa 123' }, nombre: 'User 1' },
      { id: 2, Cliente: { direccion: 'Av Siempre Viva' }, nombre: 'User 2' },
    ];
    queryBuilder.then = (resolve: any) => resolve({ data: mockData, error: null });

    service.getUsersObservable('cliente').subscribe((users) => {
      if (users.length > 0) {
        expect(users[0].direccion).toBe('Calle Falsa 123');
        expect(users[0].nombre).toBe('User 1');
      }
    });
    tick();
  }));

  it('deleteUser should call rpc', fakeAsync(() => {
    service.deleteUser('1').subscribe();
    tick();
    expect(supabaseMock.rpc).toHaveBeenCalledWith('eliminar_usuario_total', { id_a_borrar: '1' });
  }));

  it('verifyUniqEmail should return true if no data found', fakeAsync(() => {
    // maybeSingle devuelve null -> el email es único
    queryBuilder.then = (resolve: any) => resolve({ data: null, error: null });

    service.verifyUniqEmail('a@a.com', '1').subscribe((res) => {
      expect(res).toBe(true);
    });
    tick();
  }));

  it('updateProfileDirect should call rpc', fakeAsync(() => {
    service.updateProfileDirect('1', { nombre: 'Test' }, 'cliente').subscribe();
    expect(supabaseMock.rpc).toHaveBeenCalledWith('update_profile_complete', jasmine.any(Object));
    tick();
  }));

  it('getUserByEmail should return user data', fakeAsync(() => {
    const mockUser = { id: 1, email: 'test@test.com' };
    queryBuilder.then = (resolve: any) => resolve({ data: mockUser, error: null });

    service.getUserByEmail('test@test.com').subscribe((res) => {
      expect(res).toBeDefined();
      expect(res.email).toBe('test@test.com');
    });
    tick();
  }));

  it('getUserById should return user data', fakeAsync(() => {
    const mockUser = { id: 1, nombre: 'Test' };
    queryBuilder.then = (resolve: any) => resolve({ data: mockUser, error: null });

    service.getUserById('1').subscribe((res) => {
      expect(res).toBeDefined();
      expect(res.nombre).toBe('Test');
    });
    tick();
  }));
});
