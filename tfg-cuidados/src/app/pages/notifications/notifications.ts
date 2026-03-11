import { Component, inject, ViewChild, OnInit, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { ComunicationService } from '../../services/comunication.service';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { PaginacionEs } from '../../services/paginacion-es';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessageService } from '../../services/message-service';
import { Buttonback } from '../../components/buttonback/buttonback';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { ButtonComponent } from '../../components/button/button';
import { ComunicacionModel } from '../../models/Comunicacion';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    Buttonback,
    TranslateModule,
    ButtonComponent,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: PaginacionEs }],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private comunicationService = inject(ComunicationService);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['nombre', 'notificacion', 'fecha', 'acciones'];

  ngOnInit() {
    this.suscribirANotificaciones();
  }

  private suscribirANotificaciones() {
    this.comunicationService
      .getNotificationsObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error('Error IRL:', err);
          return this.translate.get('NOTIFICATIONS.MESSAGES.CONNECTION_ERROR').pipe(
            tap((res) => this.messageService.showMessage(res, 'error')),
            map(() => []),
          );
        }),
      )
      .subscribe((data) => {
        this.dataSource.data = data;

        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        this.cd.markForCheck();
      });
  }

  marcarComoLeida(noti: any) {
    if (!noti.leido) {
      noti.leido = true;
      this.comunicationService.updateComunicacion(noti.id_comunicacion, { leido: true }).subscribe({
        error: (err) => console.error('Error al marcar notificación:', err),
      });
    }
  }

  borrarNotificacion(noti: ComunicacionModel) {
    const confirmMsg = this.translate.instant('MESSAGES_PAGE.ALERTS.CONFIRM_DELETE');
    if (confirm(confirmMsg)) {
      this.comunicationService
        .deleteComunicacion(noti)
        .pipe(
          switchMap(() =>
            this.translate
              .get('MESSAGES_PAGE.ALERTS.DELETE_SUCCESS')
              .pipe(map((text) => ({ type: 'exito' as const, text }))),
          ),
          catchError((err) => {
            console.error('Error al borrar:', err);
            return this.translate
              .get('MESSAGES_PAGE.ALERTS.DELETE_ERROR')
              .pipe(map((text) => ({ type: 'error' as const, text, error: true })));
          }),
        )
        .subscribe((resultado) => {
          this.messageService.showMessage(resultado.text, resultado.type);
          if (!('error' in resultado)) {
            this.dataSource.data = this.dataSource.data.filter(
              (n) => n.id_comunicacion !== noti.id_comunicacion,
            );
          }
          this.cd.markForCheck();
        });
    }
  }
}
