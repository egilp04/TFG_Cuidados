import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { BusinessSupabaseJoinModel } from '../models/Bussiness-Service';
import { BusinessModel } from '../../models/BusinessModel';


/**
 * Service for querying and searching businesses.
 * Aggregates data from Business, User_public, and Service_Time tables,
 * ensuring only active entities are listed.
 */
@Injectable({ providedIn: 'root' })
export class BusinessService {
  private supabase = inject(SupabaseService).getClient();
  private businessesList$ = new BehaviorSubject<BusinessModel[]>([]);

  constructor() {
    this.initRealtime();
  }

  /**
   * Returns an observable with the list of active businesses.
   * @returns Observable<BusinessModel[]>
   */
  getBusinessesObservable(): Observable<BusinessModel[]> {
    this.refreshBusinesses();
    return this.businessesList$.asObservable();
  }

  /**
   * Configures a multi-table real-time subscription.
   * Updates the business list automatically when changes occur in Business or Service_Time tables.
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
   * Fetches active businesses including their public user profile, services, and schedules.
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
      console.error('Error loading businesses:', error.message);
      return;
    }

    if (data) {
      const formatted: BusinessModel[] = (data as BusinessSupabaseJoinModel[]).map(
        (buss) =>
          ({
            ...buss,
            name: buss.User_public?.name || 'Business (No name)',
            email: buss.User_public?.email || '',
            Service_Time: buss.Service_Time || [],
          }) as BusinessModel,
      );
      this.businessesList$.next(formatted);
    }
  }
}
