import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Behaviortopic, from, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Service_Time_Model } from '../models/Service_Time_Model';
import { ServiceTimeJoined } from '../models/Service_Time_Service_Model';

/**
 * Service responsible for managing the availability of services.
 * Implements the link logic between 'Service' and 'Time' entities.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceTimeService {
  private supabase = inject(SupabaseService).getClient();
  private serviceTimeList$ = new Behaviortopic<ServiceTimeJoined[]>([]);
  private currentIdBusiness: string | null = null;

  /**
   * Retrieves the list of available times for a specific business and initializes real-time sync.
   * @param businessId Unique identifier of the business.
   */
  getServiceTimeByBusiness(businessId: string): Observable<ServiceTimeJoined[]> {
    this.currentIdBusiness = businessId;
    this.initRealtimeSubscription(businessId);
    this.refreshList(businessId);
    return this.serviceTimeList$.asObservable();
  }

  /**
   * Configures a selective synchronization system filtered by business ID.
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
   * Fetches the commercial offer of a business using relational joins with Service and Time tables.
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
      console.error('Error refreshing list:', error);
    }
  }

  /**
   * Inserts a new service-time availability record.
   */
  insertServiceTime(newEntry: Service_Time_Model): Observable<void> {
    return from(this.supabase.from('Service_Time').insert(newEntry)).pipe(
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
   * Updates an existing service-time availability record.
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
   * Deletes a service-time availability record from the database.
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
