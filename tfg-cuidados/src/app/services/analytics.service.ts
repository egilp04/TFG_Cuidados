import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ContractStats,
  EstadoContratoResponse,
  RegistroFechaResponse,
} from '../models/Analitycs-Service';

/**
 * Servicio para métricas y análisis de datos del panel de administración.
 * Gestiona la agregación temporal y lógica estadística.
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

  /**
   * Retorna un observable con el recuento total de usuarios en la aplicación.
   */
  getUsuariosCount(): Observable<number> {
    return this._totalAppUsers$.asObservable();
  }

  /**
   * Retorna un observable con datos de registros agrupados por mes.
   */
  fetchMonthlyUsersRecords(): Observable<{ labels: Date[]; data: number[] }> {
    return this._monthlyRegisters$.asObservable();
  }

  /**
   * Retorna un observable con estadísticas globales de contratos.
   */
  getContractStats(): Observable<ContractStats> {
    return this._contractsAmountData$.asObservable();
  }

  /**
   * Retorna un observable con estadísticas de oferta y demanda por servicio.
   */
  getServicesStats(): Observable<{ labels: string[]; demand: number[]; supply: number[] }> {
    return this._servicesStats$.asObservable();
  }

  /**
   * Inicializa el panel realizando obtención de datos en paralelo.
   */
  private async initDashboard() {
    await Promise.allSettled([
      this.chargeTotalUsers(),
      this.chargeMonthlyRecords(),
      this.chargeContractsStatics(),
      this.chargeServicesStats(),
    ]);
    this.listenToChangesIRL();
  }

  /**
   * Obtiene el número total de usuarios de la tabla User_public.
   */
  private async chargeTotalUsers() {
    try {
      const { count, error } = await this.supabase
        .from('User_public')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      this._totalAppUsers$.next(count || 0);
    } catch (e) {
      console.error('Error al cargar usuarios totales:', e);
    }
  }

  /**
   * Calcula estadísticas de contratos basadas en su estado.
   */
  private async chargeContractsStatics() {
    try {
      const { data, error } = await this.supabase.from('Contract').select('state');
      if (error) throw error;
      if (data) {
        const contracts = data as EstadoContratoResponse[];
        const stats: ContractStats = {
          activeContract: contracts.filter((c) => c.state === 'active').length,
          cancelContract: contracts.filter((c) => c.state === 'no active').length,
        };
        this._contractsAmountData$.next(stats);
      }
    } catch (e) {
      console.error('Error al cargar estadísticas de contratos:', e);
    }
  }

  /**
   * Obtiene fechas de registro de usuarios para el año actual.
   */
  private async chargeMonthlyRecords() {
    try {
      const currentYear = new Date().getFullYear();
      const januaryMonth = new Date(currentYear, 0, 1);
      januaryMonth.setHours(0, 0, 0, 0);

      const { data, error } = await this.supabase
        .from('User_public')
        .select('register_date')
        .gte('register_date', januaryMonth.toISOString());

      if (error) throw error;

      if (data) {
        const registerData = data as RegistroFechaResponse[];
        this._monthlyRegisters$.next(this.groupByCurrentYear(registerData, currentYear));
      }
    } catch (e) {
      console.error('Error al cargar registros del año actual:', e);
    }
  }

  /**
   * Establece monitoreo en tiempo real para las tablas de usuarios y contratos.
   */
  private listenToChangesIRL() {
    this.supabase
      .channel('admin-metrics-internal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'User_public' }, () => {
        this.chargeTotalUsers();
        this.chargeMonthlyRecords();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Contract' }, () => {
        this.chargeContractsStatics();
        this.chargeServicesStats();
      })
      .subscribe();
  }

  /**
   * Agrupa fechas de registro en buckets mensuales para el año especificado.
   */
  private groupByCurrentYear(registros: RegistroFechaResponse[], year: number) {
    const labels: Date[] = [];
    const data: number[] = new Array(12).fill(0);
    for (let mes = 0; mes < 12; mes++) {
      labels.push(new Date(year, mes, 1));
    }
    registros.forEach((registro) => {
      const date = new Date(registro.register_date);
      if (date.getFullYear() === year) {
        const mesIndex = date.getMonth();
        data[mesIndex]++;
      }
    });
    return { labels, data };
  }

  /**
   * Agrega datos de oferta y demanda por servicio.
   */
  private async chargeServicesStats() {
    try {
      const { data, error } = await this.supabase.from('Service').select(`
          name,
          Service_Time (
            id_service_time,
            Contract (id_contract)
          )
        `);
      if (error) throw error;
      if (data) {
        const labels: string[] = [];
        const demand: number[] = [];
        const supply: number[] = [];

        interface ServiceQueryResponse {
          name: string;
          Service_Time: {
            id_service_time: string;
            Contract: { id_contract: string }[];
          }[];
        }

        const typedData = data as unknown as ServiceQueryResponse[];

        typedData.forEach((service) => {
          labels.push(service.name);

          const timeSlots = service.Service_Time || [];
          supply.push(timeSlots.length);

          let totalContracts = 0;
          timeSlots.forEach((slot) => {
            if (slot.Contract) {
              totalContracts += slot.Contract.length;
            }
          });
          demand.push(totalContracts);
        });

        this._servicesStats$.next({ labels, demand, supply });
      }
    } catch (e) {
      console.error('Error al cargar estadísticas de servicios:', e);
    }
  }
}
