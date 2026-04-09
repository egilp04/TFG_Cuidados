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
import { ContratoModel } from '../../models/Contrato';
import { Buttonback } from '../../components/buttonback/buttonback';
import { EmpresaModel, ServicioHorarioResponse } from '../../models/Bussiness-Service';
import { BusinessService } from '../../services/business.service';

export interface EmpresaUI extends EmpresaModel {
  seleccion?: ServicioHorarioResponse;
}

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
export class SearchBusiness implements OnInit {
  private businessService = inject(BusinessService);
  private contractService = inject(ContractService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private cd = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);

  public allBussinesses = signal<EmpresaUI[]>([]);
  public searchFilterItem = signal<string>('');
  public controlFilterItem = new FormControl('');

  public filteredBussinesses = computed(() => {
    const filtro = this.searchFilterItem().toLowerCase().trim();
    if (!filtro) return this.allBussinesses();
    return this.allBussinesses().filter((emp) => {
      const sameName = emp.nombre.toLowerCase().includes(filtro);
      const sameService = emp.Servicio_Horario?.some(
        (sh: ServicioHorarioResponse) =>
          sh.Servicio?.nombre.toLowerCase().includes(filtro) ||
          sh.Horario?.dia_semana.toLowerCase().includes(filtro)
      );

      return sameName || sameService;
    });
  });

  ngOnInit() {
    this.chargeBussinessRealTime();
  }

  chargeBussinessRealTime() {
    this.businessService
      .getBusinessesObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error('Error IRL Empresas:', err);
          return this.translate.get('SEARCH_BUSINESS.MESSAGES.CONNECTION_ERROR').pipe(
            tap((msg) => this.messageService.showMessage(msg, 'error')),
            map(() => [])
          );
        })
      )
      .subscribe((data: EmpresaModel[]) => {
        const dataConSeleccion: EmpresaUI[] = data.map((e) => ({
          ...e,
          seleccion: undefined,
        }));
        this.allBussinesses.set(dataConSeleccion);
        this.cd.markForCheck();
      });
  }

  applyFilter(valor: string) {
    this.searchFilterItem.set(valor);
  }
  
  toHire(empresa: EmpresaUI) {
    const user = this.authService.currentUser();
    if (!user) {
      this.translate.get('SEARCH_BUSINESS.MESSAGES.LOGIN_REQUIRED').subscribe((res) => {
        this.messageService.showMessage(res, 'error');
      });
      return;
    }

    const seleccion = empresa.seleccion;
    if (!seleccion) {
      this.translate.get('SEARCH_BUSINESS.MESSAGES.SELECT_SERVICE').subscribe((res) => {
        this.messageService.showMessage(res, 'error');
      });
      return;
    }

    this.contractService
      .getContractsObservable()
      .pipe(take(1))
      .subscribe((contratos) => {
        const idSeleccionado = seleccion.id_servicio_horario;
        console.log('ID que buscas:', idSeleccionado);
        console.log(
          'IDs en tus contratos:',
          contratos.map((c) => c.id_sh_plano)
        );
        const yaContratado = contratos.find((c) => {
          const coincidenIds = String(c.id_sh_plano) === String(idSeleccionado);
          const esMismoCliente = c.id_cliente === user.id_usuario;
          const estaActivo = c.estado === 'activo';

          return coincidenIds && esMismoCliente && estaActivo;
        });
        console.log(yaContratado);
        if (yaContratado) {
          this.translate.get('SEARCH_BUSINESS.MESSAGES.ALREADY_CONTRACTED').subscribe((res) => {
            this.messageService.showMessage(res, 'error');
          });
          return;
        }

        const nuevoContrato: ContratoModel = {
          estado: 'activo',
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_fin: null,
          dia_semana_contratado: seleccion.Horario?.dia_semana || '',
          hora_contratada: seleccion.Horario?.hora || '',
          fecha_creacion: new Date().toISOString(),
          id_servicio_horario: seleccion.id_servicio_horario,
          id_cliente: user.id_usuario,
          id_empresa: empresa.id_empresa,
        };

        this.contractService
          .createContract(nuevoContrato)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(() =>
              this.translate
                .get('SEARCH_BUSINESS.MESSAGES.CONTRACT_SUCCESS')
                .pipe(map((text) => ({ type: 'exito' as const, text })))
            ),
            catchError((err) => {
              console.error('Error al contratar:', err);
              return this.translate
                .get('SEARCH_BUSINESS.MESSAGES.CONTRACT_ERROR')
                .pipe(map((text) => ({ type: 'error' as const, text })));
            })
          )
          .subscribe((resultado) => {
            this.messageService.showMessage(resultado.text, resultado.type);
            if (resultado.type === 'exito') {
              empresa.seleccion = undefined;
            }
            this.cd.markForCheck();
          });
      });
  }

  async sendMessage(empresa: EmpresaUI) {
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
        modo: 'escribir',
        receptorEmail: empresa.email,
        idReceptor: empresa.id_empresa,
        nombreReceptor: empresa.nombre,
      },
      width: '500px',
    });
  }
}
