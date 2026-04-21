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
  private responsive = inject(ResponsiveSize);

  displayedColumns: string[] = ['Emisor', 'Receptor', 'Asunto', 'Fecha', 'acciones'];
  dataSource = new MatTableDataSource<ComunicationModel>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  public currentFilter: 'recibidos' | 'enviados' = 'recibidos';

  ngOnInit() {
    this.subcribeToMessages();
  }

  toFilterFunction(tipo: 'recibidos' | 'enviados') {
    this.currentFilter = tipo;
    this.comunicationService.refreshUsersData();
  }

  private subcribeToMessages() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.comunicationService
      .getMessagesObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((mssg) => {
          if (this.currentFilter === 'recibidos') {
            return mssg.filter((m) => m.id_receptor === user.id_usuario);
          } else {
            return mssg.filter((m) => m.id_emisor === user.id_usuario);
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

  sortFunction(criteria: string) {
    const data = [...this.dataSource.data];
    switch (criteria) {
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

  async checkMessage(mssg: ComunicationModel) {
    const { MessagesModal } = await import('../../components/messages-modal/messages-modal');
    this.dialog.open(MessagesModal, {
      data: { mode: 'showMessage', contenido: mssg },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
    });
    const user = this.authService.currentUser();
    if (user && mssg.id_receptor === user.id_usuario && !mssg.leido) {
      mssg.leido = true;
      this.comunicationService
        .updateComunication(mssg.id_comunicacion!, { leido: true })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError((err) => {
            mssg.leido = false;
            console.error('Error al marcar mensaje como leído en segundo plano:', err);
            return of(null);
          }),
        )
        .subscribe();
    }
  }

  deleteCommunication(mssg: ComunicationModel) {
    this.comunicationService
      .deleteComunicacion(mssg)
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
      .subscribe((res) => {
        this.messageService.showMessage(res.text, res.type);
      });
  }

  async writeMessage() {
    const { MessagesModal } = await import('../../components/messages-modal/messages-modal');
    this.dialog.open(MessagesModal, {
      data: { mode: 'escribir' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
      maxHeight: '90vh',
    });
  }
}
