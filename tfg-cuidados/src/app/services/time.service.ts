import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HorarioModel } from '../models/Horario';

/**
 * @description Servicio maestro de gestión de tiempos y horarios.
 * Implementa validaciones de integridad para evitar colisiones horarias.
 */
@Injectable({
  providedIn: 'root',
})
export class TimeService {
  private supabaseService = inject(SupabaseService);
  private clientSupaBase = this.supabaseService.getClient();

  private timesList$ = new BehaviorSubject<HorarioModel[]>([]);

  constructor() {
    this.initRealtime();
  }

  getTimesObservable(): Observable<HorarioModel[]> {
    this.refreshTimes();
    return this.timesList$.asObservable();
  }
  private initRealtime() {
    this.clientSupaBase
      .channel('public:Horario')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Horario' }, () => {
        this.refreshTimes();
      })
      .subscribe();
  }

  /**
   * Implementa ordenación multicriterio en servidor.
   * Recupera los horarios organizados primero por día de la semana y
   * posteriormente por hora, optimizando la visualización en el frontend.
   */
  private async refreshTimes() {
    const { data, error } = await this.clientSupaBase
      .from('Horario')
      .select('*')
      .order('dia_semana', { ascending: true })
      .order('hora', { ascending: true });

    if (!error) {
      this.timesList$.next((data ?? []) as HorarioModel[]);
    }
  }

  insertTime(newHorario: HorarioModel): Observable<void> {
    return from(this.clientSupaBase.from('Horario').insert(newHorario)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message || 'Error al insertar'))),
    );
  }

  deleteTime(id: string): Observable<void> {
    return from(this.clientSupaBase.from('Horario').delete().eq('id_horario', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message || 'Error al eliminar'))),
    );
  }

  updateTime(id: string, changes: Partial<HorarioModel>): Observable<void> {
    return from(this.clientSupaBase.from('Horario').update(changes).eq('id_horario', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message || 'Error al actualizar'))),
    );
  }

  /**
   * Validación de unicidad lógica (existsTime).
   * Realiza una comprobación en la base de datos para evitar la duplicidad de
   * franjas (mismo día y misma hora), protegiendo la consistencia del catálogo.
   */
  existsTime(dia: string, hora: string, idAExcluir?: string): Observable<boolean> {
    let query = this.clientSupaBase
      .from('Horario')
      .select('id_horario')
      .eq('dia_semana', dia)
      .eq('hora', hora);
    if (idAExcluir) {
      query = query.neq('id_horario', idAExcluir);
    }
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data && data.length > 0;
      }),
      catchError(() => of(false)),
    );
  }
}
