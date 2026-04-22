import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  RpcSuccessResponse,
  UpdateProfilePayload,
  UserEmailResponse,
  UserModel,
  UserNameResponse,
} from '../models/User_Service';

/**
 * User and profile administration service.
 * Manages identity unification (User_public) with role specialization (Client or Business).
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private supabase = inject(SupabaseService).getClient();

  private _usersList = signal<UserModel[]>([]);
  public usersList = this._usersList.asReadonly();

  private currentType: 'client' | 'business' = 'client';

  constructor() {
    this.initRealtime();
  }

  /**
   * Sets the user type and triggers a refresh of the list.
   * @param tipo The type of user to load ('cliente' or 'empresa').
   */
  loadUsers(tipo: 'client' | 'business'): void {
    this.currentType = tipo;
    this._usersList.set([]);
    this.refreshUsers();
  }

  /**
   * Multi-channel subscription for real-time updates.
   * Monitors User_public, Client, and Business tables.
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
   * Executes a relational query with dynamic filtering to fetch full user profiles.
   */
  private async refreshUsers() {
    const tableRel = this.currentType === 'client' ? 'Client' : 'Business';
    const { data, error } = await this.supabase
      .from('User_public')
      .select(`*, ${tableRel}!inner(*)`)
      .eq('state', true);

    if (error) {
      console.error(`ERROR loading ${tableRel}:`, error);
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
   * Invokes a database RPC to perform a full user deletion.
   * @param userId Unique identifier of the user to delete.
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
   * Verifies if an email is unique in the system, excluding a specific user ID.
   * @param email Email to verify.
   * @param userId User identifier to exclude from the check.
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
      catchError(() => throwError(() => new Error('Error validating email'))),
    );
  }

  /**
   * Updates a profile using a database stored procedure for atomic transactions.
   * @param userId Unique identifier of the user.
   * @param dataToSend Payload containing profile updates.
   * @param rol Role of the user being updated.
   */
  updateProfileDirect(
    userId: string,
    dataToSend: UpdateProfilePayload,
    rol: string,
  ): Observable<RpcSuccessResponse> {
    const bodyRPC = {
      p_user_id: userId,
      p_rol: rol,
      p_name: dataToSend.name,
      p_email: dataToSend.email,
      p_phone: dataToSend.phone,
      p_surname1: dataToSend.surname1 || null,
      p_surname2: dataToSend.surname2 || null,
      p_address: dataToSend.address || null,
      p_city: dataToSend.city || null,
      p_postcode: dataToSend.postcode || null,
      p_comunity: dataToSend.comunity || null,
      p_description: dataToSend.description || null,
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
   * Retrieves specific user details based on an email address.
   * @param email Email to search for.
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
   * Retrieves the name of a user by their unique identifier.
   * @param id User identifier.
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
}
