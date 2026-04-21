import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Service_Time_Model } from '../models/Service_Time_Model';
import { ServicetimeJoined } from '../models/Service_Time_Service_Model';

/**
 * @description Servicio encargado de gestionar la disponibilidad horaria de los servicios.
 * Implementa una lógica de vinculación entre la entidad 'Servicio' y la entidad 'Horario'.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceTimeService {
  private supabase = inject(SupabaseService).getClient();

  private serviceTimeList$ = new BehaviorSubject<ServicetimeJoined[]>([]);
  private currentIdEmpresa: string | null = null;

  getServiceTimeByBusiness(businessId: string): Observable<ServicetimeJoined[]> {
    this.currentIdEmpresa = businessId;
    this.initRealtimeSubscription(businessId);
    this.refreshList(businessId);
    return this.serviceTimeList$.asObservable();
  }

  /**
   * Sistema de sincronización selectiva.
   * A diferencia de otros servicios, utiliza canales filtrados por 'id_empresa' para
   * optimizar el tráfico de red y asegurar que los cambios solo afecten a la
   * entidad correspondiente en tiempo real.
   */
  private initRealtimeSubscription(businessId: string) {
    this.supabase.removeAllChannels();
    this.supabase
      .channel(`public:Servicio_Horario:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Servicio_Horario',
          filter: `id_empresa=eq.${businessId}`,
        },
        () => {
          console.log('⚡ Evento Realtime detectado: actualizando lista...');
          this.refreshList(businessId);
        },
      )
      .subscribe();
  }

  /**
   * Recupera la oferta comercial de una empresa mediante un JOIN relacional.
   * Proporciona datos planos que incluyen el nombre del servicio, tipo, hora y día,
   * facilitando su representación en componentes de tablas y tarjetas.
   */
  private async refreshList(businessId: string) {
    const { data, error } = await this.supabase
      .from('Servicio_Horario')
      .select(
        `
        *,
        Servicio:id_servicio ( nombre, tipo_servicio),
        Horario:id_horario ( hora, dia_semana )
      `,
      )
      .eq('id_empresa', businessId)
      .order('id_servicio_horario', { ascending: false });

    if (!error) {
      this.serviceTimeList$.next((data as ServicetimeJoined[]) || []);
    } else {
      console.error('Error refrescando lista:', error);
    }
  }

  insertServiceTime(newEntry: Service_Time_Model): Observable<void> {
    return from(this.supabase.from('Servicio_Horario').insert(newEntry)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        if (this.currentIdEmpresa) this.refreshList(this.currentIdEmpresa);
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  updateServiceTime(id: string, changes: Partial<Service_Time_Model>): Observable<void> {
    return from(
      this.supabase.from('Servicio_Horario').update(changes).eq('id_servicio_horario', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        if (this.currentIdEmpresa) this.refreshList(this.currentIdEmpresa);
      }),
      catchError((err) => throwError(() => err)),
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
      catchError((err) => throwError(() => err)),
    );
  }
}
