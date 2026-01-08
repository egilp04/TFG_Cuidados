import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private supabase = inject(SupabaseService).getClient();
  private _totalUsuarios$ = new BehaviorSubject<number>(0);
  private _registrosSemanales$ = new BehaviorSubject<number[]>(new Array(7).fill(0));
  private _contratosStats$ = new BehaviorSubject<{ activos: number; cancelados: number }>({
    activos: 0,
    cancelados: 0,
  });

  constructor() {
    this.initDashboard();
  }

  getUsuariosCount(): Observable<number> {
    return this._totalUsuarios$.asObservable();
  }

  fetchWeeklyRecords(): Observable<number[]> {
    return this._registrosSemanales$.asObservable();
  }

  getContractStats(): Observable<{ activos: number; cancelados: number }> {
    return this._contratosStats$.asObservable();
  }

  private async initDashboard() {
    await Promise.allSettled([
      this.chargeTotalUsers(),
      this.chargeWeeklyRecords(),
      this.chargeContractsStatics(),
    ]);
    this.listenToChangesIRL();
  }

  private async chargeTotalUsers() {
    try {
      const { count, error } = await this.supabase
        .from('Usuario')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      this._totalUsuarios$.next(count || 0);
    } catch (e) {
      console.error('Error cargando total usuarios:', e);
    }
  }

  private async chargeContractsStatics() {
    try {
      const { data: contratos, error } = await this.supabase.from('Contrato').select('estado');
      if (error) throw error;
      if (contratos) {
        const stats = {
          activos: contratos.filter((c) => c.estado === 'activo').length,
          cancelados: contratos.filter((c) => c.estado === 'cancelado').length,
        };
        this._contratosStats$.next(stats);
      }
    } catch (e) {
      console.error('Error cargando estadísticas contratos:', e);
    }
  }

  private async chargeWeeklyRecords() {
    try {
      const haceSieteDias = new Date();
      haceSieteDias.setDate(haceSieteDias.getDate() - 6);
      haceSieteDias.setHours(0, 0, 0, 0);
      const { data, error } = await this.supabase
        .from('Usuario')
        .select('fecha_registro')
        .gte('fecha_registro', haceSieteDias.toISOString());
      if (error) throw error;
      if (data) {
        this._registrosSemanales$.next(this.groupByDay(data, haceSieteDias));
      }
    } catch (e) {
      console.error('Error cargando registros semanales:', e);
    }
  }

  private listenToChangesIRL() {
    this.supabase
      .channel('admin-metrics-internal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Usuario' }, () => {
        this.chargeTotalUsers();
        this.chargeWeeklyRecords();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Contrato' }, () => {
        this.chargeContractsStatics();
      })
      .subscribe();
  }

  private groupByDay(registros: any[], fechaInicio: Date): number[] {
    const dias = new Array(7).fill(0);
    registros.forEach((reg) => {
      const fechaReg = new Date(reg.fecha_registro);
      const diffTime = fechaReg.getTime() - fechaInicio.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        dias[diffDays]++;
      }
    });
    return dias;
  }
}
