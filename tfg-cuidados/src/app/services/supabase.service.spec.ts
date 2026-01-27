import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';

declare var jasmine: any;
declare var spyOn: any;

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupabaseService],
    });
    service = TestBed.inject(SupabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getClient should return instance', () => {
    const client = service.getClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });
});
