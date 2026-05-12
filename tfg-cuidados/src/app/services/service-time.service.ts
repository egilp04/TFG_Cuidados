import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { Service_Time_Model } from '../models/Service_Time_Model';
import { ServiceTimeJoined } from '../models/Service_Time_Service_Model';

/**
 * Servicio responsable de gestionar la disponibilidad de servicios.
 * Implementa la lógica de vinculación entre entidades 'Service' y 'Time'.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceTimeService {
  private supabase = inject(SupabaseService).getClient();
  private serviceTimeList$ = new BehaviorSubject<ServiceTimeJoined[]>([]);
  private currentIdBusiness: string | null = null;

  /**
   * Recupera la lista de horarios disponibles para un negocio específico e inicializa sincronización en tiempo real.
   * @param businessId Identificador único del negocio.
   */
  getServiceTimeByBusiness(businessId: string): Observable<ServiceTimeJoined[]> {
    this.currentIdBusiness = businessId;
    this.initRealtimeSubscription(businessId);
    this.refreshList(businessId);
    return this.serviceTimeList$.asObservable();
  }

  /**
   * Configura un sistema de sincronización selectiva filtrado por ID de negocio.
   */
  private initRealtimeSubscription(businessId: string) {
    this.supabase.removeAllChannels();
    this.supabase
      .channel(`public:Service_Time:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Service_Time',
          filter: `id_business=eq.${businessId}`,
        },
        () => {
          this.refreshList(businessId);
        },
      )
      .subscribe();
  }

  /**
   * Obtiene la oferta comercial de un negocio utilizando uniones relacionales con las tablas Service y Time.
   */
  private async refreshList(businessId: string) {
    const { data, error } = await this.supabase
      .from('Service_Time')
      .select(
        `
        *,
        Service:id_service ( name, type_service),
        Time:id_time ( week_day, time )
      `,
      )
      .eq('id_business', businessId)
      .order('id_service_time', { ascending: false });

    if (!error) {
      this.serviceTimeList$.next((data as unknown as ServiceTimeJoined[]) || []);
    } else {
      console.error('Error al actualizar la lista:', error);
    }
  }

  /**
   * Inserta un nuevo registro de disponibilidad servicio-horario.
   */
  insertServiceTime(newEntry: Service_Time_Model): Observable<void> {
    const checkQuery = this.supabase
      .from('Service_Time')
      .select('id_service_time')
      .eq('id_service', newEntry.id_service)
      .eq('id_time', newEntry.id_time)
      .eq('id_business', newEntry.id_business)
      .eq('price', newEntry.price);
    return from(checkQuery).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        if (data && data.length > 0) {
          return throwError(() => new Error('DUPLICATE_ENTRY'));
        }
        return from(this.supabase.from('Service_Time').insert(newEntry)).pipe(
          map(({ error: insertError }) => {
            if (insertError) throw insertError;
          }),
        );
      }),
      tap(() => {
        if (this.currentIdBusiness) this.refreshList(this.currentIdBusiness);
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Actualiza un registro existente de disponibilidad servicio-horario.
   */
  updateServiceTime(id: string, changes: Partial<Service_Time_Model>): Observable<void> {
    return from(this.supabase.from('Service_Time').update(changes).eq('id_service_time', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        if (this.currentIdBusiness) this.refreshList(this.currentIdBusiness);
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Elimina un registro de disponibilidad servicio-horario de la base de datos.
   */
  deleteServiceTime(id: string): Observable<void> {
    return from(this.supabase.from('Service_Time').delete().eq('id_service_time', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        const currentList = this.serviceTimeList$.getValue();
        const filtered = currentList.filter((item) => item.id_service_time !== id);
        this.serviceTimeList$.next(filtered);
        if (this.currentIdBusiness) this.refreshList(this.currentIdBusiness);
      }),
      catchError((err) => throwError(() => err)),
    );
  }
}
