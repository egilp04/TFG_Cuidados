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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ContractService } from '../../services/contract.service';
import { DocsPdf } from '../../services/docs-pdf';
import { ContractDetail } from '../../models/ContractModel';
import { exportContractsToCSV } from '../../core/utils/csvDoc';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ButtonComponent } from '../../components/button/button';
import { delay } from 'rxjs';
import { MessageService } from '../../services/message-service';

@Component({
  selector: 'app-admin-offers',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    CommonModule,
    TranslateModule,
    Buttonback,
    ButtonComponent,
  ],
  templateUrl: './admin-offers.component.html',
  styleUrl: './admin-offers.component.css',
})
export default class AdminOffersComponent {
  private contractService = inject(ContractService);
  private pdfService = inject(DocsPdf);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  public displayedColumns: string[] = [
    'id_contract',
    'client',
    'business',
    'service',
    'state',
    'start_date',
    'actions',
  ];

  public dataSource = new MatTableDataSource<ContractDetail>([]);
  public isLoading = true;

  public paginator = viewChild(MatPaginator);
  public sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      const currentPaginator = this.paginator();
      const currentSort = this.sort();

      if (currentPaginator) {
        this.dataSource.paginator = currentPaginator;
      }

      if (currentSort) {
        this.dataSource.sort = currentSort;
      }
    });
  }

  ngOnInit(): void {
    this.loadAdminContracts();
  }

  /**
   * Carga los contratos de los administradores
   */
  private loadAdminContracts(): void {
    this.isLoading = true;
    this.contractService
      .getAllContractsForAdmin()
      .pipe(takeUntilDestroyed(this.destroyRef), delay(500))
      .subscribe({
        next: (data: ContractDetail[]) => {
          this.dataSource.data = data;
          this.isLoading = false;
          this.dataSource.filterPredicate = (data: ContractDetail, filter: string) => {
            if (filter === 'all') return true;
            return data.state === filter;
          };
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
          console.error('Error cargando contratos de admin:', error);
          this.isLoading = false;
          this.cd.markForCheck();
        },
      });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLSelectElement).value;
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /**
   * Exporta a CSV usando la utilidad global
   */
  exportToCSV(): void {
    exportContractsToCSV(this.dataSource.filteredData, 'CuidaDos_Admin_Contratos');
  }

  downloadContractPDF(contract: ContractDetail): void {
    this.pdfService.downloadPDF(contract);
  }

  deleteContract(element: ContractDetail) {
    if (element.state === 'no active') {
      this.contractService.deleteContractDB(element.id_contract).subscribe({
        next: () => {
          this.messageService.showMessage(
            this.translate.instant('MESSAGES_MODAL.FEEDBACK.SUCCESS_DELETE') ||
              'Contrato eliminado correctamente',
            'success',
          );
          this.loadAdminContracts();
        },
        error: (err: any) => {
          console.error(err);
          this.messageService.showMessage(
            this.translate.instant('MESSAGES_MODAL.FEEDBACK.ERROR_DELETE') ||
              'Error al eliminar el contrato',
            'error',
          );
        },
      });
    }
  }
}
