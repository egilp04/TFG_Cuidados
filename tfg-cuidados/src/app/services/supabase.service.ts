import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://gbcmgioreyvuyhxrirgx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiY21naW9yZXl2dXloeHJpcmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTc4NjAsImV4cCI6MjA3NzUzMzg2MH0.nyAQmDfjuxzqdAi2u8PwTv99hrCZ5THcoEP3ek6mReQ'
    );
  }
  getClient() {
    return this.supabase;
  }
}
