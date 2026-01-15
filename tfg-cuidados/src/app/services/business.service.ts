import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private supabase = inject(SupabaseService).getClient();
  private businessesList$ = new BehaviorSubject<any[]>([]);

  constructor() {
    this.initRealtime();
  }

  getBusinessesObservable(): Observable<any[]> {
    this.refreshBusinesses();
    return this.businessesList$.asObservable();
  }

  private initRealtime() {
    this.supabase
      .channel('public:empresa_full_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Empresa' }, () =>
        this.refreshBusinesses()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Servicio_Horario' }, () =>
        this.refreshBusinesses()
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
        Servicio ( nombre, tipo_servicio ),
        Horario ( dia_semana, hora )
      )
    `
      )
      .eq('Usuario.estado', true);
    if (error) {
      console.error('❌ Error cargando empresas:', error.message);
      return;
    }
    console.log('✅ Empresas con servicios cargadas:', data);
    if (data) {
      const formatted = data.map((emp: any) => ({
        ...emp,
        nombre: emp.Usuario?.nombre || 'Empresa (Sin nombre)',
        email: emp.Usuario?.email || '',
        Servicio_Horario: emp.Servicio_Horario || [],
      }));
      this.businessesList$.next(formatted);
    }
  }
}
