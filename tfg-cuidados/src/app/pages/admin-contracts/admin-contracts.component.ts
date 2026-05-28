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
import { ResponsiveSize } from '../../services/responsive-size';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Searchbar } from '../../components/searchbar/searchbar';

@Component({
  selector: 'app-admin-contracts',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    CommonModule,
    TranslateModule,
    Buttonback,
    Searchbar,
    ButtonComponent,
  ],
  templateUrl: './admin-contracts.component.html',
  styleUrl: './admin-contracts.component.css',
})
export default class AdminContractsComponent implements OnInit {
  private contractService = inject(ContractService);
  private pdfService = inject(DocsPdf);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  public searchControl = new FormControl('');
  public filterValues = {
    state: 'all',
    search: '',
  };

  public displayedColumns: string[] = [
    'id_contract',
    'client',
    'business',
    'service',
    'state',
    'start_date',
    'end_date',
    'actions',
  ];

  public dataSource = new MatTableDataSource<ContractDetail>([]);
  public isLoading = true;

  public paginator = viewChild(MatPaginator);
  public sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      const currentPaginator = this.paginator();

      if (currentPaginator) {
        this.dataSource.paginator = currentPaginator;
      }

      const currentSort = this.sort();
      if (currentSort) {
        this.dataSource.sort = currentSort;
        this.dataSource.sortingDataAccessor = (item: any, property: string) => {
          switch (property) {
            case 'id_contract':
              return item.id_contract?.toLowerCase() || '';
            case 'client':
              return item.Client?.clientName?.toLowerCase() || '';
            case 'business':
              return item.Business?.businessName?.toLowerCase() || '';
            case 'service':
              return item.serviceName?.toLowerCase() || '';
            case 'start_date': {
              if (!item.start_date) return 0;
              const time = new Date(item.start_date).getTime();
              return isNaN(time) ? 0 : time;
            }
            case 'end_date': {
              if (!item.end_date) return 0;
              const time = new Date(item.end_date).getTime();
              return isNaN(time) ? 0 : time;
            }

            default:
              return item[property];
          }
        };
      }
    });
  }

  ngOnInit(): void {
    this.setupCustomFilter();
    this.setupSearchListener();
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
        error: (err) => {
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

  private setupCustomFilter(): void {
    this.dataSource.filterPredicate = (data: ContractDetail, filterStr: string) => {
      const currentFilters = JSON.parse(filterStr);
      if (currentFilters.state !== 'all' && data.state !== currentFilters.state) {
        return false;
      }
      if (!currentFilters.search) return true;
      let formatStart = '',
        formatEnd = '';
      if (data.start_date) {
        const p = data.start_date.split('T')[0].split('-');
        if (p.length === 3) formatStart = `${p[2]}/${p[1]}/${p[0]}`;
      }
      if (data.end_date) {
        const p = data.end_date.split('T')[0].split('-');
        if (p.length === 3) formatEnd = `${p[2]}/${p[1]}/${p[0]}`;
      }
      const dataStr = (
        (data.id_contract || '') +
        ' ' +
        (data.Client?.clientName || '') +
        ' ' +
        (data.Business?.businessName || '') +
        ' ' +
        (data.serviceName || '') +
        ' ' +
        formatStart +
        ' ' +
        formatEnd
      ).toLowerCase();
      return dataStr.includes(currentFilters.search);
    };
  }

  private setupSearchListener(): void {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.filterValues.search = (value || '')
        .trim()
        .toLowerCase()
        .replace(/\s*\/\s*/g, '/');
      this.applyCombinedFilters();
    });
  }

  onStateFilterChange(event: Event): void {
    this.filterValues.state = (event.target as HTMLSelectElement).value;
    this.applyCombinedFilters();
  }

  private applyCombinedFilters(): void {
    this.dataSource.filter = JSON.stringify(this.filterValues);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.filterValues.state = 'all';
    const selectElement = document.querySelector('select') as HTMLSelectElement;
    if (selectElement) {
      selectElement.value = 'all';
    }
    this.applyCombinedFilters();
  }

  private responsive = inject(ResponsiveSize);
  private dialog = inject(MatDialog);

  async showContract(row: ContractDetail): Promise<void> {
    const { InfoContract } = await import('../../components/info-contract/info-contract');
    const dialogConfig = {
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
    };
    this.dialog.open(InfoContract, {
      ...dialogConfig,
      data: { contract: row },
    });
  }
}
