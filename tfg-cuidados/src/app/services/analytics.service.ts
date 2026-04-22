import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Behaviortopic, Observable } from 'rxjs';
import {
  ContractStats,
  EstadoContratoResponse,
  RegistroFechaResponse,
} from '../models/Analitycs-Service';

/**
 * Service for metrics and data analysis for the administrative dashboard.
 * Handles temporal aggregation and statistical logic.
 */
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private supabase = inject(SupabaseService).getClient();
  private _totalAppUsers$ = new Behaviortopic<number>(0);
  private _monthlyRegisters$ = new Behaviortopic<{ labels: Date[]; data: number[] }>({
    labels: [],
    data: [],
  });

  private _contractsAmountData$ = new Behaviortopic<ContractStats>({
    activeContract: 0,
    cancelContract: 0,
  });

  private _servicesStats$ = new Behaviortopic<{
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
   * Returns an observable with the total count of users in the application.
   */
  getUsuariosCount(): Observable<number> {
    return this._totalAppUsers$.asObservable();
  }

  /**
   * Returns an observable with registration data grouped by month.
   */
  fetchMonthlyUsersRecords(): Observable<{ labels: Date[]; data: number[] }> {
    return this._monthlyRegisters$.asObservable();
  }

  /**
   * Returns an observable with global contract statistics.
   */
  getContractStats(): Observable<ContractStats> {
    return this._contractsAmountData$.asObservable();
  }

  /**
   * Returns an observable with supply and demand statistics per service.
   */
  getServicesStats(): Observable<{ labels: string[]; demand: number[]; supply: number[] }> {
    return this._servicesStats$.asObservable();
  }

  /**
   * Initializes the dashboard by performing parallel data fetching.
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
   * Fetches the total number of users from the user_public table.
   */
  private async chargeTotalUsers() {
    try {
      const { count, error } = await this.supabase
        .from('user_public')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      this._totalAppUsers$.next(count || 0);
    } catch (e) {
      console.error('Error loading total users:', e);
    }
  }

  /**
   * Calculates contract statistics based on their state.
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
      console.error('Error loading contract statistics:', e);
    }
  }

  /**
   * Fetches user registration dates for the current year.
   */
  private async chargeMonthlyRecords() {
    try {
      const currentYear = new Date().getFullYear();
      const januaryMonth = new Date(currentYear, 0, 1);
      januaryMonth.setHours(0, 0, 0, 0);

      const { data, error } = await this.supabase
        .from('user_public')
        .select('register_date')
        .gte('register_date', januaryMonth.toISOString());

      if (error) throw error;

      if (data) {
        const registerData = data as RegistroFechaResponse[];
        this._monthlyRegisters$.next(this.groupByCurrentYear(registerData, currentYear));
      }
    } catch (e) {
      console.error('Error loading records for the current year:', e);
    }
  }

  /**
   * Sets up real-time monitoring for user and contract tables.
   */
  private listenToChangesIRL() {
    this.supabase
      .channel('admin-metrics-internal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_public' }, () => {
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
   * Groups registration dates into monthly buckets for the specified year.
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
   * Aggregates supply and demand data per service.
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
      console.error('Error loading service statistics:', e);
    }
  }
}
