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
import { ComunicationModel } from '../../models/ComunicationModel';
import { ButtonComponent } from '../../components/button/button';

/**
 * Component responsible for displaying and managing user notifications.
 * Handles table pagination, marking incoming messages as read, and deleting notifications.
 */
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
  displayedColumns: string[] = ['name', 'message', 'date', 'actions'];

  ngOnInit(): void {
    this.subscribeToNotifications();
  }

  /**
   * Subscribes to the real-time notifications observable and populates the data table.
   * Automatically marks any unread notifications as read upon viewing.
   */
  private subscribeToNotifications(): void {
    this.comunicationService
      .getNotificationsObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err: Error) => {
          console.error('Error loading real-time notifications:', err);
          return this.translate.get('NOTIFICATIONS.MESSAGES.CONNECTION_ERROR').pipe(
            tap((res: string) => this.messageService.showMessage(res, 'error')),
            map(() => []),
          );
        }),
      )
      .subscribe((data: ComunicationModel[]) => {
        this.dataSource.data = data;
        
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }

        const unreadNotifications = data.filter((n) => !n.read);
        if (unreadNotifications.length > 0) {
          this.markAsRead(unreadNotifications);
        }
        
        this.cd.markForCheck();
      });
  }

  /**
   * Updates the database to mark a single or multiple notifications as read.
   * @param notifications A single notification model or an array of them.
   */
  markAsRead(notifications: ComunicationModel | ComunicationModel[]): void {
    const notificationList = Array.isArray(notifications) ? notifications : [notifications];

    notificationList.forEach((notification) => {
      if (notification.read || !notification.id_comunication) return;

      notification.read = true;
      this.comunicationService
        .updateComunication(notification.id_comunication, { read: true })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: (err: Error) => {
            console.error('Error marking notification as read:', err);
            notification.read = false;
            this.cd.markForCheck();
          },
        });
    });

    this.comunicationService.refreshUsersData();
    this.cd.markForCheck();
  }

  /**
   * Requests the deletion of a specific communication message.
   * @param message The communication record to delete.
   */
  deleteCommunication(message: ComunicationModel): void {
    this.comunicationService
      .deleteComunication(message)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() =>
          this.translate
            .get('NOTIFICATIONS.ALERTS.DELETE_SUCCESS')
            .pipe(map((text: string) => ({ type: 'success' as const, text }))),
        ),
        catchError((err: Error) => {
          console.error('Error deleting communication:', err);
          return this.translate
            .get('NOTIFICATIONS.ALERTS.DELETE_ERROR')
            .pipe(map((text: string) => ({ type: 'error' as const, text })));
        }),
      )
      .subscribe((result) => {
        this.messageService.showMessage(result.text, result.type);
      });
  }
}