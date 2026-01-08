import { TestBed } from '@angular/core/testing';

import { PaginacionEs } from './paginacion-es';

describe('PaginacionEs', () => {
  let service: PaginacionEs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginacionEs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
