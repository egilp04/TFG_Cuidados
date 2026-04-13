import { Component, DestroyRef, inject, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ButtonComponent } from '../../components/button/button';
import { Dropdown } from '../../components/dropdown/dropdown';
import { AuthService } from '../../services/auth.service';
import { ComunicationService } from '../../services/comunication.service';
import { ComunicacionModel } from '../../models/Comunicacion';
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
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ResponsiveSize } from '../../services/responsive-size';

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

  displayedColumns: string[] = ['Emisor', 'Receptor', 'Asunto', 'Fecha', 'acciones'];
  dataSource = new MatTableDataSource<ComunicacionModel>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  public filtroActual: 'recibidos' | 'enviados' = 'recibidos';

  ngOnInit() {
    this.subcribeToMessages();
  }

  toFilterFunction(tipo: 'recibidos' | 'enviados') {
    this.filtroActual = tipo;
    this.comunicationService.refreshUsersData();
  }

  private subcribeToMessages() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.comunicationService
      .getMessagesObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((mensajes) => {
          if (this.filtroActual === 'recibidos') {
            return mensajes.filter((m) => m.id_receptor === user.id_usuario);
          } else {
            return mensajes.filter((m) => m.id_emisor === user.id_usuario);
          }
        }),
      )
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.cd.markForCheck();
        },
        error: (err) => console.error('Error en el flujo de mensajes:', err),
      });
  }

  sortFunction(criterio: string) {
    const data = [...this.dataSource.data];
    switch (criterio) {
      case 'MESSAGES_PAGE.SORT_OPTIONS.DATE':
        data.sort((a, b) => new Date(b.fecha_envio).getTime() - new Date(a.fecha_envio).getTime());
        break;
      case 'MESSAGES_PAGE.SORT_OPTIONS.SUBJECT_AZ':
        data.sort((a, b) => (a.asunto || '').localeCompare(b.asunto || ''));
        break;
      case 'MESSAGES_PAGE.SORT_OPTIONS.SUBJECT_ZA':
        data.sort((a, b) => (b.asunto || '').localeCompare(a.asunto || ''));
        break;
    }
    this.dataSource.data = data;
  }

  async checkMessage(mensaje: ComunicacionModel) {
    const { MessagesModal } = await import('../../components/messages-modal/messages-modal');
    this.dialog.open(MessagesModal, {
      data: { modo: 'showMessage', contenido: mensaje },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      panelClass: 'custom-modal-padding',
    });
    const user = this.authService.currentUser();
    if (user && mensaje.id_receptor === user.id_usuario && !mensaje.leido) {
      mensaje.leido = true;
      this.comunicationService
        .updateComunicacion(mensaje.id_comunicacion!, { leido: true })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError((err) => {
            mensaje.leido = false;
            console.error('Error al marcar mensaje como leído en segundo plano:', err);
            return of(null);
          }),
        )
        .subscribe();
    }
  }

  deleteCommunication(mensaje: ComunicacionModel) {
    this.comunicationService
      .deleteComunicacion(mensaje)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          this.translate
            .get('MESSAGES_PAGE.ALERTS.DELETE_SUCCESS')
            .pipe(map((text) => ({ type: 'exito' as const, text }))),
        ),
        catchError((err) => {
          console.error('Error al borrar:', err);
          return this.translate
            .get('MESSAGES_PAGE.ALERTS.DELETE_ERROR')
            .pipe(map((text) => ({ type: 'error' as const, text })));
        }),
      )
      .subscribe((resultado) => {
        this.messageService.showMessage(resultado.text, resultado.type);
      });
  }

  private responsive = inject(ResponsiveSize);

  async writeMessage() {
    const { MessagesModal } = await import('../../components/messages-modal/messages-modal');
    this.dialog.open(MessagesModal, {
      data: { modo: 'escribir' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
      panelClass: 'custom-modal-padding',
    });
  }
}
