import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
/**../../environments/environment
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
    this.supabase = createClient(`${environment.supabaseUrl}`, `${environment.supabaseKey}`);
  }
  getClient() {
    return this.supabase;
  }
}
