import {
  Component,
  DestroyRef,
  inject,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
  viewChild,
  effect,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, filter, catchError, map, delay, tap } from 'rxjs/operators';
import { ButtonComponent } from '../../components/button/button';
import { ContractService } from '../../services/contract.service';
import { MessageService } from '../../services/message-service';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ContractDetail } from '../../models/ContractModel';
import { ResponsiveSize } from '../../services/responsive-size';
import { TableSkeletonComponent } from '../../components/table-skeleton/table-skeleton.component';
import { DocsPdf } from '../../services/docs-pdf';
import { FormControl } from '@angular/forms';
import { Searchbar } from '../../components/searchbar/searchbar';

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
    CommonModule,
    ButtonComponent,
    Buttonback,
    TranslateModule,
    TableSkeletonComponent,
    Searchbar,
  ],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css',
})
export default class Contracts implements OnInit {
  private contractService = inject(ContractService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private responsive = inject(ResponsiveSize);
  public controlFilterItem = new FormControl<string>('');

  public displayedColumns: string[] = ['id', 'date', 'actions'];
  public dataSource = new MatTableDataSource<ContractDetail>([]);

  public paginator = viewChild(MatPaginator);

  private deletingIds = new Set<string>();

  constructor() {
    effect(() => {
      const currentPaginator = this.paginator();
      if (currentPaginator) {
        this.dataSource.paginator = currentPaginator;
      }
    });
  }

  isLoading = true;

  ngOnInit(): void {
    this.subscribeToContracts();
    this.setupCustomFilter();
  }

  /**
   * Se suscribe al flujo en tiempo real de contratos e inicializa los datos de la tabla.
   */
  private subscribeToContracts(): void {
    this.isLoading = true;

    this.contractService
      .getContractsObservable()
      .pipe(takeUntilDestroyed(this.destroyRef), delay(500))
      .subscribe({
        next: (data: ContractDetail[]) => {
          this.dataSource.data = data;
          this.isLoading = false;
          const paginatorInner = this.dataSource.paginator;
          if (paginatorInner) {
            const totalPaginas = Math.ceil(data.length / paginatorInner.pageSize);
            if (paginatorInner.pageIndex >= totalPaginas && data.length > 0) {
              paginatorInner.firstPage();
            }
          }
          this.cd.markForCheck();
        },
        error: (error: Error) => {
          console.error('Error en flujo en tiempo real de contratos:', error);
          this.isLoading = false;
          this.cd.markForCheck();
        },
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
        tap(() => this.deletingIds.add(id)),
        switchMap(() =>
          this.contractService.deleteContract(id).pipe(
            switchMap(() =>
              this.translate
                .get('MESSAGES.SUCCESS.CANCELCONTRACT')
                .pipe(map((msg: string) => ({ text: msg, type: 'success' as const }))),
            ),
            catchError((err: Error) => {
              console.error('Error en cancelación:', err);
              this.deletingIds.delete(id);
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
          if (result.type === 'success') {
            this.dialog.closeAll();
            this.dataSource.data = this.dataSource.data.filter(
              (contract) => contract.id_contract !== id,
            );

            this.deletingIds.delete(id);
            this.cd.detectChanges();
          }
        },
      });
  }
  /**
   * Abre una modal de información mostrando los detalles completos de un contrato.
   * Utiliza datos en caché si están disponibles, de lo contrario obtiene del servidor.
   * @param id El identificador único del contrato.
   */
  async showDetails(id: string): Promise<void> {
    if (this.deletingIds.has(id)) {
      return;
    }
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
            serviceDescription: raw.Service_Time?.description || 'Sin descripción',
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
  private pdfService = inject(DocsPdf);
  downloadContractPDF(contract: ContractDetail): void {
    if (this.deletingIds.has(contract.id_contract)) {
      return;
    }
    this.pdfService.downloadPDF(contract);
  }

  private setupCustomFilter(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      let formattedDate = '';
      if (data.creation_date) {
        const d = new Date(data.creation_date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        formattedDate = `${day}/${month}/${year}`;
      }
      const dataStr = ((data.id_contract || '') + formattedDate).toLowerCase();
      return dataStr.includes(filter);
    };
  }

  applyFilter(value: string): void {
    const cleanFilter = value
      .trim()
      .toLowerCase()
      .replace(/\s*\/\s*/g, '/');
    this.dataSource.filter = cleanFilter;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
