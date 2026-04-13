import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { MessageService } from '../../services/message-service';
import { CommonModule } from '@angular/common';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ContractService } from '../../services/contract.service';
import { MatTableDataSource } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivitiesComponents } from '../../components/activities-components/activities-components';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, map, switchMap } from 'rxjs';
import { ContratoDetalle } from '../../models/Contrato';
import { filter } from 'rxjs';
import { ResponsiveSize } from '../../services/responsive-size';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, Buttonback, ActivitiesComponents, TranslateModule],
  templateUrl: './activities.html',
  styleUrl: './activities.css',
})
export default class Activities {
  public messageService = inject(MessageService);
  private contractService = inject(ContractService);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  public dataSource = new MatTableDataSource<ContratoDetalle>([]);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  ngOnInit() {
    this.subcribeContracts();
  }

  private subcribeContracts() {
    this.contractService
      .getContractsObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data;
          this.cd.detectChanges();
        },
        error: (error) => console.error('Error en el flujo IRL de contratos:', error),
      });
  }

  private responsive = inject(ResponsiveSize);

  async cancelContract(id: string) {
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    this.dialog
      .open(Cancelmodal, {
        data: { modo: 'cancelContract' },
        width: '100%',
        maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
        maxHeight: '90vh'
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() => this.contractService.deleteContract(id)),
        switchMap(() =>
          this.translate
            .get('MESSAGES.SUCCESS.CANCELCONTRACT')
            .pipe(map((msg) => ({ texto: msg, tipo: 'exito' as const }))),
        ),
        catchError((err) => {
          console.error('Error al cancelar el contrato:', err);
          return this.translate
            .get('MESSAGES.ERROR.CANCELCONTRACT')
            .pipe(map((msg) => ({ texto: msg, tipo: 'error' as const })));
        }),
      )
      .subscribe((resultado) => {
        this.messageService.showMessage(resultado.texto, resultado.tipo);
      });
  }
}
