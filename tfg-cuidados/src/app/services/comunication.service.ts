import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, throwError, BehaviorSubject, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ComunicacionModel } from '../models/Comunicacion';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ComunicationService {
  private supabase = inject(SupabaseService).getClient();
  private authService = inject(AuthService);
  private readonly tiposValidos = ['mensaje', 'notificacion'] as const;
  private mensajesList$ = new BehaviorSubject<ComunicacionModel[]>([]);
  private notificacionesList$ = new BehaviorSubject<ComunicacionModel[]>([]);

  constructor() {
    this.initRealtime();
  }

  getMessagesObservable(): Observable<ComunicacionModel[]> {
    this.refreshMensajes();
    return this.mensajesList$.asObservable();
  }

  getNotificationsObservable(): Observable<ComunicacionModel[]> {
    this.refreshNotificaciones();
    return this.notificacionesList$.asObservable();
  }

  getUnreadMessagesCount(): Observable<number> {
    return this.mensajesList$.asObservable().pipe(
      map((mensajes) => {
        const user = this.authService.currentUser();
        if (!user) return 0;
        return mensajes.filter((m) => !m.leido && m.id_receptor === user.id_usuario).length;
      })
    );
  }

  getUnreadNotificationsCount(): Observable<number> {
    return this.notificacionesList$.asObservable().pipe(
      map((notificaciones) => {
        return notificaciones.filter((n) => !n.leido).length;
      })
    );
  }

  private initRealtime() {
    this.supabase
      .channel('public:comunicacion')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comunicacion' }, () => {
        this.refreshMensajes();
        this.refreshNotificaciones();
      })
      .subscribe();
  }

  private async refreshMensajes() {
    const user = this.authService.currentUser();
    if (!user) {
      this.mensajesList$.next([]);
      return;
    }
    const { data, error } = await this.supabase
      .from('Comunicacion')
      .select(
        `
        *,
        Emisor:Usuario!fk_comunicacion_emisor ( nombre ),
        Receptor:Usuario!fk_comunicacion_receptor ( nombre )
      `
      )
      .eq('tipo_comunicacion', 'mensaje')
      .or(`id_receptor.eq.${user.id_usuario},id_emisor.eq.${user.id_usuario}`)
      .order('fecha_envio', { ascending: false });

    if (!error) {
      this.mensajesList$.next(data || []);
    } else {
      console.error('Error fetching mensajes:', error);
    }
  }

  private async refreshNotificaciones() {
    const user = this.authService.currentUser();
    if (!user) {
      this.notificacionesList$.next([]);
      return;
    }
    const { data, error } = await this.supabase
      .from('Comunicacion')
      .select('*')
      .eq('tipo_comunicacion', 'notificacion')
      .eq('id_receptor', user.id_usuario)
      .order('fecha_envio', { ascending: false });

    if (!error) {
      this.notificacionesList$.next(data || []);
    }
  }

  insertComunicacion(comunicacion: ComunicacionModel): Observable<void> {
    if (!this.tiposValidos.includes(comunicacion.tipo_comunicacion)) {
      return throwError(() => new Error('tipo_comunicacion inválido.'));
    }
    return from(this.supabase.from('Comunicacion').insert(comunicacion)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      switchMap(() => {
        if (comunicacion.tipo_comunicacion === 'mensaje' && comunicacion.id_receptor) {
          const asunto = 'Nuevo Mensaje Recibido';
          const contenido = 'Tienes un nuevo mensaje en tu bandeja de entrada.';
          return this.sendNotification(comunicacion.id_receptor, asunto, contenido);
        }
        return of(void 0);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  updateComunicacion(id: string, changes: Partial<ComunicacionModel>): Observable<void> {
    const currentMensajes = this.mensajesList$.getValue();
    const indexM = currentMensajes.findIndex((m) => m.id_comunicacion === id);
    if (indexM !== -1) {
      const updatedList = [...currentMensajes];
      updatedList[indexM] = { ...updatedList[indexM], ...changes };
      this.mensajesList$.next(updatedList);
    }
    const currentNotis = this.notificacionesList$.getValue();
    const indexN = currentNotis.findIndex((n) => n.id_comunicacion === id);
    if (indexN !== -1) {
      const updatedList = [...currentNotis];
      updatedList[indexN] = { ...updatedList[indexN], ...changes };
      this.notificacionesList$.next(updatedList);
    }
    return from(this.supabase.from('Comunicacion').update(changes).eq('id_comunicacion', id)).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      catchError((err) => throwError(() => err))
    );
  }

  deleteComunicacion(mensaje: ComunicacionModel): Observable<void> {
    const user = this.authService.currentUser();
    if (!user || !mensaje.id_comunicacion) return of(undefined);
    if (mensaje.tipo_comunicacion === 'mensaje') {
      const currentMensajes = this.mensajesList$.getValue();
      const newMensajes = currentMensajes.filter(
        (m) => m.id_comunicacion !== mensaje.id_comunicacion
      );
      if (currentMensajes.length !== newMensajes.length) {
        this.mensajesList$.next(newMensajes);
      }
    } else {
      const currentNotis = this.notificacionesList$.getValue();
      const newNotis = currentNotis.filter((n) => n.id_comunicacion !== mensaje.id_comunicacion);
      if (currentNotis.length !== newNotis.length) {
        this.notificacionesList$.next(newNotis);
      }
    }
    let updates: any = {};
    if (mensaje.id_emisor === user.id_usuario) {
      updates = { eliminado_por_emisor: true };
    } else if (mensaje.id_receptor === user.id_usuario) {
      updates = { eliminado_por_receptor: true };
    } else {
      return of(undefined);
    }

    return from(
      this.supabase
        .from('Comunicacion')
        .update(updates)
        .eq('id_comunicacion', mensaje.id_comunicacion)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  getMensajeId(idMensaje: string): Observable<ComunicacionModel> {
    return from(
      this.supabase.from('Comunicacion').select('*').eq('id_comunicacion', idMensaje).single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ComunicacionModel;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  private sendNotification(
    idReceptor: string,
    asunto: string,
    contenido: string
  ): Observable<void> {
    const notificacion: ComunicacionModel = {
      tipo_comunicacion: 'notificacion',
      id_emisor: null,
      id_receptor: idReceptor,
      asunto: asunto,
      contenido: contenido,
      fecha_envio: new Date(),
      leido: false,
      eliminado_por_emisor: false,
      eliminado_por_receptor: false,
    };

    return this.insertComunicacion(notificacion);
  }

  notifyAdmins(asunto: string, contenido: string): Observable<void> {
    return from(this.supabase.from('Administrador').select('id_administrador')).pipe(
      switchMap(({ data }) => {
        if (!data || data.length === 0) return of(void 0);
        const notificaciones = data.map((admin: any) =>
          this.sendNotification(admin.id_administrador, asunto, contenido)
        );

        return forkJoin(notificaciones).pipe(map(() => void 0));
      }),
      catchError((err) => {
        console.error('Error notificando admins', err);
        return of(void 0);
      })
    );
  }

  notifyUsers(idUsuarioDestino: string, asunto: string, contenido: string): Observable<void> {
    return this.sendNotification(idUsuarioDestino, asunto, contenido);
  }

  refreshUsersData() {
    this.refreshMensajes();
    this.refreshNotificaciones();
  }
}
