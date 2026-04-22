import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MessageService } from '../../services/message-service';
import { CommonModule } from '@angular/common';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ContractService } from '../../services/contract.service';
import { MatTableDataSource } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivitiesComponents } from '../../components/activities-components/activities-components';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, map, switchMap, filter } from 'rxjs';
import { ContractDetail } from '../../models/ContractModel';
import { ResponsiveSize } from '../../services/responsive-size';

/**
 * Main activities page that manages the list of user contracts.
 * Integrates a calendar and a table for viewing and canceling hired services.
 */
@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, Buttonback, ActivitiesComponents, TranslateModule],
  templateUrl: './activities.html',
  styleUrl: './activities.css',
})
export default class Activities implements OnInit {
  public messageService = inject(MessageService);
  private contractService = inject(ContractService);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private responsive = inject(ResponsiveSize);

  public dataSource = new MatTableDataSource<ContractDetail>([]);

  ngOnInit(): void {
    this.subscribeToContracts();
  }

  /**
   * Subscribes to the real-time contracts stream to feed the activity views.
   */
  private subscribeToContracts(): void {
    this.contractService
      .getContractsObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: ContractDetail[]) => {
          this.dataSource.data = data;
          this.cd.detectChanges();
        },
        error: (error: Error) => console.error('Error in contracts stream:', error),
      });
  }

  /**
   * Opens a confirmation modal and cancels the hired service.
   * @param id The unique identifier of the contract to cancel.
   */
  async cancelContract(id: string): Promise<void> {
    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    
    this.dialog
      .open(Cancelmodal, {
        data: { mode: 'cancelContract' },
        width: '100%',
        maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
        maxHeight: '90vh',
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result: boolean) => result === true),
        switchMap(() => this.contractService.deleteContract(id)),
        switchMap(() =>
          this.translate
            .get('MESSAGES.SUCCESS.CANCEL_CONTRACT')
            .pipe(map((msg: string) => ({ text: msg, type: 'success' as const })))
        ),
        catchError((err: Error) => {
          console.error('Error canceling contract:', err);
          return this.translate
            .get('MESSAGES.ERROR.CANCEL_CONTRACT')
            .pipe(map((msg: string) => ({ text: msg, type: 'error' as const })));
        }),
      )
      .subscribe((res) => {
        this.messageService.showMessage(res.text, res.type);
      });
  }
}