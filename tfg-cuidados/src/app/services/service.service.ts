import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Behaviortopic, from, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ServiceModel } from '../models/ServiceModel';

/**
 * Manages the master catalog of services available on the platform.
 * Provides CRUD methods and data integrity validations.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private supabaseService = inject(SupabaseService);
  private clientSupaBase = this.supabaseService.getClient();

  private servicesList$ = new Behaviortopic<ServiceModel[]>([]);

  constructor() {
    this.initRealtime();
  }

  /**
   * Returns an observable with the list of all available services.
   */
  getServicesObservable(): Observable<ServiceModel[]> {
    this.refreshServices();
    return this.servicesList$.asObservable();
  }

  /**
   * Initializes real-time synchronization for the Service table.
   */
  private initRealtime() {
    this.clientSupaBase
      .channel('public:Service')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Service' }, () => {
        this.refreshServices();
      })
      .subscribe();
  }

  /**
   * Synchronizes the service list from the database, ordered by name.
   */
  private async refreshServices() {
    const { data, error } = await this.clientSupaBase
      .from('Service')
      .select('*')
      .order('name', { ascending: true });

    if (!error) {
      this.servicesList$.next((data ?? []) as ServiceModel[]);
    }
  }

  /**
   * Inserts a new service into the catalog.
   */
  insertService(newService: ServiceModel): Observable<void> {
    return from(this.clientSupaBase.from('Service').insert(newService)).pipe(
      tap(() => this.refreshServices()),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Updates an existing service record.
   */
  updateService(id: string, changes: Partial<ServiceModel>): Observable<void> {
    return from(this.clientSupaBase.from('Service').update(changes).eq('id_service', id)).pipe(
      tap(() => this.refreshServices()),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Deletes a service from the catalog.
   */
  deleteService(id: string): Observable<void> {
    return from(this.clientSupaBase.from('Service').delete().eq('id_service', id)).pipe(
      tap(() => this.refreshServices()),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Retrieves a single service by its identifier.
   */
  getServiceById(id: string): Observable<ServiceModel> {
    return from(this.clientSupaBase.from('Service').select('*').eq('id_service', id).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ServiceModel;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Checks if a service with a specific name already exists, excluding a given ID.
   */
  existsService(name: string, idExclude?: string): Observable<boolean> {
    let query = this.clientSupaBase.from('Service').select('id_service').ilike('name', name);
    if (idExclude) {
      query = query.neq('id_service', idExclude);
    }

    return from(query).pipe(
      map(({ data }) => (data && data.length > 0 ? true : false)),
      catchError(() => of(false)),
    );
  }
}
