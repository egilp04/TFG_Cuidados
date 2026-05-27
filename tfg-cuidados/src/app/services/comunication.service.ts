import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable, throwError, BehaviorSubject, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { ComunicationModel } from '../models/ComunicationModel';
import { AuthService } from './auth.service';
import { TranslateService } from '@ngx-translate/core';

/**
 * Servicio de comunicación central. Gestiona el flujo bidireccional de mensajes
 * y notificaciones del sistema utilizando programación reactiva.
 */
@Injectable({
  providedIn: 'root',
})
export class ComunicationService {
  private supabase = inject(SupabaseService).getClient();
  private authService = inject(AuthService);
  private readonly validTypeComunication = ['message', 'notification'] as const;
  private messagesList$ = new BehaviorSubject<ComunicationModel[]>([]);
  private notificationsList$ = new BehaviorSubject<ComunicationModel[]>([]);
  private translate = inject(TranslateService);

  constructor() {
    this.initRealtime();
  }

  /**
   * Retorna un observable de los mensajes del usuario actual.
   */
  getMessagesObservable(): Observable<ComunicationModel[]> {
    this.refreshMessages();
    return this.messagesList$.asObservable();
  }

  /**
   * Retorna un observable de las notificaciones del usuario actual.
   */
  getNotificationsObservable(): Observable<ComunicationModel[]> {
    this.refreshNotificacions();
    return this.notificationsList$.asObservable();
  }

  /**
   * Calcula el número de mensajes no leídos del usuario actual.
   */
  getUnreadMessagesCount(): Observable<number> {
    return this.messagesList$.asObservable().pipe(
      map((messages) => {
        const user = this.authService.currentUser();
        if (!user) return 0;
        return messages.filter((m) => !m.read && m.id_receiver === user.id_user).length;
      }),
    );
  }

  /**
   * Calcula el número de notificaciones no leídas del usuario actual.
   */
  getUnreadNotificationsCount(): Observable<number> {
    return this.notificationsList$.asObservable().pipe(
      map((notifications) => {
        return notifications.filter((n) => !n.read).length;
      }),
    );
  }

  /**
   * Inicializa la escucha en tiempo real de la tabla Comunication.
   */
  private initRealtime() {
    this.supabase
      .channel('public:comunication')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Comunication' }, () => {
        this.refreshMessages();
        this.refreshNotificacions();
      })
      .subscribe();
  }

  /**
   * Sincroniza la lista de mensajes desde la base de datos.
   */
  private async refreshMessages() {
    const user = this.authService.currentUser();
    if (!user) {
      this.messagesList$.next([]);
      return;
    }
    const { data, error } = await this.supabase
      .from('Comunication')
      .select(
        `
      *,
      Sender:User_public!id_sender (email),
      Receiver:User_public!id_receiver (name, email)
    `,
      )
      .eq('type_comunication', 'message')
      .or(`id_receiver.eq.${user.id_user},id_sender.eq.${user.id_user}`)
      .order('send_date', { ascending: false });

    if (!error) {
      const dataMessages = (data as ComunicationModel[]) || [];
      const filteredMessages = dataMessages.filter((m) => {
        if (m.id_receiver === user.id_user) return !m.deleted_by_receiver;
        if (m.id_sender === user.id_user) return !m.deleted_by_sender;
        return true;
      });
      this.messagesList$.next(filteredMessages);
    } else {
      console.error('Error al obtener mensajes:', error);
    }
  }

  /**
   * Sincroniza la lista de notificaciones desde la base de datos.
   */
  private async refreshNotificacions() {
    const user = this.authService.currentUser();
    if (!user) {
      this.notificationsList$.next([]);
      return;
    }
    const { data, error } = await this.supabase
      .from('Comunication')
      .select('*')
      .eq('type_comunication', 'notification')
      .eq('id_receiver', user.id_user)
      .eq('deleted_by_receiver', false)
      .order('send_date', { ascending: false });

    if (!error) {
      this.notificationsList$.next((data as ComunicationModel[]) || []);
    }
  }

  /**
   * Inserta un nuevo registro de comunicación y genera una notificación si es un mensaje.
   */
  insertComunication(comunication: Omit<ComunicationModel, 'send_date'>): Observable<void> {
    if (!this.validTypeComunication.includes(comunication.type_comunication as any)) {
      return throwError(
        () => new Error(this.translate.instant('ERRORS.COMUNICATION.INVALID_TYPE')),
      );
    }

    return from(this.supabase.from('Comunication').insert(comunication)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      switchMap(() => {
        if (comunication.type_comunication === 'message' && comunication.id_receiver) {
          const topic = 'Nuevo Mensaje Recibido';
          const content = 'Tienes un nuevo mensaje en tu bandeja de entrada.';
          return this.sendNotification(comunication.id_receiver, topic, content);
        }
        return of(void 0);
      }),
      tap(() => {
        this.refreshUsersData();
      }),

      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Actualiza un registro de comunicación existente.
   */
  updateComunication(id: string, changes: Partial<ComunicationModel>): Observable<void> {
    const currentMessages = this.messagesList$.getValue();
    const indexM = currentMessages.findIndex((m) => m.id_comunication === id);
    if (indexM !== -1) {
      const updatedList = [...currentMessages];
      updatedList[indexM] = { ...updatedList[indexM], ...changes };
      this.messagesList$.next(updatedList);
    }
    const currentNotis = this.notificationsList$.getValue();
    const indexN = currentNotis.findIndex((n) => n.id_comunication === id);
    if (indexN !== -1) {
      const updatedList = [...currentNotis];
      updatedList[indexN] = { ...updatedList[indexN], ...changes };
      this.notificationsList$.next(updatedList);
    }
    return from(this.supabase.from('Comunication').update(changes).eq('id_comunication', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Realiza una eliminación lógica de una comunicación basada en el rol del usuario activo (remitente/destinatario).
   */
  deleteComunication(message: ComunicationModel): Observable<void> {
    const user = this.authService.currentUser();
    if (!user || !message.id_comunication) return of(undefined);
    if (message.type_comunication === 'message') {
      const currentMessages = this.messagesList$.getValue();
      const newMessages = currentMessages.filter(
        (m) => m.id_comunication !== message.id_comunication,
      );
      if (currentMessages.length !== newMessages.length) {
        this.messagesList$.next(newMessages);
      }
    } else {
      const currentNotis = this.notificationsList$.getValue();
      const newNotis = currentNotis.filter((n) => n.id_comunication !== message.id_comunication);
      if (currentNotis.length !== newNotis.length) {
        this.notificationsList$.next(newNotis);
      }
    }

    let dbOperation: any;
    
    if (message.type_comunication !== 'message') {
      dbOperation = this.supabase
        .from('Comunication')
        .delete()
        .eq('id_comunication', message.id_comunication);
    } else {
      const isSender = message.id_sender === user.id_user;
      const isReceiver = message.id_receiver === user.id_user;

      if (!isSender && !isReceiver) return of(undefined);
      const willBothBeDeleted =
        (isSender && message.deleted_by_receiver) ||
        (isReceiver && message.deleted_by_sender);

      if (willBothBeDeleted) {
        dbOperation = this.supabase
          .from('Comunication')
          .delete()
          .eq('id_comunication', message.id_comunication);
      } else {
        const updates = isSender
          ? { deleted_by_sender: true }
          : { deleted_by_receiver: true };

        dbOperation = this.supabase
          .from('Comunication')
          .update(updates)
          .eq('id_comunication', message.id_comunication);
      }
    }
    return from(dbOperation).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Recupera un único registro de comunicación por su identificador único.
   */
  getMensajeId(idMessage: string): Observable<ComunicationModel> {
    return from(
      this.supabase.from('Comunication').select('*').eq('id_comunication', idMessage).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as ComunicationModel;
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  /**
   * Crea e inserta un registro de notificación.
   */
  private sendNotification(idReceiver: string, topic: string, content: string): Observable<void> {
    const notification = {
      type_comunication: 'notification' as const,
      id_sender: null,
      id_receiver: idReceiver,
      topic: topic,
      content: content,
      read: false,
      deleted_by_sender: false,
      deleted_by_receiver: false,
    };

    return this.insertComunication(notification);
  }

  /**
   * Envía una notificación a todos los administradores activos.
   */
  notifyAdmins(topic: string, content: string): Observable<void> {
    return from(
      this.supabase
        .from('User_public')
        .select('id_user')
        .eq('rol', 'administrator')
        .eq('state', true),
    ).pipe(
      switchMap(({ data }) => {
        if (!data || data.length === 0) return of(void 0);

        interface AdminResponse {
          id_user: string;
        }

        const adminsData = data as unknown as AdminResponse[];
        const notifications = adminsData.map((admin) =>
          this.sendNotification(admin.id_user, topic, content),
        );

        return forkJoin(notifications).pipe(map(() => void 0));
      }),
      catchError((err) => {
        console.error('Error al notificar administradores', err);
        return of(void 0);
      }),
    );
  }

  /**
   * Envía una notificación a un usuario específico.
   */
  notifyUsers(idReceiverUser: string, topic: string, content: string): Observable<void> {
    return this.sendNotification(idReceiverUser, topic, content);
  }

  /**
   * Actualiza forzadamente los datos de mensajes y notificaciones.
   */
  refreshUsersData() {
    this.refreshMessages();
    this.refreshNotificacions();
  }
}
