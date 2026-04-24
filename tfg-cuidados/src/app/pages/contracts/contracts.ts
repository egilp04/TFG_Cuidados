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
import { MessageService } from '../../services/message-service';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ContractDetail } from '../../models/ContractModel';
import { ResponsiveSize } from '../../services/responsive-size';

/**
 * Componente para listar y gestionar contratos de usuario.
 * Permite ver detalles y solicitar cancelaciones a través de un flujo seguro.
 */
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
export default class Contracts implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private contractService = inject(ContractService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private responsive = inject(ResponsiveSize);

  public displayedColumns: string[] = ['id', 'date', 'actions'];
  public dataSource = new MatTableDataSource<ContractDetail>([]);

  isLoading = true

  ngOnInit(): void {
    this.subscribeToContracts();
  }

  /**
   * Se suscribe al flujo en tiempo real de contratos e inicializa los datos de la tabla.
   */
  private subscribeToContracts(): void {
    this.isLoading = true;

    this.contractService
      .getContractsObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: ContractDetail[]) => {
          this.dataSource.data = data;
          this.isLoading = false;

          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.cd.markForCheck();
        },
       error: (error: Error) => {
          console.error('Error en flujo en tiempo real de contratos:', error);
          this.isLoading = false; 
          this.cd.markForCheck();
        }
      });
  }

  /**
   * Abre una modal de confirmación e inicia el proceso de cancelación del contrato.
   * @param id El identificador único del contrato.
   */
  async cancelContract(id: string): Promise<void> {
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');

    const dialogRef = this.dialog.open(Cancelmodal, {
      data: { mode: 'cancelContract' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result: boolean) => result === true),
        switchMap(() =>
          this.contractService.deleteContract(id).pipe(
            switchMap(() =>
              this.translate
                .get('MESSAGES.SUCCESS.CANCELCONTRACT')
                .pipe(map((msg: string) => ({ text: msg, type: 'success' as const }))),
            ),
            catchError((err: Error) => {
              console.error('Error en cancelación:', err);
              return this.translate
                .get('MESSAGES.ERROR.CANCELCONTRACT')
                .pipe(map((msg: string) => ({ text: msg, type: 'error' as const })));
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

  /**
   * Abre una modal de información mostrando los detalles completos de un contrato.
   * Utiliza datos en caché si están disponibles, de lo contrario obtiene del servidor.
   * @param id El identificador único del contrato.
   */
  async showDetails(id: string): Promise<void> {
    const { InfoContract } = await import('../../components/info-contract/info-contract');

    const dialogConfig = {
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
    };
    const cachedContract = this.dataSource.data.find((c) => c.id_contract === id);
    if (cachedContract) {
      this.dialog.open(InfoContract, { ...dialogConfig, data: { contract: cachedContract } });
      return;
    }
    this.contractService
      .getContractsById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((raw: any): ContractDetail => {
          return {
            ...raw,
            id_contract: raw.id_contract,
            serviceName: raw.Service_Time?.Service?.name || 'Sin servicio',
            Client: {
              address: raw.Client?.address,
              city: raw.Client?.city,
              postcode: raw.Client?.postcode,
              clientName:
                raw.Client?.User_public?.name || raw.Client?.name || 'Cliente desconocido',
            },
            Business: {
              businessName:
                raw.Business?.User_public?.name || raw.Business?.name || 'Negocio desconocido',
            },
          };
        }),
      )
      .subscribe({
        next: (mappedContract) => {
          this.dialog.open(InfoContract, {
            ...dialogConfig,
            data: { contract: mappedContract },
          });
        },
        error: (err) => {
          console.error('Error obteniendo detalles del contrato:', err);
          this.messageService.showMessage(
            'No se pudieron cargar los detalles del contrato',
            'error',
          );
        },
      });
  }
}
