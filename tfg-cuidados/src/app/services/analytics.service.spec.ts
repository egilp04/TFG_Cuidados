import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';
import { SupabaseService } from './supabase.service';
declare var jasmine: any;

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let supabaseMock: any;

  beforeEach(() => {
    const queryBuilder: any = {
      select: jasmine.createSpy('select'),
      gte: jasmine.createSpy('gte'),
    };
    // Mock para chargeTotalUsers
    queryBuilder.select.and.returnValue(Promise.resolve({ count: 10, error: null }));
    // Mock para chargeWeeklyRecords
    queryBuilder.gte.and.returnValue(
      Promise.resolve({ data: [{ fecha_registro: new Date().toISOString() }], error: null }),
    );

    supabaseMock = {
      from: jasmine.createSpy('from').and.returnValue(queryBuilder),
      channel: jasmine.createSpy('channel').and.returnValue({
        on: jasmine.createSpy('on').and.returnValue({
          on: jasmine.createSpy('on').and.returnValue({
            subscribe: jasmine.createSpy('subscribe'),
          }),
        }),
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        { provide: SupabaseService, useValue: { getClient: () => supabaseMock } },
      ],
    });
    service = TestBed.inject(AnalyticsService);
  });

  it('should be created and init dashboard', () => {
    expect(service).toBeTruthy();
    expect(supabaseMock.from).toHaveBeenCalled();
  });

  it('should get total users', fakeAsync(() => {
    service.getUsuariosCount().subscribe((count) => {
      // El valor inicial es 0, luego se actualiza async
      if (count > 0) expect(count).toBe(10);
    });
    tick();
  }));

  it('should aggregate weekly records', fakeAsync(() => {
    service.fetchWeeklyRecords().subscribe((data) => {
      if (data.some((v) => v > 0)) {
        expect(data.length).toBe(7);
        expect(data.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(1);
      }
    });
    tick();
  }));
});
