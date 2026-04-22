import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ContractDetail, ContractModel, ContractSupabaseJoined } from '../models/ContractModel';
import { from, Observable, throwError, Behaviortopic } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ComunicationService } from './comunication.service';

/**
 * Orchestrator for the lifecycle of hired services.
 * Manages conditional logic based on roles (Client/Business/Admin).
 */
@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private supabase = inject(SupabaseService).getClient();
  private authService = inject(AuthService);
  private contractsList$ = new Behaviortopic<ContractDetail[]>([]);
  private comunicationService = inject(ComunicationService);

  private readonly CONTRACT_SELECT = `
    *,
    id_service_time (
     id_service_time,
     Service ( name )
    ),
    Client:Client!id_client (
      address, city, postcode,
      User_public:User_public!id_client ( name, email )
    ),
    Business:Business!id_business (
      User_public:User_public!id_business ( name, email )
    )
  `;

  constructor() {
    this.initRealtime();
  }

  /**
   * Returns an observable with the list of active contracts.
   */
  getContractsObservable(): Observable<ContractDetail[]> {
    this.refreshContracts();
    return this.contractsList$.asObservable();
  }

  /**
   * Initializes real-time subscription for the Contract table.
   */
  private initRealtime() {
    this.supabase
      .channel('public:contract')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Contract' }, () => {
        this.refreshContracts();
      })
      .subscribe();
  }

  /**
   * Fetches and maps contracts based on the current user's role and permissions.
   */
  private async refreshContracts() {
    const user = this.authService.currentUser();
    if (!user) return;

    let query = this.supabase
      .from('Contract')
      .select(this.CONTRACT_SELECT)
      .neq('state', 'no active');

    if (user.id_user && user.rol !== 'administrator') {
      query = query.or(`id_client.eq.${user.id_user},id_business.eq.${user.id_user}`);
    }

    const { data, error } = await query.order('creation_date', { ascending: false });

    if (!error && data) {
      const mappedData: ContractDetail[] = (data as unknown as ContractSupabaseJoined[]).map(
        (contract) => {
          return {
            ...contract,
            id_st_flat: contract.Service_Time?.id_service_time || contract.id_service_time,
            Client: {
              ...contract.Client,
              clientName: contract.Client?.name || contract.Client?.User_public?.name || 'Unknown',
            },
            Business: {
              ...contract.Business,
              businessName:
                contract.Business?.name || contract.Business?.User_public?.name || 'Unknown',
            },
            serviceName: contract.Service_Time?.Service?.name,
          } as unknown as ContractDetail;
        },
      );

      this.contractsList$.next(mappedData);
    } else {
      console.error('Error refreshing contracts:', error?.message);
    }
  }

  /**
   * Inserts a new contract record into the database.
   */
  createContract(newContract: ContractModel): Observable<boolean> {
    return from(this.supabase.from('Contract').insert(newContract)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Retrieves a single contract by its identifier including related entities.
   */
  getContractsById(id: string): Observable<ContractSupabaseJoined> {
    return from(
      this.supabase
        .from('Contract')
        .select(this.CONTRACT_SELECT)
        .eq('id_contract', id)
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as ContractSupabaseJoined;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Performs a logical delete of a contract and notifies the counterparty.
   */
  deleteContract(id: string): Observable<ContractSupabaseJoined> {
    const todayDate = new Date().toISOString();
    return from(
      this.supabase
        .from('Contract')
        .update({
          state: 'no active',
          end_date: todayDate,
        })
        .eq('id_contract', id)
        .select(this.CONTRACT_SELECT)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as unknown as ContractSupabaseJoined;
      }),
      tap((canceledContract: ContractSupabaseJoined) => {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !canceledContract) return;

        const serviceName = canceledContract.Service_Time?.Service?.name || 'Unknown';
        let idDestination = '';
        let message = '';

        if (currentUser.id_user === canceledContract.id_client) {
          idDestination = canceledContract.id_business;
          message = `El cliente ${canceledContract.Client?.User_public?.name || 'Desconocido'} ha cancelado el contrato del servicio: ${serviceName}.`;
        } else {
          idDestination = canceledContract.id_client;
          message = `La empresa ${canceledContract.Business?.User_public?.name || 'Desconocida'} ha cancelado el contrato del servicio: ${serviceName}.`;
        }

        this.comunicationService
          .insertComunication({
            topic: 'Contrato Cancelado',
            content: message,
            id_receiver: idDestination,
            id_sender: currentUser.id_user,
            type_comunication: 'notificacion',
            read: false,
            deleted_by_sender: false,
            deleted_by_receiver: false,
          })
          .subscribe();
      }),
      catchError((err) => throwError(() => err)),
    );
  }
}
