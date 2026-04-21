import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, from, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators'; // Importar TAP
import { ServiceModel } from '../models/ServiceModel';

/**
 * @description Gestiona el catálogo maestro de servicios disponibles en la plataforma.
 * Proporciona métodos CRUD y validaciones de integridad de datos.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private supabaseService = inject(SupabaseService);
  private clientSupaBase = this.supabaseService.getClient();

  private servicesList$ = new BehaviorSubject<ServiceModel[]>([]);

  constructor() {
    this.initRealtime();
  }

  getServicesObservable(): Observable<ServiceModel[]> {
    this.refreshServices();
    return this.servicesList$.asObservable();
  }

  private initRealtime() {
    this.clientSupaBase
      .channel('public:Servicio')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Servicio' }, () => {
        this.refreshServices();
      })
      .subscribe();
  }

  private async refreshServices() {
    const { data, error } = await this.clientSupaBase
      .from('Servicio')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error) {
      this.servicesList$.next((data ?? []) as ServiceModel[]);
    }
  }

  insertService(newServicio: ServiceModel): Observable<void> {
    return from(this.clientSupaBase.from('Servicio').insert(newServicio)).pipe(
      tap(() => this.refreshServices()),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  updateService(id: string, changes: Partial<ServiceModel>): Observable<void> {
    return from(this.clientSupaBase.from('Servicio').update(changes).eq('id_servicio', id)).pipe(
      tap(() => this.refreshServices()),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  deleteService(id: string): Observable<void> {
    return from(this.clientSupaBase.from('Servicio').delete().eq('id_servicio', id)).pipe(
      tap(() => this.refreshServices()),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  getServiceById(id: string): Observable<ServiceModel> {
    return from(
      this.clientSupaBase.from('Servicio').select('*').eq('id_servicio', id).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ServiceModel;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Validación de duplicidad lógica.
   * Utiliza el operador 'ilike' para asegurar que no se registren servicios con
   * nombres similares, ignorando mayúsculas y minúsculas (Case Insensitive).
   */
  existsService(nombre: string, idExclude?: string): Observable<boolean> {
    let query = this.clientSupaBase.from('Servicio').select('id_servicio').ilike('nombre', nombre);
    if (idExclude) {
      query = query.neq('id_servicio', idExclude);
    }

    return from(query).pipe(
      map(({ data }) => (data && data.length > 0 ? true : false)),
      catchError(() => of(false)),
    );
  }
}
