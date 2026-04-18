import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { EmpresaModel, SupabaseEmpresaJoin } from '../models/Bussiness-Service';

/**
 * @description Servicio de consulta para la búsqueda de empresas.
 * Realiza una agregación de datos (Empresa + Usuario + Servicio_Horario)
 * asegurando que solo se listen entidades con estado activo.
 */
@Injectable({ providedIn: 'root' })
export class BusinessService {
  private supabase = inject(SupabaseService).getClient();

  private businessesList$ = new BehaviorSubject<EmpresaModel[]>([]);

  constructor() {
    this.initRealtime();
  }
  getBusinessesObservable(): Observable<EmpresaModel[]> {
    this.refreshBusinesses();
    return this.businessesList$.asObservable();
  }

  /**
   * Configura una suscripción Realtime multi-tabla.
   * Si cambian los datos de la Empresa o sus horarios, la vista de búsqueda
   * se actualiza automáticamente sin recargar la página.
   */
  private initRealtime() {
    this.supabase
      .channel('public:empresa_full_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Empresa' }, () =>
        this.refreshBusinesses(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Servicio_Horario' }, () =>
        this.refreshBusinesses(),
      )
      .subscribe();
  }

  private async refreshBusinesses() {
    const { data, error } = await this.supabase
      .from('Empresa')
      .select(
        `
      *,
      Usuario!inner (nombre, email, estado),
      Servicio_Horario!inner (
        id_servicio_horario,
        precio,
        descripcion,
        id_servicio,
        Servicio ( id_servicio, nombre, tipo_servicio),
        Horario ( dia_semana, hora )
      )
    `,
      )
      .eq('Usuario.estado', true);

    if (error) {
      console.error('Error cargando empresas:', error.message);
      return;
    }

    if (data) {
      const formatted: EmpresaModel[] = (data as SupabaseEmpresaJoin[]).map(
        (emp) =>
          ({
            ...(emp as any),
            nombre: emp.Usuario?.nombre || 'Empresa (Sin nombre)',
            email: emp.Usuario?.email || '',
            Servicio_Horario: emp.Servicio_Horario || [],
          }) as EmpresaModel,
      );
      this.businessesList$.next(formatted);
    }
  }
}
