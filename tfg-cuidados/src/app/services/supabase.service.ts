import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
/**
 * @description Proveedor centralizado del cliente de Supabase.
 * Actúa como un Singleton que encapsula la configuración de conexión y
 * las credenciales de la API, exponiendo una instancia única del cliente
 * para ser consumida por el resto de los servicios del sistema.
 */
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  /**
   * Inicializa la conexión con el motor de base de datos y autenticación.
   * La instancia de SupabaseClient permite realizar operaciones de persistencia,
   * gestión de archivos y suscripciones en tiempo real.
   */
  constructor() {
    this.supabase = createClient(
      'https://gbcmgioreyvuyhxrirgx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiY21naW9yZXl2dXloeHJpcmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTc4NjAsImV4cCI6MjA3NzUzMzg2MH0.nyAQmDfjuxzqdAi2u8PwTv99hrCZ5THcoEP3ek6mReQ',
    );
  }
  getClient() {
    return this.supabase;
  }
}
