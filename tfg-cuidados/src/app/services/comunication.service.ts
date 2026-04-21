import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, throwError, BehaviorSubject, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ComunicationModel } from '../models/Comunicacion';
import { AuthService } from './auth.service';

/**
 * @description Servicio central de comunicaciones. Gestiona el flujo bidireccional
 * de mensajes y notificaciones del sistema utilizando programación reactiva (RxJS).
 */
@Injectable({
  providedIn: 'root',
})
export class ComunicationService {
  /**
   * BehaviorSubjects que actúan como "Single Source of Truth" para la interfaz.
   * Permiten que múltiples componentes consuman los mismos datos en tiempo real.
   */
  private supabase = inject(SupabaseService).getClient();
  private authService = inject(AuthService);
  private readonly validtypeComunication = ['mensaje', 'notificacion'] as const;
  private messagesList$ = new BehaviorSubject<ComunicationModel[]>([]);
  private notificationsList$ = new BehaviorSubject<ComunicationModel[]>([]);

  constructor() {
    this.initRealtime();
  }

  getMessagesObservable(): Observable<ComunicationModel[]> {
    this.refreshMessages();
    return this.messagesList$.asObservable();
  }

  getNotificationsObservable(): Observable<ComunicationModel[]> {
    this.refreshNotificacions();
    return this.notificationsList$.asObservable();
  }

  getUnreadMessagesCount(): Observable<number> {
    return this.messagesList$.asObservable().pipe(
      map((mensajes) => {
        const user = this.authService.currentUser();
        if (!user) return 0;
        return mensajes.filter((m) => !m.leido && m.id_receptor === user.id_usuario).length;
      }),
    );
  }

  getUnreadNotificationsCount(): Observable<number> {
    return this.notificationsList$.asObservable().pipe(
      map((notificaciones) => {
        return notificaciones.filter((n) => !n.leido).length;
      }),
    );
  }

  private initRealtime() {
    this.supabase
      .channel('public:comunicacion')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comunicacion' }, () => {
        this.refreshMessages();
        this.refreshNotificacions();
      })
      .subscribe();
  }

  private async refreshMessages() {
    const user = this.authService.currentUser();
    if (!user) {
      this.messagesList$.next([]);
      return;
    }
    const { data, error } = await this.supabase
      .from('Comunicacion')
      .select(
        `
      *,
      Emisor:Usuario!fk_comunicacion_emisor (email),
      Receptor:Usuario!fk_comunicacion_receptor (nombre, email)
    `,
      )
      .eq('tipo_comunicacion', 'mensaje')
      .or(`id_receptor.eq.${user.id_usuario},id_emisor.eq.${user.id_usuario}`)
      .order('fecha_envio', { ascending: false });

    if (!error) {
      const dataMessages = (data as ComunicationModel[]) || [];
      const filteresMessages = dataMessages.filter((m) => {
        if (m.id_receptor === user.id_usuario) return !m.eliminado_por_receptor;
        if (m.id_emisor === user.id_usuario) return !m.eliminado_por_emisor;
        return true;
      });
      this.messagesList$.next(filteresMessages);
    } else {
      console.error('Error fetching mensajes:', error);
    }
  }

  private async refreshNotificacions() {
    const user = this.authService.currentUser();
    if (!user) {
      this.notificationsList$.next([]);
      return;
    }
    const { data, error } = await this.supabase
      .from('Comunicacion')
      .select('*')
      .eq('tipo_comunicacion', 'notificacion')
      .eq('id_receptor', user.id_usuario)
      .eq('eliminado_por_receptor', false)
      .order('fecha_envio', { ascending: false });

    if (!error) {
      this.notificationsList$.next((data as ComunicationModel[]) || []);
    }
  }

  /**
   * Lógica de interceptación: Tras insertar un registro de tipo 'mensaje',
   * el sistema dispara una llamada interna para generar una notificación persistente
   * al usuario receptor.
   */
  insertComunication(comunication: Omit<ComunicationModel, 'fecha_envio'>): Observable<void> {
    if (!this.validtypeComunication.includes(comunication.tipo_comunicacion as any)) {
      return throwError(() => new Error('tipo_comunicacion inválido.'));
    }
    return from(this.supabase.from('Comunicacion').insert(comunication)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      switchMap(() => {
        if (comunication.tipo_comunicacion === 'mensaje' && comunication.id_receptor) {
          const asunto = 'Nuevo Mensaje Recibido';
          const contenido = 'Tienes un nuevo mensaje en tu bandeja de entrada.';
          return this.sendNotification(comunication.id_receptor, asunto, contenido);
        }
        return of(void 0);
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  updateComunication(id: string, changes: Partial<ComunicationModel>): Observable<void> {
    const currentMenssages = this.messagesList$.getValue();
    const indexM = currentMenssages.findIndex((m) => m.id_comunicacion === id);
    if (indexM !== -1) {
      const updatedList = [...currentMenssages];
      updatedList[indexM] = { ...updatedList[indexM], ...changes };
      this.messagesList$.next(updatedList);
    }
    const currentNotis = this.notificationsList$.getValue();
    const indexN = currentNotis.findIndex((n) => n.id_comunicacion === id);
    if (indexN !== -1) {
      const updatedList = [...currentNotis];
      updatedList[indexN] = { ...updatedList[indexN], ...changes };
      this.notificationsList$.next(updatedList);
    }
    return from(this.supabase.from('Comunicacion').update(changes).eq('id_comunicacion', id)).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Implementa un borrado lógico de comunicaciones.
   * Dependiendo de quién ejecute la acción, marca el flag 'eliminado_por_emisor'
   * o 'eliminado_por_receptor' para mantener la integridad de la bandeja del otro usuario.
   */
  deleteComunicacion(messages: ComunicationModel): Observable<void> {
    const user = this.authService.currentUser();
    if (!user || !messages.id_comunicacion) return of(undefined);

    if (messages.tipo_comunicacion === 'mensaje') {
      const currentMenssages = this.messagesList$.getValue();
      const newMensajes = currentMenssages.filter(
        (m) => m.id_comunicacion !== messages.id_comunicacion,
      );
      if (currentMenssages.length !== newMensajes.length) {
        this.messagesList$.next(newMensajes);
      }
    } else {
      const currentNotis = this.notificationsList$.getValue();
      const newNotis = currentNotis.filter((n) => n.id_comunicacion !== messages.id_comunicacion);
      if (currentNotis.length !== newNotis.length) {
        this.notificationsList$.next(newNotis);
      }
    }

    let updates: Partial<ComunicationModel> = {};

    if (messages.id_emisor === user.id_usuario) {
      updates = { eliminado_por_emisor: true };
    } else if (messages.id_receptor === user.id_usuario) {
      updates = { eliminado_por_receptor: true };
    } else {
      return of(undefined);
    }

    return from(
      this.supabase
        .from('Comunicacion')
        .update(updates)
        .eq('id_comunicacion', messages.id_comunicacion),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  getMensajeId(idMensaje: string): Observable<ComunicationModel> {
    return from(
      this.supabase.from('Comunicacion').select('*').eq('id_comunicacion', idMensaje).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ComunicationModel;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  private sendNotification(idReceiver: string, topic: string, content: string): Observable<void> {
    const notificacion = {
      tipo_comunicacion: 'notificacion' as const,
      id_emisor: null,
      id_receptor: idReceiver,
      asunto: topic,
      contenido: content,
      leido: false,
      eliminado_por_emisor: false,
      eliminado_por_receptor: false,
    };

    return this.insertComunication(notificacion);
  }

  notifyAdmins(topic: string, content: string): Observable<void> {
    return from(
      this.supabase
        .from('Usuario')
        .select('id_usuario')
        .eq('rol', 'administrador')
        .eq('estado', true),
    ).pipe(
      switchMap(({ data }) => {
        if (!data || data.length === 0) return of(void 0);
        const adminsData = data as AdminResponse[];
        const notifications = adminsData.map((admin) =>
          this.sendNotification(admin.id_usuario, topic, content),
        );

        return forkJoin(notifications).pipe(map(() => void 0));
      }),
      catchError((err) => {
        console.error('Error notificando admins', err);
        return of(void 0);
      }),
    );
  }

  notifyUsers(idReceiverUser: string, topic: string, content: string): Observable<void> {
    return this.sendNotification(idReceiverUser, topic, content);
  }

  refreshUsersData() {
    this.refreshMessages();
    this.refreshNotificacions();
  }
}
