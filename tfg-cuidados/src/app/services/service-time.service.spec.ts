import { TestBed } from '@angular/core/testing';

import { ServiceTimeService } from './service-time.service';

describe('ServiceTimeService', () => {
  let service: ServiceTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
