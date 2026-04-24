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
import { switchMap, catchError, map, tap, take, delay,  filter} from 'rxjs/operators';
import { Searchbar } from '../../components/searchbar/searchbar';
import { ButtonComponent } from '../../components/button/button';
import { AuthService } from '../../services/auth.service';
import { ContractService } from '../../services/contract.service';
import { MessageService } from '../../services/message-service';
import { ContractModel } from '../../models/ContractModel';
import { Buttonback } from '../../components/buttonback/buttonback';
import { ServiceTimeResponse } from '../../models/Bussiness-Service';
import { BusinessModel } from '../../models/BusinessModel';
import { BusinessService } from '../../services/business.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
/**
 * Componente para buscar y contratar servicios de negocios.
 * Utiliza estado independiente para selecciones de interfaz de usuario para mantener los modelos puros.
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

  public allBusinesses = signal<BusinessModel[] | undefined>(undefined);
  
  public searchFilter = signal<string>('');
  public filterControl = new FormControl('');
  public initialServiceId = signal<string | null>(null);
  public selections = signal<Record<string, ServiceTimeResponse>>({});

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { idService: string };

    if (state?.idService) {
      this.initialServiceId.set(state.idService);
    } else if (history.state?.idService) {
      this.initialServiceId.set(history.state.idService);
    }
  }

  public filteredBusinesses = computed(() => {
    const businesses = this.allBusinesses();
      if (!businesses) return [];
    const filterText = this.searchFilter().toLowerCase().trim();
        if (!filterText) return businesses;
  
    return businesses.filter((business) => {
      const matchName = business.name.toLowerCase().includes(filterText);
      const matchService = business.Service_Time?.some(
        (sh: ServiceTimeResponse) =>
          sh.Service?.name.toLowerCase().includes(filterText) ||
          sh.Time?.week_day.toLowerCase().includes(filterText),
      );
  
      return matchName || matchService;
    });
  });

  ngOnInit() {
    this.loadBusinessesRealTime();
  }

  loadBusinessesRealTime() {
    this.businessService
      .getBusinessesObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        delay(1000),
        filter((data): data is BusinessModel[] => data !== null && data !== undefined),
        catchError((err) => {
          console.error('Error en tiempo real de Negocios:', err);
          this.translate.get('SEARCH_BUSINESS.MESSAGES.CONNECTION_ERROR').subscribe(msg => {
            this.messageService.showMessage(msg, 'error');
          });
          return of([]);
        }),
      )
      .subscribe((data: BusinessModel[]) => {
        const targetId = this.initialServiceId()?.trim();
        const processedData: BusinessModel[] = data
          .map((business) => {
            const filteredTimes = targetId
              ? business.Service_Time?.filter(
                  (sh: ServiceTimeResponse) => sh.Service?.id_service === targetId,
                )
              : business.Service_Time;
            return {
              ...business,
              Service_Time: filteredTimes,
            };
          })
          .filter((business) => business.Service_Time && business.Service_Time.length > 0);
        this.allBusinesses.set(processedData);
        this.cd.markForCheck();
      });
  }

  updateSelection(businessId: string, selection: ServiceTimeResponse) {
    this.selections.update((prev) => ({
      ...prev,
      [businessId]: selection,
    }));
  }

  applyFilter(value: string) {
    this.searchFilter.set(value);
  }

  toHire(business: BusinessModel) {
    const user = this.authService.currentUser();
    if (!user) {
      this.translate.get('SEARCH_BUSINESS.MESSAGES.LOGIN_REQUIRED').subscribe((res) => {
        this.messageService.showMessage(res, 'error');
      });
      return;
    }
    const selection = this.selections()[business.id_business];

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
        const selectedTimeId = selection.id_service_time;

        const isAlreadyHired = contracts.find((c: any) => {
          let idRealContrato = c.id_service_time;
          if (idRealContrato && typeof idRealContrato === 'object') {
            idRealContrato = idRealContrato.id_service_time;
          }
          if (!idRealContrato && c.id_st_flat) {
            idRealContrato = c.id_st_flat;
          }
          const sameId = String(idRealContrato) === String(selectedTimeId);
          console.log(sameId);
          console.log(idRealContrato);
          console.log(selectedTimeId);

          const sameClient = c.id_client === user.id_user;
          const isActive = c.state === 'active';
          return sameId && sameClient && isActive;
        });

        if (isAlreadyHired) {
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
              console.error('Error de contratación:', err);
              return this.translate
                .get('SEARCH_BUSINESS.MESSAGES.CONTRACT_ERROR')
                .pipe(map((text) => ({ type: 'error' as const, text })));
            }),
          )
          .subscribe((result) => {
            this.messageService.showMessage(result.text, result.type);
            if (result.type === 'success') {
              this.selections.update((prev) => {
                const updated = { ...prev };
                delete updated[business.id_business];
                return updated;
              });
            }
            this.cd.markForCheck();
          });
      });
  }

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
        receiverId: business.id_business,
        receiverName: business.name,
        direct:true
      },
      width: '500px',
    });
  }
}
