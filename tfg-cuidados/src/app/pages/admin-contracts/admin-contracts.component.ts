import { Component, DestroyRef, inject, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { ContractService } from '../../services/contract.service';
import { DocsPdf } from '../../services/docs-pdf';
import { ContractDetail } from '../../models/ContractModel';
import { exportContractsToCSV } from '../../core/utils/csvDoc';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ButtonComponent } from '../../components/button/button';

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
    ButtonComponent,
  ],
  templateUrl: './admin-contracts.component.html',
  styleUrl: './admin-contracts.component.css',
})
export default class AdminContractsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private contractService = inject(ContractService);
  private pdfService = inject(DocsPdf);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);

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

  ngOnInit(): void {
    this.loadAdminContracts();
  }

  private loadAdminContracts(): void {
    this.isLoading = true;
    this.contractService
      .getAllContractsForAdmin()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: ContractDetail[]) => {
          this.dataSource.data = data;
          this.isLoading = false;
          if (this.paginator) this.dataSource.paginator = this.paginator;
          if (this.sort) this.dataSource.sort = this.sort;
          this.dataSource.filterPredicate = (data: ContractDetail, filter: string) => {
            if (filter === 'all') return true;
            return data.state === filter;
          };

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
}
