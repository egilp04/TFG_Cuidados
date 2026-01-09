import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { MessageService } from '../../services/message-service';
import { CommonModule } from '@angular/common';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ContractService } from '../../services/contract.service';
import { MatTableDataSource } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivitiesComponents } from '../../components/activities-components/activities-components';
import { MatDialog } from '@angular/material/dialog';
import { Cancelmodal } from '../../components/cancelmodal/cancelmodal';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, Buttonback, ActivitiesComponents, TranslateModule],
  templateUrl: './activities.html',
  styleUrl: './activities.css',
})
export class Activities {
  public messageService = inject(MessageService);
  private contractService = inject(ContractService);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  public dataSource = new MatTableDataSource<any>([]);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  ngOnInit() {
    this.suscribirAContratos();
  }

  private suscribirAContratos() {
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

  cancelarContrato(id: string) {
    const dialogRef = this.dialog.open(Cancelmodal, {
      data: { modo: 'cancelarContrato' },
      width: '100%',
      maxWidth: '450px',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.contractService
            .deleteContract(id)
            .pipe(
              switchMap(() =>
                this.translate
                  .get('MESSAGES.SUCCESS.CANCELCONTRACT')
                  .pipe(map((msg) => ({ texto: msg, tipo: 'exito' as const })))
              ),
              catchError(() =>
                this.translate
                  .get('MESSAGES.ERROR.CANCELCONTRACT')
                  .pipe(map((msg) => ({ texto: msg, tipo: 'error' as const })))
              )
            )
            .subscribe({
              next: (resultado) => {
                this.messageService.showMessage(resultado.texto, resultado.tipo);
              },
            });
        }
      });
  }
}
