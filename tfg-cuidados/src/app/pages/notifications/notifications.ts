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
import { ComunicationModel } from '../../models/Comunicacion';
import { ButtonComponent } from '../../components/button/button';
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
export default class Notifications implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private comunicationService = inject(ComunicationService);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  dataSource = new MatTableDataSource<ComunicationModel>([]);
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
      .subscribe((data: ComunicationModel[]) => {
        this.dataSource.data = data;
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        const noLeidas = data.filter((n) => !n.leido);
        if (noLeidas.length > 0) {
          this.markAsRead(noLeidas);
        }
        this.cd.markForCheck();
      });
  }

  markAsRead(notis: ComunicationModel | ComunicationModel[]) {
    const lista = Array.isArray(notis) ? notis : [notis];

    lista.forEach((noti) => {
      if (noti.leido || !noti.id_comunicacion) return;
      noti.leido = true;
      this.comunicationService
        .updateComunication(noti.id_comunicacion, { leido: true })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: (err) => {
            console.error('Error al marcar notificación:', err);
            noti.leido = false;
            this.cd.markForCheck();
          },
        });
    });
    this.comunicationService.refreshUsersData();
    this.cd.markForCheck();
  }

  deleteCommunication(mensaje: ComunicationModel) {
    this.comunicationService
      .deleteComunicacion(mensaje)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          this.translate
            .get('NOTIFICATIONS.ALERTS.DELETE_SUCCESS')
            .pipe(map((text) => ({ type: 'exito' as const, text }))),
        ),
        catchError((err) => {
          console.error('Error al borrar:', err);
          return this.translate
            .get('NOTIFICATIONS.ALERTS.DELETE_ERROR')
            .pipe(map((text) => ({ type: 'error' as const, text })));
        }),
      )
      .subscribe((resultado) => {
        this.messageService.showMessage(resultado.text, resultado.type);
      });
  }
}
