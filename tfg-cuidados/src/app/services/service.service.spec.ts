import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ServiceService } from './service.service';
import { SupabaseService } from './supabase.service';

declare var jasmine: any;
declare var spyOn: any;

describe('ServiceService', () => {
  let service: ServiceService;
  let supabaseMock: any;
  let queryBuilder: any;

  beforeEach(() => {
    queryBuilder = {
      select: jasmine.createSpy('select'),
      insert: jasmine.createSpy('insert'),
      update: jasmine.createSpy('update'),
      delete: jasmine.createSpy('delete'),
      eq: jasmine.createSpy('eq'),
      neq: jasmine.createSpy('neq'),
      ilike: jasmine.createSpy('ilike'),
      order: jasmine.createSpy('order'),
      single: jasmine.createSpy('single'),
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
    queryBuilder.ilike.and.returnValue(queryBuilder);
    queryBuilder.order.and.returnValue(queryBuilder);
    queryBuilder.single.and.returnValue(queryBuilder);

    const channelMock = {
      on: jasmine.createSpy('on').and.returnValue({ subscribe: jasmine.createSpy('subscribe') }),
      subscribe: jasmine.createSpy('subscribe'),
    };

    supabaseMock = {
      from: jasmine.createSpy('from').and.returnValue(queryBuilder),
      channel: jasmine.createSpy('channel').and.returnValue(channelMock),
    };

    TestBed.configureTestingModule({
      providers: [
        ServiceService,
        { provide: SupabaseService, useValue: { getClient: () => supabaseMock } },
      ],
    });
    service = TestBed.inject(ServiceService);
  });

  it('updateService should chain update and eq', fakeAsync(() => {
    spyOn(service as any, 'refreshServices');
    service.updateService('1', {}).subscribe();
    tick();
    expect(queryBuilder.update).toHaveBeenCalled();
    expect(queryBuilder.eq).toHaveBeenCalledWith('id_servicio', '1');
    expect((service as any).refreshServices).toHaveBeenCalled();
  }));

  it('deleteService should chain delete and eq', fakeAsync(() => {
    service.deleteService('1').subscribe();
    tick();
    expect(queryBuilder.delete).toHaveBeenCalled();
    expect(queryBuilder.eq).toHaveBeenCalledWith('id_servicio', '1');
  }));

  it('existsService should use ilike', fakeAsync(() => {
    queryBuilder.then = (resolve: any) => resolve({ data: [{ id: 1 }], error: null });
    service.existsService('Test').subscribe((res) => expect(res).toBe(true));
    tick();
    expect(queryBuilder.ilike).toHaveBeenCalledWith('nombre', 'Test');
  }));
});
