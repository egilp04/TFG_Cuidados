import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ContractStats,
  EstadoContratoResponse,
  RegistroFechaResponse,
} from '../models/Analitycs-Service';

/**
 * @description Servicio de métricas y análisis de datos para el dashboard administrativo.
 * Centraliza la lógica de agregación temporal y estadística.
 */
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private supabase = inject(SupabaseService).getClient();
  private _totalAppUsers$ = new BehaviorSubject<number>(0);
  private _monthlyRegisters$ = new BehaviorSubject<{ labels: Date[]; data: number[] }>({
    labels: [],
    data: [],
  });

  private _contractsAmountData$ = new BehaviorSubject<ContractStats>({
    activeContract: 0,
    cancelContract: 0,
  });

  private _servicesStats$ = new BehaviorSubject<{
    labels: string[];
    demand: number[];
    supply: number[];
  }>({
    labels: [],
    demand: [],
    supply: [],
  });

  constructor() {
    this.initDashboard();
  }

  getUsuariosCount(): Observable<number> {
    return this._totalAppUsers$.asObservable();
  }

  fetchMonthlyUsersRecords(): Observable<{ labels: Date[]; data: number[] }> {
    return this._monthlyRegisters$.asObservable();
  }

  getContractStats(): Observable<ContractStats> {
    return this._contractsAmountData$.asObservable();
  }

  getServicesStats(): Observable<{ labels: string[]; demand: number[]; supply: number[] }> {
    return this._servicesStats$.asObservable();
  }

  private async initDashboard() {
    await Promise.allSettled([
      this.chargeTotalUsers(),
      this.chargeMonthlyRecords(),
      this.chargeContractsStatics(),
      this.chargeServicesStats(),
    ]);
    this.listenToChangesIRL();
  }

  private async chargeTotalUsers() {
    try {
      const { count, error } = await this.supabase
        .from('Usuario')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      this._totalAppUsers$.next(count || 0);
    } catch (e) {
      console.error('Error cargando total usuarios:', e);
    }
  }

  private async chargeContractsStatics() {
    try {
      const { data, error } = await this.supabase.from('Contrato').select('estado');
      if (error) throw error;
      if (data) {
        const contracts = data as EstadoContratoResponse[];
        const stats: ContractStats = {
          activeContract: contracts.filter((c) => c.estado === 'activo').length,
          cancelContract: contracts.filter((c) => c.estado === 'no activo').length,
        };
        this._contractsAmountData$.next(stats);
      }
    } catch (e) {
      console.error('Error cargando estadísticas contratos:', e);
    }
  }

  private async chargeMonthlyRecords() {
    try {
      const currentYear = new Date().getFullYear();
      const januaryMonth = new Date(currentYear, 0, 1);
      januaryMonth.setHours(0, 0, 0, 0);

      const { data, error } = await this.supabase
        .from('Usuario')
        .select('fecha_registro')
        .gte('fecha_registro', januaryMonth.toISOString());

      if (error) throw error;

      if (data) {
        const registerData = data as RegistroFechaResponse[];
        this._monthlyRegisters$.next(this.groupByCurrentYear(registerData, currentYear));
      }
    } catch (e) {
      console.error('Error cargando registros del año en curso:', e);
    }
  }

  /**
   * Monitorización IRL (In Real Time).
   * Configura canales de escucha duales (Usuario y Contrato). Ante cualquier
   * cambio en la plataforma, las métricas del dashboard se recalculan
   * automáticamente sin intervención del administrador.
   */
  private listenToChangesIRL() {
    this.supabase
      .channel('admin-metrics-internal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Usuario' }, () => {
        this.chargeTotalUsers();
        this.chargeMonthlyRecords();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Contrato' }, () => {
        this.chargeContractsStatics();
        this.chargeServicesStats();
      })
      .subscribe();
  }

  /**
   * Agregación temporal de registros.
   * Implementa una lógica de 'Bucket Sort' (groupByCurrentYear) para distribuir
   * las fechas de registro en un array de 12 meses, facilitando su
   * representación en gráficos lineales.
   */

  private groupByCurrentYear(registros: RegistroFechaResponse[], year: number) {
    const labels: Date[] = [];
    const data: number[] = new Array(12).fill(0);
    for (let mes = 0; mes < 12; mes++) {
      labels.push(new Date(year, mes, 1));
    }
    registros.forEach((registro) => {
      const date = new Date(registro.fecha_registro);
      if (date.getFullYear() === year) {
        const mesIndex = date.getMonth();
        data[mesIndex]++;
      }
    });
    return { labels, data };
  }

  private async chargeServicesStats() {
    try {
      const { data, error } = await this.supabase.from('Servicio').select(`
          nombre,
          Servicio_Horario (
            id_servicio_horario,
            Contrato (id_contrato)
          )
        `);
      if (error) throw error;
      if (data) {
        const labels: string[] = [];
        const demand: number[] = [];
        const supply: number[] = [];

        data.forEach((servicio: any) => {
          labels.push(servicio.nombre);

          //  OFERTA: Cantidad de horarios/ofertas que tiene este servicio
          const horarios = servicio.Servicio_Horario || [];
          supply.push(horarios.length);

          // DEMANDA: los contratos de todos los horarios de este servicio
          let totalContract = 0;
          horarios.forEach((horario: any) => {
            if (horario.Contrato) {
              totalContract += horario.Contrato.length;
            }
          });
          demand.push(totalContract);
        });

        this._servicesStats$.next({ labels, demand, supply });
      }
    } catch (e) {
      console.error('Error cargando estadísticas de servicios:', e);
    }
  }
}
