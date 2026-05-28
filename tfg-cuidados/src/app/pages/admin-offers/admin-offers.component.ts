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
import { Service_Time_Model } from '../../models/Service_Time_Model';
import { ServiceTimeService } from '../../services/service-time.service';
import { Searchbar } from '../../components/searchbar/searchbar';
import { FormControl } from '@angular/forms';

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
    Searchbar,
  ],
  templateUrl: './admin-offers.component.html',
  styleUrl: './admin-offers.component.css',
})
export default class AdminOffersComponent implements OnInit {
  private serviceTimeService = inject(ServiceTimeService);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  public displayedColumns: string[] = [
    'id_service_time',
    'id_business',
    'description',
    'id_service',
    'price',
    'status',
    'actions',
  ];

  public searchControl = new FormControl('');
  public filterValues = {
    state: 'all',
    search: '',
  };

  public dataSource = new MatTableDataSource<Service_Time_Model>([]);
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
    this.setupCustomFilter();
    this.setupSearchListener();
    this.loadAdminOffers();
  }

  /**
   * Carga todas las ofertas (Service_Time) de la plataforma
   */
  private loadAdminOffers(): void {
    this.isLoading = true;
    this.serviceTimeService
      .getAllOffersForAdmin()
      .pipe(takeUntilDestroyed(this.destroyRef), delay(500))
      .subscribe({
        next: (data: Service_Time_Model[]) => {
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
          console.error('Error cargando ofertas de admin:', error);
          this.isLoading = false;
          this.cd.markForCheck();
        },
      });
  }

  /**
   * Elimina una oferta comprobando primero que no tenga contratos asociados
   */
  deleteOffer(element: Service_Time_Model) {
    this.serviceTimeService.deleteServiceTimeDB(element.id_service_time).subscribe({
      next: () => {
        this.messageService.showMessage(
          this.translate.instant('MESSAGES_MODAL.FEEDBACK.SUCCESS_DELETE') ||
            'Oferta eliminada correctamente',
          'success',
        );
        this.loadAdminOffers();
      },
      error: (err: any) => {
        console.error(err);
        if (err.message === 'MANAGEMENT_SERVICES.MESSAGES.ERROR_HAS_OFFERS') {
          this.translate.get(err.message).subscribe((text: string) => {
            this.messageService.showMessage(text, 'error');
            this.cd.markForCheck();
          });
        } else if (err.message === 'MANAGEMENT_SERVICES.MESSAGES.ERROR_HAS_ACTIVE_CONTRACT') {
          this.translate.get(err.message).subscribe((text: string) => {
            this.messageService.showMessage(text, 'error');
            this.cd.markForCheck();
          });
        } else {
          this.messageService.showMessage(
            this.translate.instant('MESSAGES_MODAL.FEEDBACK.ERROR_DELETE') ||
              'Error al eliminar la oferta',
            'error',
          );
        }
      },
    });
  }

  private setupCustomFilter(): void {
    this.dataSource.filterPredicate = (data: any, filterStr: string) => {
      const currentFilters = JSON.parse(filterStr);
      if (currentFilters.state !== 'all' && data.status !== currentFilters.state) {
        return false;
      }
      if (!currentFilters.search) return true;
      const dataStr = (
        (data.id_service_time || '') +
        ' ' +
        (data.Business?.User_public?.name || '') +
        ' ' +
        (data.description || '') +
        ' ' +
        (data.Service?.type_service || '') +
        ' ' +
        (data.price ? data.price.toString() + '€ ' + data.price.toString() : '')
      ).toLowerCase();
      return dataStr.includes(currentFilters.search);
    };
  }

  private setupSearchListener(): void {
    this.searchControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.filterValues.search = (value || '').trim().toLowerCase().replace(/\s+€/g, '€');
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
}
