import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, filter, map, catchError, finalize, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../components/button/button';
import { Buttonback } from '../../components/buttonback/buttonback';
import { MessageService } from '../../services/message-service';
import { ServiceTimeService } from '../../services/service-time.service';
import { ServiceTimeJoined } from '../../models/Service_Time_Service_Model';
import { ResponsiveSize } from '../../services/responsive-size';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

/**
 * Componente para gestionar las ofertas de servicios y horarios de un negocio.
 */
@Component({
  selector: 'app-management-servicetime',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatDialogModule,
    ButtonComponent,
    Buttonback,
    TranslateModule,
    MatPaginatorModule,
  ],
  templateUrl: './servicesbusiness.html',
  styleUrl: './servicesbusiness.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Servicesbusiness implements OnInit {
  private serviceTimeService = inject(ServiceTimeService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private responsive = inject(ResponsiveSize);

  public isLoading = signal(false);
  private deletingIds = new Set<string>();

  dataSource = new MatTableDataSource<ServiceTimeJoined>([]);
  displayedColumns: string[] = ['name', 'price', 'type', 'time', 'day', 'description', 'actions'];

  public paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      const currentPaginator = this.paginator();
      if (currentPaginator) {
        this.dataSource.paginator = currentPaginator;
      }
    });
  }

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    const businessId = this.authService.currentUser()?.id_user;
    if (businessId) {
      this.serviceTimeService
        .getServiceTimeByBusiness(businessId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((data: ServiceTimeJoined[]) => {
          this.dataSource.data = data;
          const paginatorInner = this.dataSource.paginator;
          if (paginatorInner) {
            const totalPaginas = Math.ceil(data.length / paginatorInner.pageSize);
            if (paginatorInner.pageIndex >= totalPaginas && data.length > 0) {
              paginatorInner.firstPage();
            }
          }
          this.cd.markForCheck();
        });
    }
  }

  async openModal(element?: ServiceTimeJoined) {
    if (element && this.deletingIds.has(element.id_service_time)) return;

    const { ServiceTimeModal } =
      await import('../../components/service-time-modal/service-time-modal');
    const dialogRef = this.dialog.open(ServiceTimeModal, {
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
      data: element || null,
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
      )
      .subscribe(() => {
        this.loadServices();
      });
  }

  async onDelete(id: string) {
    if (this.isLoading() || this.deletingIds.has(id)) return;

    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    const dialogRef = this.dialog.open(Cancelmodal, {
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '700px',
      maxHeight: '90vh',
      data: { mode: 'deleteService' },
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() => {
          this.deletingIds.add(id);
          this.cd.markForCheck();

          return this.serviceTimeService.deleteServiceTime(id).pipe(
            switchMap(() =>
              this.translate
                .get('SERVICES_BUSINESS.MESSAGES.DELETE_SUCCESS')
                .pipe(map((text) => ({ type: 'success' as const, text }))),
            ),
            catchError((err) => {
              console.error('Error eliminando tiempo de servicio:', err);
              return this.translate
                .get('SERVICES_BUSINESS.MESSAGES.DELETE_ERROR')
                .pipe(map((text) => ({ type: 'error' as const, text })));
            }),
          );
        }),
      )
      .subscribe((resultado) => {
        this.messageService.showMessage(resultado.text, resultado.type);
        if (resultado.type === 'success') {
          this.loadServices();
        }
        this.deletingIds.delete(id);
        this.cd.markForCheck();
      });
  }

  isDeleting(id: string): boolean {
    return this.deletingIds.has(id);
  }
}
