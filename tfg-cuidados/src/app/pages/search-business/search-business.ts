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
import { BusinessService } from '../../services/business.service';
import { AuthService } from '../../services/auth.service';
import { ContractService } from '../../services/contract.service';
import { MessageService } from '../../services/message-service';
import { ContratoModel } from '../../models/Contrato';
import { MessagesModal } from '../../components/messages-modal/messages-modal';
import { Buttonback } from '../../components/buttonback/buttonback';

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

  public todasLasEmpresas = signal<any[]>([]);
  public filtroBusqueda = signal<string>('');
  public filtroControl = new FormControl('');

  public empresasFiltradas = computed(() => {
    const filtro = this.filtroBusqueda().toLowerCase().trim();
    if (!filtro) return this.todasLasEmpresas();
    return this.todasLasEmpresas().filter((emp) => {
      const coincideNombre = emp.nombre.toLowerCase().includes(filtro);
      const coincideServicio = emp.Servicio_Horario?.some(
        (sh: any) =>
          sh.Servicio?.nombre.toLowerCase().includes(filtro) ||
          sh.Horario?.dia_semana.toLowerCase().includes(filtro)
      );

      return coincideNombre || coincideServicio;
    });
  });

  ngOnInit() {
    this.cargarEmpresasReactiva();
  }

  cargarEmpresasReactiva() {
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
      .subscribe((data) => {
        const dataConSeleccion = data.map((e: any) => ({
          ...e,
          seleccion: e.seleccion || undefined,
        }));
        this.todasLasEmpresas.set(dataConSeleccion);
        this.cd.markForCheck();
      });
  }

  applyFilter(valor: string) {
    this.filtroBusqueda.set(valor);
  }

  contratar(empresa: any) {
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
          // Comparamos strings para evitar errores de tipo (number vs string)
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
          dia_semana_contratado: seleccion.Horario.dia_semana,
          hora_contratada: seleccion.Horario.hora,
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

  enviarMensaje(empresa: any) {
    const user = this.authService.currentUser();
    if (!user) {
      this.translate.get('SEARCH_BUSINESS.MESSAGES.LOGIN_MSG_REQUIRED').subscribe((res) => {
        this.messageService.showMessage(res, 'error');
      });
      return;
    }

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
