import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Behaviortopic, from, Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TimeModel } from '../models/TimeModel';

/**
 * Master service for time and schedule management.
 * Implements integrity validations to avoid scheduling collisions.
 */
@Injectable({
  providedIn: 'root',
})
export class TimeService {
  private supabaseService = inject(SupabaseService);
  private clientSupaBase = this.supabaseService.getClient();

  private timesList$ = new Behaviortopic<TimeModel[]>([]);

  constructor() {
    this.initRealtime();
  }

  /**
   * Returns an observable with the list of managed schedules.
   */
  getTimesObservable(): Observable<TimeModel[]> {
    this.refreshTimes();
    return this.timesList$.asObservable();
  }

  /**
   * Configures real-time listening for the Time table.
   */
  private initRealtime() {
    this.clientSupaBase
      .channel('public:Time')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Time' }, () => {
        this.refreshTimes();
      })
      .subscribe();
  }

  /**
   * Retrieves schedules organized by week day and time from the server.
   */
  private async refreshTimes() {
    const { data, error } = await this.clientSupaBase
      .from('Time')
      .select('*')
      .order('week_day', { ascending: true })
      .order('time', { ascending: true });

    if (!error) {
      this.timesList$.next((data ?? []) as TimeModel[]);
    }
  }

  /**
   * Inserts a new schedule record into the catalog.
   */
  insertTime(newTime: TimeModel): Observable<void> {
    return from(this.clientSupaBase.from('Time').insert(newTime)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message || 'Error inserting time'))),
    );
  }

  /**
   * Deletes a specific schedule record by its unique identifier.
   */
  deleteTime(id: string): Observable<void> {
    return from(this.clientSupaBase.from('Time').delete().eq('id_time', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message || 'Error deleting time'))),
    );
  }

  /**
   * Updates an existing schedule record with new values.
   */
  updateTime(id: string, changes: Partial<TimeModel>): Observable<void> {
    return from(this.clientSupaBase.from('Time').update(changes).eq('id_time', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => new Error(err.message || 'Error updating time'))),
    );
  }

  /**
   * Checks for logical uniqueness of a time slot (day and hour combination).
   */
  existsTime(day: string, time: string, idToExclude?: string): Observable<boolean> {
    let query = this.clientSupaBase
      .from('Time')
      .select('id_time')
      .eq('week_day', day)
      .eq('time', time);

    if (idToExclude) {
      query = query.neq('id_time', idToExclude);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data && data.length > 0;
      }),
      catchError(() => of(false)),
    );
  }
}
