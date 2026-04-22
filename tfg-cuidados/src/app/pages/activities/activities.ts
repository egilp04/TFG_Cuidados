import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MessageService } from '../../services/message-service';
import { CommonModule } from '@angular/common';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ContractService } from '../../services/contract.service';
import { MatTableDataSource } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivitiesComponents } from '../../components/activities-components/activities-components';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, map, switchMap, filter } from 'rxjs';
import { ContractDetail } from '../../models/ContractModel';
import { ResponsiveSize } from '../../services/responsive-size';

/**
 * Página principal de actividades que gestiona la lista de contratos del usuario.
 * Integra un calendario y una tabla para ver y cancelar servicios contratados.
 */
@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, Buttonback, ActivitiesComponents, TranslateModule],
  templateUrl: './activities.html',
  styleUrl: './activities.css',
})
export default class Activities implements OnInit {
  public messageService = inject(MessageService);
  private contractService = inject(ContractService);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private responsive = inject(ResponsiveSize);

  public dataSource = new MatTableDataSource<ContractDetail>([]);

  ngOnInit(): void {
    this.subscribeToContracts();
  }

  /**
   * Se suscribe al flujo en tiempo real de contratos para alimentar las vistas de actividad.
   */
  private subscribeToContracts(): void {
    this.contractService
      .getContractsObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: ContractDetail[]) => {
          this.dataSource.data = data;
          this.cd.detectChanges();
        },
        error: (error: Error) => console.error('Error en flujo de contratos:', error),
      });
  }

  /**
   * Abre una modal de confirmación y cancela el servicio contratado.
   * @param id El identificador único del contrato a cancelar.
   */
  async cancelContract(id: string): Promise<void> {
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');

    this.dialog
      .open(Cancelmodal, {
        data: { mode: 'cancelContract' },
        width: '100%',
        maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
        maxHeight: '90vh',
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result: boolean) => result === true),
        switchMap(() => this.contractService.deleteContract(id)),
        switchMap(() =>
          this.translate
            .get('MESSAGES.SUCCESS.CANCEL_CONTRACT')
            .pipe(map((msg: string) => ({ text: msg, type: 'success' as const }))),
        ),
        catchError((err: Error) => {
          console.error('Error cancelando contrato:', err);
          return this.translate
            .get('MESSAGES.ERROR.CANCEL_CONTRACT')
            .pipe(map((msg: string) => ({ text: msg, type: 'error' as const })));
        }),
      )
      .subscribe((res) => {
        this.messageService.showMessage(res.text, res.type);
      });
  }
}
