import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { switchMap, throwError, map, catchError, of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { Searchbar } from '../../components/searchbar/searchbar';
import { ServiceService } from '../../services/service.service';
import { MessageService } from '../../services/message-service';
import { ServicioModel } from '../../models/Servicio';
import { Buttonback } from '../../components/buttonback/buttonback';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-management-services-global',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    Inputs,
    ButtonComponent,
    Searchbar,
    Buttonback,
    TranslateModule,
  ],
  templateUrl: './management-services-global.html',
  styleUrl: './management-services-global.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementServicesGlobal implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private serviceService = inject(ServiceService);
  public messageService = inject(MessageService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  isEditing: boolean = false;
  currentServiceId: string | null = null;

  filtroControl = new FormControl('');
  servicioForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    tipo: ['', [Validators.required]],
  });

  dataSource = new MatTableDataSource<ServicioModel>([]);
  displayedColumns: string[] = ['nombre', 'tipo_servicio', 'acciones'];

  ngOnInit() {
    this.serviceService
      .getServicesObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.dataSource.data = data;
        this.cd.markForCheck();
      });
  }

  onSave() {
    if (this.servicioForm.invalid) {
      this.servicioForm.markAllAsTouched();
      return;
    }
    const rawValue = this.servicioForm.getRawValue();
    const nombre = rawValue.nombre.trim();
    const tipo = rawValue.tipo.trim();

    const user = this.authService.currentUser();
    if (!user || !user.id_usuario) return;

    this.serviceService
      .existsService(nombre, this.currentServiceId || undefined)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((existe) => {
          if (existe) {
            return throwError(() => ({ message: 'DUPLICADO' }));
          }

          if (this.isEditing && this.currentServiceId) {
            return this.serviceService.updateService(this.currentServiceId, {
              nombre,
              tipo_servicio: tipo,
            });
          } else {
            return this.serviceService.insertService({
              nombre,
              tipo_servicio: tipo,
              id_admin: user.id_usuario,
            });
          }
        }),
        switchMap(() => {
          const msgKey = this.isEditing
            ? 'MANAGEMENT_SERVICES.MESSAGES.SUCCESS_UPDATE'
            : 'MANAGEMENT_SERVICES.MESSAGES.SUCCESS_CREATE';
          return this.translate.get(msgKey).pipe(map((text) => ({ type: 'exito' as const, text })));
        }),
        catchError((err) => {
          console.error('Error detallado al guardar servicio:', err);
          let msgKey = 'MANAGEMENT_SERVICES.MESSAGES.ERROR_GENERIC';
          if (err.message === 'DUPLICADO' || err.code === '23505') {
            msgKey = 'MANAGEMENT_SERVICES.MESSAGES.ERROR_DUPLICATE';
          }
          return this.translate.get(msgKey).pipe(map((text) => ({ type: 'error' as const, text })));
        })
      )
      .subscribe((resultado) => {
        this.messageService.showMessage(resultado.text, resultado.type);
        if (resultado.type === 'exito') {
          this.resetForm();
        }
        this.cd.markForCheck();
      });
  }

  onEdit(servicio: ServicioModel) {
    this.isEditing = true;
    this.currentServiceId = servicio.id_servicio!;
    this.servicioForm.patchValue({
      nombre: servicio.nombre,
      tipo: servicio.tipo_servicio,
    });
  }

  onDelete(id: string) {
    const confirmMsg = this.translate.instant('MANAGEMENT_SERVICES.MESSAGES.CONFIRM_DELETE');

    if (confirm(confirmMsg)) {
      this.serviceService
        .deleteService(id)
        .pipe(
          switchMap(() =>
            this.translate
              .get('MANAGEMENT_SERVICES.MESSAGES.SUCCESS_DELETE')
              .pipe(map((text) => ({ type: 'exito' as const, text })))
          ),
          catchError(() =>
            this.translate
              .get('MANAGEMENT_SERVICES.MESSAGES.ERROR_DELETE')
              .pipe(map((text) => ({ type: 'error' as const, text })))
          )
        )
        .subscribe((resultado) => {
          this.messageService.showMessage(resultado.text, resultado.type);
        });
    }
  }

  resetForm() {
    this.isEditing = false;
    this.currentServiceId = null;
    this.servicioForm.reset();
  }

  aplicarFiltro(valor: string) {
    this.dataSource.filter = valor.trim().toLowerCase();
  }

  getCtrl(name: string) {
    return this.servicioForm.get(name) as FormControl;
  }
}
