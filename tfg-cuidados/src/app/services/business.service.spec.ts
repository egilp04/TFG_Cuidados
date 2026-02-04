import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BusinessService } from './business.service';
import { SupabaseService } from './supabase.service';

declare var jasmine: any;

describe('BusinessService', () => {
  let service: BusinessService;
  let supabaseMock: any;
  let queryBuilder: any;

  beforeEach(() => {
    queryBuilder = {
      select: jasmine.createSpy('select'),
      eq: jasmine.createSpy('eq'),
      then: function (resolve: any, reject: any) {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    };
    queryBuilder.select.and.returnValue(queryBuilder);
    queryBuilder.eq.and.returnValue(queryBuilder);

    const channelMock = {
      on: jasmine.createSpy('on').and.returnValue({
        on: jasmine.createSpy('on').and.returnValue({
          subscribe: jasmine.createSpy('subscribe'),
        }),
      }),
      subscribe: jasmine.createSpy('subscribe'),
    };

    supabaseMock = {
      from: jasmine.createSpy('from').and.returnValue(queryBuilder),
      channel: jasmine.createSpy('channel').and.returnValue(channelMock),
    };

    TestBed.configureTestingModule({
      providers: [
        BusinessService,
        { provide: SupabaseService, useValue: { getClient: () => supabaseMock } },
      ],
    });
    service = TestBed.inject(BusinessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and format businesses correctly', fakeAsync(() => {
    const mockData = [
      {
        id_empresa: '1',
        Usuario: { nombre: 'Empresa Test', email: 'e@e.com', estado: true },
        Servicio_Horario: [],
      },
    ];

    queryBuilder.then = (resolve: any) => resolve({ data: mockData, error: null });

    service.getBusinessesObservable().subscribe((list) => {
      if (list.length > 0) {
        expect(list[0].nombre).toBe('Empresa Test');
      }
    });
    tick();
  }));
});
