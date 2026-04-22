import {
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { switchMap, catchError, map, tap, take } from 'rxjs/operators';
import { Searchbar } from '../../components/searchbar/searchbar';
import { ButtonComponent } from '../../components/button/button';
import { AuthService } from '../../services/auth.service';
import { ContractService } from '../../services/contract.service';
import { MessageService } from '../../services/message-service';
import { ContractModel } from '../../models/ContractModel';
import { Buttonback } from '../../components/buttonback/buttonback';
import { BusinessModel, ServiceTimeResponse } from '../../models/Business-Service';
import { BusinessService } from '../../services/business.service';
import { Router } from '@angular/router';

/**
 * Component for searching, filtering, and hiring business services.
 * Also allows direct messaging to business profiles.
 */
@Component({
  selector: 'app-verempresas',
  standalone: true,
  imports: [
    Searchbar,
    ButtonComponent,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    Buttonback,
    TranslateModule,
  ],
  templateUrl: './search-business.html',
  styleUrl: './search-business.css',
})
export default class SearchBusiness implements OnInit {
  private businessService = inject(BusinessService);
  private contractService = inject(ContractService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  public allBusinesses = signal<BusinessModel[]>([]);
  public searchFilterItem = signal<string>('');
  public controlFilterItem = new FormControl('');
  public idSelectedService = signal<string | null>(null);

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { idService: string };
    
    if (state && state.idService) {
      this.idSelectedService.set(state.idService);
    } else if (history.state && history.state.idService) {
      this.idSelectedService.set(history.state.idService);
    }
  }

  /**
   * Dynamically filters the list of businesses based on search input matching business name, service name, or day.
   */
  public filteredBusinesses = computed(() => {
    const filterText = this.searchFilterItem().toLowerCase().trim();
    if (!filterText) return this.allBusinesses();
    
    return this.allBusinesses().filter((business) => {
      const sameName = business.name.toLowerCase().includes(filterText);
      const sameService = business.Service_Time?.some(
        (sh: ServiceTimeResponse) =>
          sh.Service?.name.toLowerCase().includes(filterText) ||
          sh.Time?.week_day.toLowerCase().includes(filterText),
      );

      return sameName || sameService;
    });
  });

  ngOnInit() {
    this.loadBusinessesRealTime();
  }

  /**
   * Initializes real-time subscription for businesses and their offered service times.
   */
  loadBusinessesRealTime() {
    this.businessService
      .getBusinessesObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error('Error loading real-time businesses:', err);
          return this.translate.get('SEARCH_BUSINESS.MESSAGES.CONNECTION_ERROR').pipe(
            tap((msg) => this.messageService.showMessage(msg, 'error')),
            map(() => []),
          );
        }),
      )
      .subscribe((data: BusinessModel[]) => {
        const targetId = this.idSelectedService()?.trim();
        
        const dataWithSelection: BusinessModel[] = data
          .map((business) => {
            const filteredTimes = targetId
              ? business.Service_Time?.filter((sh) => sh.Service?.id_service === targetId)
              : business.Service_Time;
            return {
              ...business,
              Service_Time: filteredTimes,
              selection: undefined,
            };
          })
          .filter((business) => business.Service_Time && business.Service_Time.length > 0);
          
        this.allBusinesses.set(dataWithSelection);
        this.cd.markForCheck();
      });
  }

  /**
   * Updates the search filter signal.
   * @param value The text value to filter by.
   */
  applyFilter(value: string) {
    this.searchFilterItem.set(value);
  }

  /**
   * Processes the hiring of a service from a specific business.
   * Prevents duplicate active contracts for the same service schedule.
   * @param business The selected business containing the user's service selection.
   */
  toHire(business: BusinessModel) {
    const user = this.authService.currentUser();
    if (!user) {
      this.translate.get('SEARCH_BUSINESS.MESSAGES.LOGIN_REQUIRED').subscribe((res) => {
        this.messageService.showMessage(res, 'error');
      });
      return;
    }

    const selection = business.selection;
    if (!selection) {
      this.translate.get('SEARCH_BUSINESS.MESSAGES.SELECT_SERVICE').subscribe((res) => {
        this.messageService.showMessage(res, 'error');
      });
      return;
    }

    this.contractService
      .getContractsObservable()
      .pipe(take(1))
      .subscribe((contracts) => {
        const selectedId = selection.id_service_time;
        
        const alreadyHired = contracts.find((contract) => {
          const sameIds = String(contract.id_st_flat) === String(selectedId);
          const sameClient = contract.id_client === user.id_user;
          const isActive = contract.state === 'active';

          return sameIds && sameClient && isActive;
        });

        if (alreadyHired) {
          this.translate.get('SEARCH_BUSINESS.MESSAGES.ALREADY_CONTRACTED').subscribe((res) => {
            this.messageService.showMessage(res, 'error');
          });
          return;
        }

        const newContract: ContractModel = {
          state: 'active',
          start_date: new Date().toISOString().split('T')[0],
          end_date: null,
          week_day_hired: selection.Time?.week_day || '',
          time_hired: selection.Time?.time || '',
          creation_date: new Date().toISOString(),
          id_service_time: selection.id_service_time,
          id_client: user.id_user,
          id_business: business.id_business,
        };

        this.contractService
          .createContract(newContract)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() =>
              this.translate
                .get('SEARCH_BUSINESS.MESSAGES.CONTRACT_SUCCESS')
                .pipe(map((text) => ({ type: 'success' as const, text }))),
            ),
            catchError((err) => {
              console.error('Error hiring service:', err);
              return this.translate
                .get('SEARCH_BUSINESS.MESSAGES.CONTRACT_ERROR')
                .pipe(map((text) => ({ type: 'error' as const, text })));
            }),
          )
          .subscribe((resultado) => {
            this.messageService.showMessage(resultado.text, resultado.type);
            if (resultado.type === 'success') {
              business.selection = undefined;
            }
            this.cd.markForCheck();
          });
      });
  }

  /**
   * Opens the messaging modal to send a direct message to the selected business.
   * @param business The business recipient of the message.
   */
  async sendMessage(business: BusinessModel) {
    const user = this.authService.currentUser();
    if (!user) {
      this.translate.get('SEARCH_BUSINESS.MESSAGES.LOGIN_MSG_REQUIRED').subscribe((res) => {
        this.messageService.showMessage(res, 'error');
      });
      return;
    }
    const { MessagesModal } = await import('../../components/messages-modal/messages-modal');
    this.dialog.open(MessagesModal, {
      data: {
        mode: 'writeMessage',
        receiverEmail: business.email,
      },
      width: '500px',
    });
  }
}