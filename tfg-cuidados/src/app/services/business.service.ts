import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { BusinessSupabaseJoinModel } from '../models/Bussiness-Service';
import { BusinessModel } from '../models/BusinessModel';

/**
 * Servicio para consultar y buscar negocios.
 * Agrega datos de las tablas Business, User_public y Service_Time,
 * asegurando que solo se listen entidades activas.
 */
@Injectable({ providedIn: 'root' })
export class BusinessService {
  private supabase = inject(SupabaseService).getClient();
  private businessesList$ = new BehaviorSubject<BusinessModel[]>([]);

  constructor() {
    this.initRealtime();
  }

  /**
   * Retorna un observable con la lista de negocios activos.
   * @returns Observable<BusinessModel[]>
   */
  getBusinessesObservable(): Observable<BusinessModel[]> {
    this.refreshBusinesses();
    return this.businessesList$.asObservable();
  }

  /**
   * Configura una suscripción en tiempo real multi-tabla.
   * Actualiza la lista de negocios automáticamente cuando ocurren cambios en las tablas Business o Service_Time.
   */
  private initRealtime() {
    this.supabase
      .channel('public:business_full_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Business' }, () =>
        this.refreshBusinesses(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Service_Time' }, () =>
        this.refreshBusinesses(),
      )
      .subscribe();
  }

  /**
   * Obtiene negocios activos incluyendo su perfil de usuario público, servicios y horarios.
   */
  private async refreshBusinesses() {
    const { data, error } = await this.supabase
      .from('Business')
      .select(
        `
      *,
      User_public!inner (name, email, state),
      Service_Time!inner (
        id_service_time,
        price,
        description,
        id_service,
        Service ( id_service, name, type_service),
        Time ( week_day, time )
      )
    `,
      )
      .eq('User_public.state', true);

    if (error) {
      console.error('Error al cargar negocios:', error.message);
      return;
    }

    if (data) {
      const formatted: BusinessModel[] = (data as BusinessSupabaseJoinModel[]).map(
        (buss) =>
          ({
            ...buss,
            name: buss.User_public?.name || 'Negocio (Sin nombre)',
            email: buss.User_public?.email || '',
            Service_Time: buss.Service_Time || [],
          }) as BusinessModel,
      );
      this.businessesList$.next(formatted);
    }
  }
}
