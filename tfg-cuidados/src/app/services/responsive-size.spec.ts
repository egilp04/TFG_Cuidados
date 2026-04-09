import { TestBed } from '@angular/core/testing';

import { ResponsiveSize } from './responsive-size';

describe('ResponsiveSize', () => {
  let service: ResponsiveSize;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResponsiveSize);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
