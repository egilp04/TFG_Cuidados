import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ServiceTimeService } from './service-time.service';
import { SupabaseService } from './supabase.service';
import { of } from 'rxjs';

declare var jasmine: any;
declare var spyOn: any;

describe('ServiceTimeService', () => {
  let service: ServiceTimeService;
  let supabaseMock: any;
  let queryBuilder: any;

  beforeEach(() => {
    queryBuilder = {
      select: jasmine.createSpy('select'),
      insert: jasmine.createSpy('insert'),
      update: jasmine.createSpy('update'),
      delete: jasmine.createSpy('delete'),
      eq: jasmine.createSpy('eq'),
      order: jasmine.createSpy('order'),
      then: function (resolve: any, reject: any) {
        return Promise.resolve({ data: [], error: null }).then(resolve, reject);
      },
    };

    queryBuilder.select.and.returnValue(queryBuilder);
    queryBuilder.insert.and.returnValue(queryBuilder);
    queryBuilder.update.and.returnValue(queryBuilder);
    queryBuilder.delete.and.returnValue(queryBuilder);
    queryBuilder.eq.and.returnValue(queryBuilder);
    queryBuilder.order.and.returnValue(queryBuilder);

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
      removeAllChannels: jasmine.createSpy('removeAllChannels'),
    };

    TestBed.configureTestingModule({
      providers: [
        ServiceTimeService,
        { provide: SupabaseService, useValue: { getClient: () => supabaseMock } },
      ],
    });
    service = TestBed.inject(ServiceTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getServiceTimeByEmpresa should init session', fakeAsync(() => {
    service.getServiceTimeByEmpresa('emp1').subscribe();
    tick();
    expect(supabaseMock.channel).toHaveBeenCalledWith('public:Servicio_Horario:emp1');
  }));

  it('insertServiceTime should call refreshList if context exists', fakeAsync(() => {
    spyOn(service as any, 'refreshList');
    (service as any).currentIdEmpresa = 'emp1';

    service.insertServiceTime({} as any).subscribe();
    tick();

    expect(queryBuilder.insert).toHaveBeenCalled();
    expect((service as any).refreshList).toHaveBeenCalledWith('emp1');
  }));

  it('deleteServiceTime should filter list locally', fakeAsync(() => {
    const initialList = [{ id_servicio_horario: '1' }, { id_servicio_horario: '2' }];
    (service as any).serviceTimeList$.next(initialList);
    (service as any).currentIdEmpresa = 'emp1';
    spyOn(service as any, 'refreshList');
    service.deleteServiceTime('1').subscribe();
    tick();
    const current = (service as any).serviceTimeList$.getValue();
    expect(current.length).toBe(1);
    expect(current[0].id_servicio_horario).toBe('2');
    expect((service as any).refreshList).toHaveBeenCalled();
  }));
});
