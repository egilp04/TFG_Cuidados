import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ContratoModel } from '../models/Contrato';
import { from, Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ComunicationService } from './comunication.service';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private supabase = inject(SupabaseService).getClient();
  private authService = inject(AuthService);
  private contractsList$ = new BehaviorSubject<any[]>([]);
  private comunicationService = inject(ComunicationService);
  private readonly CONTRATO_SELECT = `
    *,
    id_servicio_horario (
     id_servicio_horario,
     Servicio ( nombre )
    ),
    Cliente:Cliente!fk_contrato_cliente (
      direccion, localidad, codpostal,
      Usuario:Usuario!id_cliente ( nombre, email )
    ),
    Empresa:Empresa!fk_contrato_empresa (
      Usuario:Usuario!id_empresa ( nombre, email )
    )
  `;

  constructor() {
    this.initRealtime();
  }

  getContractsObservable(): Observable<any[]> {
    this.refreshContracts();
    return this.contractsList$.asObservable();
  }

  private initRealtime() {
    this.supabase
      .channel('public:contrato')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Contrato' }, () => {
        this.refreshContracts();
      })
      .subscribe();
  }

  private async refreshContracts() {
    const user = this.authService.currentUser();
    if (!user) return;
    let query = this.supabase
      .from('Contrato')
      .select(this.CONTRATO_SELECT)
      .neq('estado', 'no activo');
    if (user.id_usuario && !user.esAdmin) {
      query = query.or(`id_cliente.eq.${user.id_usuario},id_empresa.eq.${user.id_usuario}`);
    }

    const { data, error } = await query.order('fecha_creacion', { ascending: false });

    if (!error && data) {
      const mappedData = data.map((contrato: any) => {
        return {
          ...contrato,
          id_sh_plano:
            contrato.id_servicio_horario?.id_servicio_horario || contrato.id_servicio_horario,
          Cliente: {
            ...contrato.Cliente,
            nombreDelCliente:
              contrato.Cliente?.nombre || contrato.Cliente?.Usuario?.nombre || 'Desconocido',
          },
          Empresa: {
            ...contrato.Empresa,
            nombreDeLaEmpresa:
              contrato.Empresa?.nombre || contrato.Empresa?.Usuario?.nombre || 'Desconocida',
          },
          nombreServicio: contrato.id_servicio_horario?.Servicio?.nombre,
        };
      });
      this.contractsList$.next(mappedData);
    } else {
      console.error('Error al refrescar contratos:', error?.message);
    }
  }

  createContract(nuevoContrato: ContratoModel): Observable<boolean> {
    return from(this.supabase.from('Contrato').insert(nuevoContrato)).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  getContractsById(id: string): Observable<any> {
    return from(
      this.supabase
        .from('Contrato')
        .select(this.CONTRATO_SELECT)
        .eq('id_contrato', id)
        .maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  deleteContract(id: string): Observable<any> {
    const fechaHoy = new Date().toISOString();
    return from(
      this.supabase
        .from('Contrato')
        .update({
          estado: 'no activo',
          fecha_fin: fechaHoy,
        })
        .eq('id_contrato', id)
        .select(this.CONTRATO_SELECT)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      tap((contratoCancelado: any) => {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !contratoCancelado) return;

        const nombreServicio =
          contratoCancelado.id_servicio_horario?.Servicio?.nombre || 'un servicio';
        let idDestino = '';
        let mensaje = '';

        // Si el que borra es el cliente del contrato
        if (currentUser.id_usuario === contratoCancelado.id_cliente) {
          idDestino = contratoCancelado.id_empresa;
          mensaje = `El cliente ${contratoCancelado.Cliente?.Usuario?.nombre} ha cancelado el contrato del servicio: ${nombreServicio}.`;
        } else {
          idDestino = contratoCancelado.id_cliente;
          mensaje = `La empresa ${contratoCancelado.Empresa?.Usuario?.nombre} ha cancelado el contrato del servicio: ${nombreServicio}.`;
        }

        this.comunicationService
          .insertComunicacion({
            asunto: 'Contrato Cancelado',
            contenido: mensaje,
            id_receptor: idDestino,
            id_emisor: currentUser.id_usuario,
            tipo_comunicacion: 'notificacion',
            fecha_envio: new Date(),
            leido: false,
            eliminado_por_emisor: false,
            eliminado_por_receptor: false,
          })
          .subscribe();
      }),
      catchError((err) => throwError(() => err))
    );
  }
}
