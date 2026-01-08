import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Servicio_HorarioModel } from '../models/Servicio_Horario';

@Injectable({
  providedIn: 'root',
})
export class ServiceTimeService {
  private supabase = inject(SupabaseService).getClient();
  private serviceTimeList$ = new BehaviorSubject<any[]>([]);
  private currentIdEmpresa: string | null = null;

  getServiceTimeByEmpresa(idEmpresa: string): Observable<any[]> {
    this.currentIdEmpresa = idEmpresa;
    this.initRealtimeSubscription(idEmpresa);
    this.refreshList(idEmpresa);
    return this.serviceTimeList$.asObservable();
  }

  private initRealtimeSubscription(idEmpresa: string) {
    this.supabase.removeAllChannels();
    this.supabase
      .channel(`public:Servicio_Horario:${idEmpresa}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Servicio_Horario',
          filter: `id_empresa=eq.${idEmpresa}`,
        },
        () => {
          console.log('⚡ Evento Realtime detectado: actualizando lista...');
          this.refreshList(idEmpresa);
        }
      )
      .subscribe();
  }

  private async refreshList(idEmpresa: string) {
    const { data, error } = await this.supabase
      .from('Servicio_Horario')
      .select(
        `
        *,
        Servicio:id_servicio ( nombre, tipo_servicio ),
        Horario:id_horario ( hora, dia_semana )
      `
      )
      .eq('id_empresa', idEmpresa)
      .order('id_servicio_horario', { ascending: false });

    if (!error) {
      this.serviceTimeList$.next(data || []);
    } else {
      console.error('Error refrescando lista:', error);
    }
  }

  insertServiceTime(newEntry: Servicio_HorarioModel): Observable<void> {
    return from(this.supabase.from('Servicio_Horario').insert(newEntry)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        if (this.currentIdEmpresa) this.refreshList(this.currentIdEmpresa);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  updateServiceTime(id: string, changes: Partial<Servicio_HorarioModel>): Observable<void> {
    return from(
      this.supabase.from('Servicio_Horario').update(changes).eq('id_servicio_horario', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        if (this.currentIdEmpresa) this.refreshList(this.currentIdEmpresa);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  deleteServiceTime(id: string): Observable<void> {
    return from(this.supabase.from('Servicio_Horario').delete().eq('id_servicio_horario', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        const currentList = this.serviceTimeList$.getValue();
        const filtered = currentList.filter((item) => item.id_servicio_horario !== id);
        this.serviceTimeList$.next(filtered);
        if (this.currentIdEmpresa) this.refreshList(this.currentIdEmpresa);
      }),
      catchError((err) => throwError(() => err))
    );
  }
}
