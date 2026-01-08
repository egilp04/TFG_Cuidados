import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AmdministradorModel } from '../models/Administrador';

@Injectable({
  providedIn: 'root',
})
export class AdministratorService {
  private supabaseService = inject(SupabaseService);
  private clientSupaBase = this.supabaseService.getClient();

  insertAdmin(newAdmin: AmdministradorModel): Observable<void> {
    return from(this.clientSupaBase.from('administrador').insert(newAdmin)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  deleteAdmin(id: string): Observable<void> {
    return from(this.clientSupaBase.from('administrador').delete().eq('id_usuario', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  updateAdminn(id: string, changes: Partial<AmdministradorModel>): Observable<void> {
    if (typeof id !== 'number' || Number.isNaN(id))
      return throwError(() => new Error('ID debe ser número.'));
    return from(
      this.clientSupaBase.from('administrador').update(changes).eq('id_usuario', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  getAdminById(id_usuario: string): Observable<AmdministradorModel> {
    if (typeof id_usuario !== 'number' || Number.isNaN(id_usuario)) {
      return throwError(() => new Error('ID debe ser número.'));
    }
    return from(
      this.clientSupaBase
        .from('administrador')
        .select('*')
        .eq('id_usuario', id_usuario)
        .order('fecha_creacion', { ascending: false })
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as AmdministradorModel;
      }),
      catchError((err) => throwError(() => err))
    );
  }
}
