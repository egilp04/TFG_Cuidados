import { Component, DestroyRef, inject, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, filter, catchError, map } from 'rxjs/operators';
import { ButtonComponent } from '../../components/button/button';
import { ContractService } from '../../services/contract.service';
import { Cancelmodal } from '../../components/cancelmodal/cancelmodal';
import { MessageService } from '../../services/message-service';
import { InfoContract } from '../../components/info-contract/info-contract';
import { Buttonback } from '../../components/buttonback/buttonback';

@Component({
  selector: 'app-contracts',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    CommonModule,
    ButtonComponent,
    Buttonback,
    TranslateModule,
  ],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css',
})
export class Contracts implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private contractService = inject(ContractService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);

  displayedColumns: string[] = ['ID', 'fecha', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  isMobile = window.innerWidth < 768;

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
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.cd.markForCheck();
        },
        error: (error) => console.error('Error en el flujo IRL de contratos:', error),
      });
  }

  cancelarContrato(id: string) {
    const dialogRef = this.dialog.open(Cancelmodal, {
      data: { modo: 'cancelarContrato' },
      width: '100%',
      maxWidth: this.isMobile ? '95vw' : '650px',
      panelClass: 'custom-modal-padding',
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() =>
          this.contractService.deleteContract(id).pipe(
            switchMap(() =>
              this.translate
                .get('MESSAGES.SUCCESS.CANCELCONTRACT')
                .pipe(map((msg) => ({ text: msg, type: 'exito' as const }))),
            ),
            catchError((err) => {
              console.error('Error al cancelar:', err);
              return this.translate
                .get('MESSAGES.ERROR.CANCELCONTRACT')
                .pipe(map((msg) => ({ text: msg, type: 'error' as const })));
            }),
          ),
        ),
      )
      .subscribe({
        next: (result) => {
          this.messageService.showMessage(result.text, result.type);
        },
      });
  }

  verDetalles(id: string) {
    const contratoYaMapeado = this.dataSource.data.find((c) => c.id_contrato === id);
    if (contratoYaMapeado) {
      this.dialog.open(InfoContract, {
        width: '100%',
        maxWidth: this.isMobile ? '95vw' : '500px',
        data: { contrato: contratoYaMapeado },
      });
    } else {
      this.contractService.getContractsById(id).subscribe((contrato) => {
        this.dialog.open(InfoContract, {
          width: '100%',
          maxWidth: '450px',
          data: { contrato: contrato },
        });
      });
    }
  }
}
