import { Component, DestroyRef, inject, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ButtonComponent } from '../../components/button/button';
import { Dropdown } from '../../components/dropdown/dropdown';
import { AuthService } from '../../services/auth.service';
import { ComunicationService } from '../../services/comunication.service';
import { ComunicationModel } from '../../models/ComunicationModel';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { PaginacionEs } from '../../services/paginacion-es';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Buttonback } from '../../components/buttonback/buttonback';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from '../../services/message-service';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ResponsiveSize } from '../../services/responsive-size';

/**
 * Componente para gestionar la bandeja de entrada y salida de comunicaciones del usuario.
 * Permite leer, ordenar, filtrar, eliminar y redactar mensajes.
 */
@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    ButtonComponent,
    Dropdown,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    CommonModule,
    Buttonback,
    TranslateModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: PaginacionEs }],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export default class Messages implements OnInit {
  public authService = inject(AuthService);
  private comunicationService = inject(ComunicationService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  public messageService = inject(MessageService);
  private responsive = inject(ResponsiveSize);

  public displayedColumns: string[] = ['sender', 'receiver', 'topic', 'date', 'actions'];
  public dataSource = new MatTableDataSource<ComunicationModel>([]);
  public currentFilter: 'received' | 'sent' = 'received';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.subscribeToMessages();
  }

  /**
   * Actualiza el filtro de vista activo e inicia una actualización de datos.
   * @param type El tipo de vista deseado: 'received' (recibidos) o 'sent' (enviados).
   */
  applyFilter(type: 'received' | 'sent'): void {
    this.currentFilter = type;
    this.comunicationService.refreshUsersData();
  }

  /**
   * Se suscribe al flujo en tiempo real de mensajes y filtra según el modo de vista actual.
   */
  private subscribeToMessages(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.comunicationService
      .getMessagesObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((messages: ComunicationModel[]) => {
          if (this.currentFilter === 'received') {
            return messages.filter((m) => m.id_receiver === user.id_user);
          } else {
            return messages.filter((m) => m.id_sender === user.id_user);
          }
        }),
      )
      .subscribe({
        next: (data: ComunicationModel[]) => {
          this.dataSource.data = data;
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.cd.markForCheck();
        },
        error: (err: Error) => console.error('Error en flujo de mensajes:', err),
      });
  }

  /**
   * Ordena los mensajes cargados actualmente según criterios predefinidos.
   * @param criteria La clave de traducción que representa la opción de ordenamiento.
   */
  sortMessages(criteria: string): void {
    const data = [...this.dataSource.data];

    switch (criteria) {
      case 'MESSAGES_PAGE.SORT_OPTIONS.DATE':
        data.sort((a, b) => new Date(b.send_date).getTime() - new Date(a.send_date).getTime());
        break;
      case 'MESSAGES_PAGE.SORT_OPTIONS.topic_AZ':
        data.sort((a, b) => (a.topic || '').localeCompare(b.topic || ''));
        break;
      case 'MESSAGES_PAGE.SORT_OPTIONS.topic_ZA':
        data.sort((a, b) => (b.topic || '').localeCompare(a.topic || ''));
        break;
    }

    this.dataSource.data = data;
  }

  /**
   * Abre el mensaje en una modal para lectura.
   * Marca automáticamente el mensaje como leído en la base de datos si el usuario actual es el destinatario.
   * @param message El registro de comunicación a mostrar.
   */
  async readMessage(message: ComunicationModel): Promise<void> {
    const { MessagesModal } = await import('../../components/messages-modal/messages-modal');

    this.dialog.open(MessagesModal, {
      data: { mode: 'readMessage', content: message },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
    });

    const user = this.authService.currentUser();

    if (user && message.id_receiver === user.id_user && !message.read) {
      message.read = true;

      this.comunicationService
        .updateComunication(message.id_comunication!, { read: true })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError((err: Error) => {
            message.read = false;
            console.error('Error marcando mensaje como leído en segundo plano:', err);
            return of(null);
          }),
        )
        .subscribe();
    }
  }

  /**
   * Solicita la eliminación de un mensaje específico.
   * @param message El registro de comunicación a eliminar.
   */
  deleteCommunication(message: ComunicationModel): void {
    this.comunicationService
      .deleteComunication(message)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          this.translate
            .get('MESSAGES_PAGE.ALERTS.DELETE_SUCCESS')
            .pipe(map((text: string) => ({ type: 'success' as const, text }))),
        ),
        catchError((err: Error) => {
          console.error('Error eliminando comunicación:', err);
          return this.translate
            .get('MESSAGES_PAGE.ALERTS.DELETE_ERROR')
            .pipe(map((text: string) => ({ type: 'error' as const, text })));
        }),
      )
      .subscribe((res) => {
        this.messageService.showMessage(res.text, res.type);
      });
  }

  /**
   * Abre la modal configurada para redactar y enviar un nuevo mensaje.
   */
  async writeMessage(): Promise<void> {
    const { MessagesModal } = await import('../../components/messages-modal/messages-modal');

    this.dialog.open(MessagesModal, {
      data: { mode: 'writeMessage' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
      maxHeight: '90vh',
    });
  }
}
