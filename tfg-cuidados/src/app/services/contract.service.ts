import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ContractDetail, ContractModel, ContractSupabaseJoined } from '../models/ContractModel';
import { from, Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ComunicationService } from './comunication.service';

/**
 * Orquestador del ciclo de vida de servicios contratados.
 * Gestiona lógica condicional basada en roles (Cliente/Negocio/Administrador).
 */
@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private supabase = inject(SupabaseService).getClient();
  private authService = inject(AuthService);
  private contractsList$ = new BehaviorSubject<ContractDetail[]>([]);
  private comunicationService = inject(ComunicationService);

  private readonly CONTRACT_SELECT = `
    *,
    id_service_time (
     id_service_time,
     price,
     Service ( name )
    ),
    Client:Client!id_client (
      address, city, postcode,
      User_public:User_public!id_client ( name, email, avatar_url)
    ),
    Business:Business!id_business (
      User_public:User_public!id_business ( name, email, avatar_url)
    )
  `;

  constructor() {
    this.initRealtime();
  }

  /**
   * Retorna un observable con la lista de contratos activos.
   */
  getContractsObservable(): Observable<ContractDetail[]> {
    this.refreshContracts();
    return this.contractsList$.asObservable();
  }

  /**
   * Inicializa la suscripción en tiempo real de la tabla Contract.
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
   * Obtiene y mapea contratos basados en el rol y permisos del usuario actual.
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
          const stData = contract.id_service_time as any;
          return {
            ...contract,
            id_st_flat: stData?.id_service_time || contract.id_service_time,
            Client: {
              ...contract.Client,
              clientName:
                contract.Client?.name || contract.Client?.User_public?.name || 'Desconocido',
            },
            price: stData?.price,
            Business: {
              ...contract.Business,
              businessName:
                contract.Business?.name || contract.Business?.User_public?.name || 'Desconocido',
            },
            serviceName: stData?.Service?.name,
          } as unknown as ContractDetail;
        },
      );

      this.contractsList$.next(mappedData);
    } else {
      console.error('Error al actualizar contratos:', error?.message);
    }
  }

  /**
   * Inserta un nuevo registro de contrato en la base de datos.
   */
  createContract(newContract: ContractModel): Observable<boolean> {
    return from(this.supabase.from('Contract').insert(newContract)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      }),
      tap(() => this.refreshContracts()),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Recupera un contrato individual por su identificador incluyendo entidades relacionadas.
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
   * Realiza una eliminación lógica de un contrato y notifica a la contraparte.
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
        const stData = canceledContract.id_service_time as any;
        const serviceName = stData?.Service?.name || 'Desconocido';
        let idDestination = '';
        let message = '';

        if (currentUser.id_user === canceledContract.id_client) {
          idDestination = canceledContract.id_business;
          message = `El cliente ${canceledContract.Client?.User_public?.name || 'Desconocido'} ha cancelado el contrato del servicio: ${serviceName}. Información adicional: día - ${canceledContract.week_day_hired}, hora - ${canceledContract.time_hired}.`;
        } else {
          idDestination = canceledContract.id_client;
        }

        this.comunicationService
          .insertComunication({
            topic: 'Contrato Cancelado',
            content: message,
            id_receiver: idDestination,
            id_sender: currentUser.id_user,
            type_comunication: 'notification',
            read: false,
            deleted_by_sender: false,
            deleted_by_receiver: false,
          })
          .subscribe();
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * ADMIN ONLY: Fetch all contracts (Active and Inactive) from the database
   */
  getAllContractsForAdmin(): Observable<ContractDetail[]> {
    const queryPromise = this.supabase
      .from('Contract')
      .select(this.CONTRACT_SELECT)
      .order('creation_date', { ascending: false });

    return from(queryPromise).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) return [];

        return (data as unknown as ContractSupabaseJoined[]).map((contract) => {
          const stData = contract.id_service_time as any;
          return {
            ...contract,
            id_st_flat: stData?.id_service_time || contract.id_service_time,
            Client: {
              ...contract.Client,
              clientName: contract.Client?.name || contract.Client?.User_public?.name || 'Unknown',
            },
            Business: {
              ...contract.Business,
              businessName:
                contract.Business?.name || contract.Business?.User_public?.name || 'Unknown',
            },
            serviceName: stData?.Service?.name,
            price: stData?.price,
          } as unknown as ContractDetail;
        });
      }),
      catchError((err) => {
        console.error('Error fetching admin contracts:', err);
        return of([]);
      }),
    );
  }
}
