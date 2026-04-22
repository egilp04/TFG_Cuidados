import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, filter, map, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../components/button/button';
import { Buttonback } from '../../components/buttonback/buttonback';
import { MessageService } from '../../services/message-service';
import { ServiceTimeService } from '../../services/service-time.service';
import { ServicetimeJoined } from '../../models/Service_Time_Service_Model';
import { ResponsiveSize } from '../../services/responsive-size';
import { signal } from '@angular/core';
import { finalize, tap } from 'rxjs';

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
  public isLoading = signal(false);
  private responsive = inject(ResponsiveSize);

  dataSource = new MatTableDataSource<ServicetimeJoined>([]);
  displayedColumns: string[] = [
    'nombre',
    'precio',
    'tipo',
    'hora',
    'dia',
    'descripcion',
    'acciones',
  ];

  ngOnInit() {
    this.chargeServices();
  }

  chargeServices() {
    const businessId = this.authService.currentUser()?.id_usuario;
    if (businessId) {
      this.serviceTimeService
        .getServiceTimeByBusiness(businessId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((data: ServicetimeJoined[]) => {
          this.dataSource.data = data;
          this.cd.markForCheck();
        });
    }
  }

  async openModal(element?: ServicetimeJoined) {
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
        this.chargeServices();
      });
  }

  async onDelete(id: string) {
    if (this.isLoading()) return;

    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    const dialogRef = this.dialog.open(Cancelmodal, {
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
      data: { mode: 'eliminarServicio' },
    });
    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        tap(() => {
          this.isLoading.set(true);
          this.cd.markForCheck();
        }),
        switchMap(() =>
          this.serviceTimeService.deleteServiceTime(id).pipe(
            finalize(() => {
              this.isLoading.set(false);
              this.cd.markForCheck();
            }),
          ),
        ),
        switchMap(() =>
          this.translate
            .get('SERVICES_BUSINESS.MESSAGES.DELETE_SUCCESS')
            .pipe(map((text) => ({ type: 'sucess' as const, text }))),
        ),
        catchError((err) => {
          console.error('Error al cancelar:', err);
          return this.translate
            .get('SERVICES_BUSINESS.MESSAGES.DELETE_ERROR')
            .pipe(map((text) => ({ type: 'error' as const, text })));
        }),
      )
      .subscribe((resultado) => {
        this.messageService.showMessage(resultado.text, resultado.type);
        if (resultado.type === 'sucess') {
          this.chargeServices();
        }
        this.cd.markForCheck();
      });
  }
}
