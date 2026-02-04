import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

/**
 * @description Servicio de administración de usuarios y perfiles.
 * Implementa una lógica de consulta dinámica para unificar la identidad (Usuario)
 * con su especialización/rol (Cliente o Empresa) en un único objeto de dominio.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private supabase = inject(SupabaseService).getClient();
  private usersList$ = new BehaviorSubject<any[]>([]);
  private currentType: 'cliente' | 'empresa' = 'cliente';

  constructor() {
    this.initRealtime();
  }

  getUsersObservable(tipo: 'cliente' | 'empresa'): Observable<any[]> {
    this.currentType = tipo;
    this.usersList$.next([]);
    this.refreshUsers();
    return this.usersList$.asObservable();
  }

  /**
   * Suscripción multi-canal para actualizaciones en tiempo real.
   * Monitorea tres tablas simultáneamente (Usuario, Cliente, Empresa) para
   * sincronizar la vista del administrador ante cualquier cambio de estado.
   */
  private initRealtime() {
    this.supabase
      .channel('admin-users-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Usuario' }, () =>
        this.refreshUsers(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Cliente' }, () =>
        this.refreshUsers(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Empresa' }, () =>
        this.refreshUsers(),
      )
      .subscribe();
  }

  /**
   * Ejecuta una consulta relacional con filtrado dinámico.
   * Utiliza el operador '!inner' para forzar un JOIN que solo recupere usuarios
   * con perfiles de especialización válidos y activos.
   */
  private async refreshUsers() {
    // La lógica de aplanamiento (flattening) asegura que el frontend
    // reciba una interfaz simplificada sin anidamiento excesivo.
    const tableRel = this.currentType === 'cliente' ? 'Cliente' : 'Empresa';
    console.log(`Intentando cargar: ${tableRel}...`);
    const { data, error } = await this.supabase
      .from('Usuario')
      .select(`*, "${tableRel}"!inner(*)`)
      .eq('estado', true);
    if (error) {
      console.error(`ERROR cargando ${tableRel}:`, error);
      return;
    }
    if (data) {
      console.log(`Datos crudos ${tableRel}:`, data);
      const flattened = data.map((u: any) => {
        const detalle = u[tableRel] || u[tableRel.toLowerCase()] || u[`"${tableRel}"`];

        return {
          ...u,
          ...detalle,
        };
      });
      this.usersList$.next(flattened);
    }
  }

  deleteUser(userId: string): Observable<void> {
    return from(this.supabase.rpc('eliminar_usuario_total', { id_a_borrar: userId })).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }
  /**
   * Validación de unicidad de credenciales.
   * Realiza una comprobación de existencia cruzada, excluyendo al usuario actual
   * para permitir ediciones de perfil sin conflictos de identidad.
   */
  verifyUniqEmail(email: string, userId: string): Observable<boolean> {
    return from(
      this.supabase
        .from('Usuario')
        .select('id_usuario')
        .eq('email', email)
        .neq('id_usuario', userId)
        .maybeSingle(),
    ).pipe(
      map(({ data }) => !data),
      catchError(() => throwError(() => new Error('Error al validar email'))),
    );
  }

  /**
   * Invocación de lógica de servidor (Database RPC).
   * Delega la actualización de perfiles a una función almacenada 'update_profile_complete'.
   * Esto garantiza la atomicidad: o se actualizan ambas tablas (Usuario + Perfil) o ninguna.
   * @param bodyRPC Encapsula los parámetros necesarios para la transacción en la base de datos.
   */
  updateProfileDirect(userId: string, datosLimpios: any, rol: string): Observable<any> {
    const bodyRPC = {
      p_user_id: userId,
      p_rol: rol,
      p_nombre: datosLimpios.nombre,
      p_email: datosLimpios.email,
      p_telef: datosLimpios.telef,
      p_ape1: datosLimpios.ape1 || null,
      p_ape2: datosLimpios.ape2 || null,
      p_direccion: datosLimpios.direccion,
      p_localidad: datosLimpios.localidad,
      p_codpostal: datosLimpios.codpostal,
      p_comunidad: datosLimpios.comunidad,
      p_descripcion: datosLimpios.descripcion || null,
    };
    return from(this.supabase.rpc('update_profile_complete', bodyRPC)).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return { success: true };
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  getUserByEmail(email: string): Observable<any> {
    return from(
      this.supabase
        .from('Usuario')
        .select('id_usuario, nombre, email')
        .eq('email', email)
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  getUserById(id: string): Observable<any> {
    return from(
      this.supabase.from('Usuario').select('nombre').eq('id_usuario', id).maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((err) => throwError(() => err)),
    );
  }
}
