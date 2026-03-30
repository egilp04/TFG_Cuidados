import { TestBed } from '@angular/core/testing';

import { ThemeMode } from './theme-mode';

describe('ThemeMode', () => {
  let service: ThemeMode;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeMode);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
