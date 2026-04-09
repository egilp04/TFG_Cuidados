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
import { ServicioHorarioJoined } from '../../models/Service-Time-Service';

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
  dataSource = new MatTableDataSource<ServicioHorarioJoined>([]);
  displayedColumns: string[] = ['nombre', 'precio', 'tipo', 'hora', 'dia', 'acciones'];

  ngOnInit() {
    this.chargeServices();
  }

  chargeServices() {
    const empresaId = this.authService.currentUser()?.id_usuario;
    if (empresaId) {
      this.serviceTimeService
        .getServiceTimeByEmpresa(empresaId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((data: ServicioHorarioJoined[]) => {
          this.dataSource.data = data;
          this.cd.markForCheck();
        });
    }
  }

  isMobile = window.innerWidth < 768;
  
  async openModal(element?: ServicioHorarioJoined) {
    const { ServiceTimeModal } = await import('../../components/service-time-modal/service-time-modal');
    const dialogRef = this.dialog.open(ServiceTimeModal, {
      width: '100%',
      maxWidth: this.isMobile ? '95vw' : '600px',
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
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    const dialogRef = this.dialog.open(Cancelmodal, {
      width: '100%',
      maxWidth: this.isMobile ? '95vw' : '600px',
      data: { modo: 'eliminarServicio' },
    });
    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() => this.serviceTimeService.deleteServiceTime(id)),
        switchMap(() =>
          this.translate
            .get('SERVICES_BUSINESS.MESSAGES.DELETE_SUCCESS')
            .pipe(map((text) => ({ type: 'exito' as const, text }))),
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
        if (resultado.type === 'exito') {
          this.chargeServices();
        }
        this.cd.markForCheck();
      });
  }
}
