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
});
