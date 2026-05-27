import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable, throwError, of } from 'rxjs';
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
      .eq('status', 'active')
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
    return from(
      this.supabase.from('Service_Time').update({ status: 'inactive' }).eq('id_service_time', id),
    ).pipe(
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
   * Comprueba si una oferta (Service_Time) tiene contratos que aún están activas.
   * Útil para bloquear la edición o desactivación en el frontend.
   */
  hasActiveContracts(id_service_time: string): Observable<boolean> {
    return from(
      this.supabase
        .from('Contract')
        .select('id_contract')
        .eq('id_service_time', id_service_time)
        .eq('state', 'active'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data && data.length > 0;
      }),
      catchError(() => of(false)),
    );
  }

  getAllContractsForAdmin(): Observable<Service_Time_Model[]> {
    const queryPromise = this.supabase
      .from('Service_Time')
      .select(`*,
      Service (
        type
      ),
      Business (
        User_public (
          name
        )
      )
    `)
    return from(queryPromise).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as Service_Time_Model[]) || [];
      }),
      catchError((err) => {
        console.error('Error fetching admin service times:', err);
        return of([]);
      }),
    );
  }

  deleteServiceTimeDB(idServiceTime: string): Observable<void> {
    const checkContractsPromise = this.supabase
      .from('Contract')
      .select('id_contract', { count: 'exact', head: true })
      .eq('id_service_time', idServiceTime);

    return from(checkContractsPromise).pipe(
      switchMap(({ count, error }) => {
        if (error) throw error;
        if (count !== null && count > 0) {
          throw new Error('MANAGEMENT_SERVICES.MESSAGES.ERROR_HAS_OFFERS');
        }
        return from(
          this.supabase.from('Service_Time').delete().eq('id_service_time', idServiceTime),
        );
      }),
      map((res: any) => {
        if (res?.error) throw res.error;
      }),
      catchError((err) => {
        console.error('Error eliminando Service_Time:', err);
        return throwError(() => err);
      }),
    );
  }
}
