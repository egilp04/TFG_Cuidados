import { TestBed } from '@angular/core/testing';

import { BusinessService } from './business.service';

describe('BusinessServiceF', () => {
  let service: BusinessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusinessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
