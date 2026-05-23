import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  RpcSuccessResponse,
  UpdateProfilePayload,
  UserEmailResponse,
  UserModel,
  UserNameResponse,
} from '../models/User_Service';
import { TranslateService } from '@ngx-translate/core';

/**
 * Servicio de administración de usuarios y perfiles.
 * Gestiona la unificación de identidad (User_public) con especialización de rol (Cliente o Negocio).
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private supabase = inject(SupabaseService).getClient();

  private _usersList = signal<UserModel[]>([]);
  public usersList = this._usersList.asReadonly();

  private translate = inject(TranslateService);

  private currentType: 'client' | 'business' = 'client';

  constructor() {
    this.initRealtime();
  }

  /**
   * Establece el tipo de usuario y desencadena una actualización de la lista.
   * @param tipo El tipo de usuario a cargar ('cliente' o 'empresa').
   */
  loadUsers(tipo: 'client' | 'business'): void {
    this.currentType = tipo;
    this._usersList.set([]);
    this.refreshUsers();
  }

  /**
   * Suscripción multi-canal para actualizaciones en tiempo real.
   * Monitorea las tablas User_public, Client y Business.
   */
  private initRealtime() {
    this.supabase
      .channel('admin-users-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'User_public' }, () =>
        this.refreshUsers(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Client' }, () =>
        this.refreshUsers(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Business' }, () =>
        this.refreshUsers(),
      )
      .subscribe();
  }

  /**
   * Ejecuta una consulta relacional con filtrado dinámico para obtener perfiles de usuario completos.
   */
  private async refreshUsers() {
    const tableRel = this.currentType === 'client' ? 'Client' : 'Business';
    const { data, error } = await this.supabase
      .from('User_public')
      .select(`*, ${tableRel}!inner(*)`)
      .eq('state', true);

    if (error) {
      console.error(`ERROR al cargar ${tableRel}:`, error);
      return;
    }

    if (data) {
      const flattened: UserModel[] = data.map((u: Record<string, unknown>) => {
        const detail = u[tableRel] as Record<string, unknown> | undefined;
        return {
          ...u,
          ...(detail || {}),
        } as unknown as UserModel;
      });

      this._usersList.set(flattened);
    }
  }

  /**
   * Invoca un RPC de base de datos para realizar una eliminación completa del usuario.
   * @param userId Identificador único del usuario a eliminar.
   */
  deleteUser(userId: string): Observable<void> {
    return from(this.supabase.rpc('eliminar_usuario_total', { id_a_borrar: userId })).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Verifica si un correo es único en el sistema, excluyendo un ID de usuario específico.
   * @param email Correo a verificar.
   * @param userId Identificador del usuario a excluir de la verificación.
   */
  verifyUniqEmail(email: string, userId: string): Observable<boolean> {
    return from(
      this.supabase
        .from('User_public')
        .select('id_user')
        .eq('email', email)
        .neq('id_user', userId)
        .maybeSingle(),
    ).pipe(
      map(({ data }) => !data),
      catchError(() =>
        throwError(() => new Error(this.translate.instant('ERRORS.AUTH.ERRORS.EMAIL_VALIDATION'))),
      ),
    );
  }

  /**
   * Actualiza un perfil usando un procedimiento almacenado de base de datos para transacciones atómicas.
   * @param userId Identificador único del usuario.
   * @param dataToSend Carga útil que contiene actualizaciones de perfil.
   * @param rol Rol del usuario que se actualiza.
   */
  updateProfileDirect(
    userId: string,
    dataToSend: UpdateProfilePayload,
    rol: string,
  ): Observable<RpcSuccessResponse> {
    const bodyRPC = {
      p_user_id: userId,
      p_role: rol,
      p_name: dataToSend.name,
      p_email: dataToSend.email,
      p_phone: dataToSend.phone,
      p_surname1: dataToSend.surname1 || null,
      p_surname2: dataToSend.surname2 || null,
      p_address: dataToSend.address || null,
      p_city: dataToSend.city || null,
      p_postcode: dataToSend.postcode || null,
      p_community: dataToSend.comunity || null,
      p_description: dataToSend.description || null,
      p_avatar_url: dataToSend.avatar_url || null,
    };

    return from(this.supabase.rpc('update_user_profile', bodyRPC)).pipe(
      map(({ error }) => {
        if (error) throw new Error(error.message);
        return { success: true };
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Recupera detalles de un usuario específico basado en una dirección de correo electrónico.
   * @param email Correo a buscar.
   */
  getUserByEmail(email: string): Observable<UserEmailResponse> {
    return from(
      this.supabase
        .from('User_public')
        .select('id_user, name, email')
        .eq('email', email)
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as UserEmailResponse;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Recupera el nombre de un usuario por su identificador único.
   * @param id Identificador del usuario.
   */
  getUserById(id: string): Observable<UserNameResponse> {
    return from(
      this.supabase.from('User_public').select('name').eq('id_user', id).maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as UserNameResponse;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Obtiene la lista de correos electrónicos de todos los usuarios activos,
   * excluyendo el correo del usuario proporcionado.
   * @param currentEmail El email del usuario logueado para excluirlo de la lista.
   */
  getActiveUsersEmails(currentEmail: string): Observable<string[]> {
    return from(
      this.supabase
        .from('User_public')
        .select('email')
        .eq('state', true)
        .neq('email', currentEmail),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error al obtener correos:', error);
          return [];
        }
        return (data || []).map((user) => user.email);
      }),
    );
  }

  uploadAvatar(userId: string, file: File): Observable<string | null> {
    const filePath = `${userId}/avatar_${Date.now()}.${file.name.split('.').pop()}`;
    return from(
      this.supabase.storage.from('avatars').upload(filePath, file, { upsert: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const { data: publicUrl } = this.supabase.storage.from('avatars').getPublicUrl(filePath);
        return publicUrl.publicUrl;
      }),
      catchError((err) => {
        console.error('Error subiendo imagen:', err);
        return of(null);
      }),
    );
  }

  async deleteAvatar(userId: string, fileName: string) {
    // 1. Borramos la foto del Storage (El Disco Duro)
    const { error: storageError } = await this.supabase.storage
      .from('avatars')
      .remove([`${userId}/${fileName}`]);
    console.log('borrando del storage');

    if (storageError) throw storageError;

    // 2. Limpiamos la URL en la Base de Datos directamente
    // (Asegúrate de que 'User_public' es el nombre exacto de tu tabla)
    const { error: dbError } = await this.supabase
      .from('User_public')
      .update({ avatar_url: null })
      .eq('id_user', userId);
    console.log('borrando de la base de datod');
    if (dbError) throw dbError;
    return true;
  }
}
