import { TestBed } from '@angular/core/testing';

import { DocsPdf } from './docs-pdf';

describe('DocsPdf', () => {
  let service: DocsPdf;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocsPdf);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
