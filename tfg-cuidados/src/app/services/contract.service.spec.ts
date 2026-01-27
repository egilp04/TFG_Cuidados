import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ContractService } from './contract.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ComunicationService } from './comunication.service';
import { of } from 'rxjs';

declare var jasmine: any;
declare var spyOn: any;

describe('ContractService', () => {
  let service: ContractService;
  let supabaseMock: any;
  let authServiceMock: any;
  let comunicationServiceSpy: any;
  let queryBuilder: any;

  beforeEach(() => {
    queryBuilder = {
      select: jasmine.createSpy('select'),
      insert: jasmine.createSpy('insert'),
      update: jasmine.createSpy('update'),
      delete: jasmine.createSpy('delete'),
      eq: jasmine.createSpy('eq'),
      neq: jasmine.createSpy('neq'),
      or: jasmine.createSpy('or'),
      order: jasmine.createSpy('order'),
      single: jasmine.createSpy('single'),
      maybeSingle: jasmine.createSpy('maybeSingle'),
      // Thenable por defecto
      then: function (resolve: any, reject: any) {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    };

    queryBuilder.select.and.returnValue(queryBuilder);
    queryBuilder.insert.and.returnValue(queryBuilder);
    queryBuilder.update.and.returnValue(queryBuilder);
    queryBuilder.delete.and.returnValue(queryBuilder);
    queryBuilder.eq.and.returnValue(queryBuilder);
    queryBuilder.neq.and.returnValue(queryBuilder);
    queryBuilder.or.and.returnValue(queryBuilder);
    queryBuilder.order.and.returnValue(queryBuilder);
    queryBuilder.single.and.returnValue(queryBuilder); 
    queryBuilder.maybeSingle.and.returnValue(queryBuilder);

    const channelMock = {
      on: jasmine.createSpy('on').and.callFake((e: any, c: any, cb: any) => {
        if (cb) (channelMock as any).callback = cb;
        return channelMock;
      }),
      subscribe: jasmine.createSpy('subscribe'),
    };

    supabaseMock = {
      from: jasmine.createSpy('from').and.returnValue(queryBuilder),
      channel: jasmine.createSpy('channel').and.returnValue(channelMock),
    };

    authServiceMock = {
      currentUser: jasmine
        .createSpy('currentUser')
        .and.returnValue({ id_usuario: 'user1', rol: 'cliente' }),
    };

    comunicationServiceSpy = jasmine.createSpyObj('ComunicationService', ['insertComunicacion']);
    comunicationServiceSpy.insertComunicacion.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        ContractService,
        { provide: SupabaseService, useValue: { getClient: () => supabaseMock } },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ComunicationService, useValue: comunicationServiceSpy },
      ],
    });
    service = TestBed.inject(ContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('refreshContracts should map data correctly', fakeAsync(() => {
    const rawData = [
      {
        id_contrato: '1',
        Cliente: { Usuario: { nombre: 'ClientName' } },
        Empresa: { Usuario: { nombre: 'CompanyName' } },
        id_servicio_horario: { Servicio: { nombre: 'Svc' }, id_servicio_horario: '99' },
      },
    ];

    queryBuilder.then = (resolve: any) => resolve({ data: rawData, error: null });

    service.getContractsObservable().subscribe((contracts) => {
      if (contracts.length > 0) {
        expect(contracts[0].Cliente.nombreDelCliente).toBe('ClientName');
        expect(contracts[0].id_sh_plano).toBe('99');
      }
    });
    tick();
  }));

  it('createContract should return true on success', fakeAsync(() => {
    queryBuilder.then = (resolve: any) => resolve({ error: null });
    service.createContract({} as any).subscribe((res) => expect(res).toBe(true));
    tick();
  }));

  it('deleteContract should notify counterparty', fakeAsync(() => {
    authServiceMock.currentUser.and.returnValue({ id_usuario: 'user1' });
    const mockContract = {
      id_cliente: 'user1',
      id_empresa: 'emp1',
      id_servicio_horario: { Servicio: { nombre: 'Limpieza' } },
      Cliente: { Usuario: { nombre: 'Juan' } },
      Empresa: { Usuario: { nombre: 'Limpiezas SL' } },
    };

    queryBuilder.then = (resolve: any) => resolve({ data: mockContract, error: null });

    service.deleteContract('1').subscribe();
    tick();

    expect(queryBuilder.update).toHaveBeenCalledWith(
      jasmine.objectContaining({ estado: 'no activo' }),
    );
    expect(comunicationServiceSpy.insertComunicacion).toHaveBeenCalled();
  }));
});
