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
 * Component to list and manage user contracts.
 * Allows viewing details and requesting cancellations through a secure workflow.
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

  ngOnInit(): void {
    this.subscribeToContracts();
  }

  /**
   * Subscribes to the real-time contracts stream and initializes the table data.
   */
  private subscribeToContracts(): void {
    this.contractService
      .getContractsObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: ContractDetail[]) => {
          this.dataSource.data = data;
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          this.cd.markForCheck();
        },
        error: (error: Error) => console.error('Error in real-time contract stream:', error),
      });
  }

  /**
   * Opens a confirmation modal and triggers the contract cancellation process.
   * @param id The unique identifier of the contract.
   */
  async cancelContract(id: string): Promise<void> {
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    
    const dialogRef = this.dialog.open(Cancelmodal, {
      data: { mode: 'cancelContract' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '650px',
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
                .get('MESSAGES.SUCCESS.CANCEL_CONTRACT')
                .pipe(map((msg: string) => ({ text: msg, type: 'success' as const })))
            ),
            catchError((err: Error) => {
              console.error('Cancellation error:', err);
              return this.translate
                .get('MESSAGES.ERROR.CANCEL_CONTRACT')
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
   * Opens an information modal displaying the full details of a contract.
   * Uses cached data if available, otherwise fetches from the server.
   * @param id The unique identifier of the contract.
   */
  async showDetails(id: string): Promise<void> {
    const { InfoContract } = await import('../../components/info-contract/info-contract');
    
    const dialogConfig = {
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
      maxHeight: '90vh',
    };
      const cachedContract = this.dataSource.data.find((c) => c.id_contract === id);
  
    if (cachedContract) {
      this.dialog.open(InfoContract, { ...dialogConfig, data: { contract: cachedContract } });
      return;
    }
      this.contractService.getContractsById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      map((raw: any): ContractDetail => {
        return {
          ...raw,
          id_contract: raw.id_contract,
          serviceName: raw.Service_Time?.Service?.name || 'No Service',
          Client: {
            address: raw.Client?.address,
            city: raw.Client?.city,
            postcode: raw.Client?.postcode,
            clientName: raw.Client?.User_public?.name || raw.Client?.name || 'Unknown Client'
          },
          Business: {
            businessName: raw.Business?.User_public?.name || raw.Business?.name || 'Unknown Business'
          }
        };
      })
    ).subscribe({
      next: (mappedContract) => {
        this.dialog.open(InfoContract, {
          ...dialogConfig,
          data: { contract: mappedContract },
        });
      },
      error: (err) => {
        console.error('Error fetching contract details:', err);
        this.messageService.showMessage('Could not load contract details', 'error');
      }
    });
  }

}