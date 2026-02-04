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
import { MessagesModal } from '../../components/messages-modal/messages-modal';
import { Buttonback } from '../../components/buttonback/buttonback';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService } from '../../services/message-service';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

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
export class Messages implements OnInit {
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

  ngOnInit() {
    this.suscribirAMensajes();
  }

  private suscribirAMensajes() {
    this.comunicationService
      .getMessagesObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.cd.markForCheck();
        },
        error: (err) => console.error('Error en el flujo IRL de mensajes:', err),
      });
  }
  ordenar(criterio: string) {
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

  verMensaje(mensaje: ComunicacionModel) {
    const user = this.authService.currentUser();
    this.dialog.open(MessagesModal, {
      data: {
        modo: 'verMensaje',
        contenido: mensaje,
      },
      width: '600px',
    });
    if (user && mensaje.id_receptor === user.id_usuario && !mensaje.leido) {
      this.comunicationService
        .updateComunicacion(mensaje.id_comunicacion!, { leido: true })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: (err) => console.error('Error al marcar como leído', err),
        });
    }
  }

  borrarMensaje(mensaje: ComunicacionModel) {
    const confirmMsg = this.translate.instant('MESSAGES_PAGE.ALERTS.CONFIRM_DELETE');

    if (confirm(confirmMsg)) {
      this.comunicationService
        .deleteComunicacion(mensaje)
        .pipe(
          tap(() => {
            this.dataSource.data = this.dataSource.data.filter(
              (m) => m.id_comunicacion !== mensaje.id_comunicacion
            );
          }),
          switchMap(() =>
            this.translate
              .get('MESSAGES_PAGE.ALERTS.DELETE_SUCCESS')
              .pipe(map((text) => ({ type: 'exito' as const, text })))
          ),
          catchError((err) => {
            console.error('Error al borrar:', err);
            return this.translate
              .get('MESSAGES_PAGE.ALERTS.DELETE_ERROR')
              .pipe(map((text) => ({ type: 'error' as const, text })));
          })
        )
        .subscribe((resultado) => {
          this.messageService.showMessage(resultado.text, resultado.type);
          this.cd.markForCheck();
        });
    }
  }

  escribirMensaje() {
    this.dialog.open(MessagesModal, {
      data: { modo: 'escribir' },
    });
  }
}
