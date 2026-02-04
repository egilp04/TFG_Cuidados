import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TimeService } from './time.service';
import { SupabaseService } from './supabase.service';

declare var jasmine: any;
declare var spyOn: any;

describe('TimeService', () => {
  let service: TimeService;
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
    queryBuilder.neq.and.returnValue(queryBuilder);
    queryBuilder.order.and.returnValue(queryBuilder);

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
        TimeService,
        { provide: SupabaseService, useValue: { getClient: () => supabaseMock } },
      ],
    });
    service = TestBed.inject(TimeService);
  });

  it('getTimesObservable should chain orders correctly', fakeAsync(() => {
    service.getTimesObservable().subscribe();
    tick();
    expect(queryBuilder.select).toHaveBeenCalled();
    expect(queryBuilder.order).toHaveBeenCalledTimes(2);
  }));

  it('updateTime should chain update and eq', fakeAsync(() => {
    service.updateTime('1', {}).subscribe();
    tick();
    expect(queryBuilder.update).toHaveBeenCalled();
    expect(queryBuilder.eq).toHaveBeenCalledWith('id_horario', '1');
  }));

  it('deleteTime should chain delete and eq', fakeAsync(() => {
    service.deleteTime('1').subscribe();
    tick();
    expect(queryBuilder.delete).toHaveBeenCalled();
    expect(queryBuilder.eq).toHaveBeenCalledWith('id_horario', '1');
  }));

  it('existsTime should return true if data found', fakeAsync(() => {
    queryBuilder.then = (resolve: any) => resolve({ data: [{ id: 1 }], error: null });
    service.existsTime('Lunes', '10:00').subscribe((exists) => {
      expect(exists).toBe(true);
    });
    tick();
  }));
});
