import { TestBed } from '@angular/core/testing';
import { PaginacionEs } from './paginacion-es';

describe('PaginacionEs', () => {
  let service: PaginacionEs;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaginacionEs],
    });
    service = TestBed.inject(PaginacionEs);
  });

  it('should translate labels', () => {
    expect(service.itemsPerPageLabel).toBe('Elementos por página:');
    expect(service.nextPageLabel).toBe('Siguiente página');
  });

  it('getRangeLabel should return correct range', () => {
    expect(service.getRangeLabel(0, 10, 0)).toBe('0 de 0');
    expect(service.getRangeLabel(0, 10, 5)).toBe('1 - 5 de 5');
    expect(service.getRangeLabel(1, 10, 20)).toBe('11 - 20 de 20');
  });
});
