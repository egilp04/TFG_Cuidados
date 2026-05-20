import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ServiceModel } from '../models/ServiceModel';

/**
 * Gestiona el catálogo maestro de servicios disponibles en la plataforma.
 * Proporciona métodos CRUD y validaciones de integridad de datos.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private supabaseService = inject(SupabaseService);
  private clientSupaBase = this.supabaseService.getClient();

  private servicesList$ = new BehaviorSubject<ServiceModel[] | null>(null);

  constructor() {
    this.initRealtime();
  }

  /**
   * Retorna un observable con la lista de todos los servicios disponibles.
   */
  getServicesObservable(): Observable<ServiceModel[] | null> {
    this.refreshServices();
    return this.servicesList$.asObservable();
  }

  /**
   * Inicializa la sincronización en tiempo real de la tabla Service.
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
   * Sincroniza la lista de servicios desde la base de datos, ordenados por nombre.
   */
  private async refreshServices() {
    const { data, error } = await this.clientSupaBase
      .from('Service')
      .select('*').eq('status', 'active')
      .order('name', { ascending: true });
  
    if (!error) {
      this.servicesList$.next((data ?? []) as ServiceModel[]);
    } else {
      this.servicesList$.next([]);
    }
  }

  /**
   * Inserta un nuevo servicio en el catálogo.
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
   * Actualiza un registro de servicio existente.
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
   * Elimina un servicio del catálogo.
   */
  deleteService(id: string): Observable<void> {
    return from(this.clientSupaBase.from('Service').update({ status: 'inactive' }).eq('id_service', id)).pipe(
      tap(() => this.refreshServices()),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Recupera un servicio individual por su identificador.
   */
  getServiceById(id: string): Observable<ServiceModel> {
    return from(
      this.clientSupaBase.from('Service').select('*').eq('id_service', id).eq('status', 'active').single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ServiceModel;
      })
    );
  }
  /**
   * Verifica si un servicio con un nombre específico ya existe, excluyendo un ID dado.
   */
  existsService(name: string, idExclude?: string): Observable<boolean> {
    let query = this.clientSupaBase.from('Service').select('id_service').eq('status', 'active').ilike('name', name);
    if (idExclude) {
      query = query.neq('id_service', idExclude);
    }

    return from(query).pipe(
      map(({ data }) => (data && data.length > 0 ? true : false)),
      catchError(() => of(false)),
    );
  }

  getServicesWithOffers(): Observable<ServiceModel[]> {
    return from(
      this.clientSupaBase
        .from('Service')
        .select('*, Service_Time!inner(id_service)').eq('status', 'active').eq('Service_Time.status', 'active')
        .order('name', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as any[]).map(item => {
          const { Service_Time, ...serviceData } = item;
          return serviceData as ServiceModel;
        });
      }),
      catchError((err) => {
        console.error('Error cargando servicios con ofertas:', err);
        return of([]);
      })
    );
  }

  /**
   * Comprueba si un servicio tiene ofertas (Service_Time) que aún están activas.
   * Útil para bloquear la edición o desactivación en el frontend.
   */
  hasActiveServiceTimes(id_service: string): Observable<boolean> {
    return from(
      this.clientSupaBase
        .from('Service_Time')
        .select('id_service_time')
        .eq('id_service', id_service)
        .eq('status', 'active')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data && data.length > 0;
      }),
      catchError(() => of(false))
    );
  }
}
