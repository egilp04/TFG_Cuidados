import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TimeModel } from '../models/TimeModel';
import { TranslateService } from '@ngx-translate/core';

/**
 * Servicio maestro para la gestión de horarios y programación.
 * Implementa validaciones de integridad para evitar colisiones de horarios.
 */
@Injectable({
  providedIn: 'root',
})
export class TimeService {
  private supabaseService = inject(SupabaseService);
  private clientSupaBase = this.supabaseService.getClient();

  private timesList$ = new BehaviorSubject<TimeModel[]>([]);

  private translate = inject(TranslateService);

  constructor() {
    this.initRealtime();
  }

  /**
   * Retorna un observable con la lista de horarios gestionados.
   */
  getTimesObservable(): Observable<TimeModel[]> {
    this.refreshTimes();
    return this.timesList$.asObservable();
  }

  /**
   * Configura la escucha en tiempo real de la tabla Time.
   */
  private initRealtime() {
    this.clientSupaBase
      .channel('public:Time')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Time' }, () => {
        this.refreshTimes();
      })
      .subscribe();
  }

  /**
   * Recupera horarios organizados por día de la semana y hora desde el servidor.
   */
  public async refreshTimes() {
    const { data, error } = await this.clientSupaBase
      .from('Time')
      .select('*')
      .order('week_day', { ascending: true })
      .order('time', { ascending: true });

    if (!error) {
      this.timesList$.next((data ?? []) as TimeModel[]);
    }
  }

  /**
   * Inserta un nuevo registro de horario en el catálogo.
   */
  insertTime(newTime: TimeModel): Observable<void> {
    return from(this.clientSupaBase.from('Time').insert(newTime)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message || 'Error al insertar horario'))),
    );
  }

  /**
   * Elimina un registro de horario específico por su identificador único.
   */
  deleteTime(id: string): Observable<void> {
    return from(this.clientSupaBase.from('Time').delete().eq('id_time', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) =>
        throwError(() => new Error(err.message || 'Error al desactivar horario')),
      ),
    );
  }

  /**
   * Actualiza un registro de horario existente con nuevos valores.
   */
  updateTime(id: string, changes: Partial<TimeModel>): Observable<void> {
    return from(this.clientSupaBase.from('Time').update(changes).eq('id_time', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) =>
        throwError(() => new Error(err.message || 'Error al actualizar horario')),
      ),
    );
  }

  /**
   * Verifica la singularidad lógica de una franja horaria (combinación de día y hora).
   */
  existsTime(day: string, time: string, idToExclude?: string): Observable<boolean> {
    let query = this.clientSupaBase
      .from('Time')
      .select('id_time')
      .eq('week_day', day)
      .eq('time', time);

    if (idToExclude) {
      query = query.neq('id_time', idToExclude);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data && data.length > 0;
      }),
      catchError(() => of(false)),
    );
  }

  /**
   * Comprueba si un horario tiene ofertas (Service_Time) que aún están activas.
   * Útil para bloquear la edición o desactivación en el frontend.
   */
  hasActiveServiceTimes(id_time: string): Observable<boolean> {
    return from(
      this.clientSupaBase
        .from('Service_Time')
        .select('id_service_time')
        .eq('id_time', id_time)
        .eq('status', 'active'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data && data.length > 0;
      }),
      catchError(() => of(false)),
    );
  }
}
