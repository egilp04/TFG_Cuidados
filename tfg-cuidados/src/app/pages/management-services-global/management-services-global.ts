import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { switchMap, tap, throwError, map, catchError, filter, finalize } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { Searchbar } from '../../components/searchbar/searchbar';
import { ServiceService } from '../../services/service.service';
import { MessageService } from '../../services/message-service';
import { ServiceModel } from '../../models/ServiceModel';
import { Buttonback } from '../../components/buttonback/buttonback';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ResponsiveSize } from '../../services/responsive-size';

/**
 * Componente para la gestión global de servicios por administradores.
 * Permite crear, editar y eliminar el catálogo de servicios disponibles en la plataforma.
 */
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
export default class ManagementServicesGlobal implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private serviceService = inject(ServiceService);
  public messageService = inject(MessageService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);
  private responsive = inject(ResponsiveSize);

  public isLoading = signal(false);
  public isEditing = false;
  public currentServiceId: string | null = null;

  public controlFilterItem = new FormControl<string>('');

  public serviceForm = this.fb.group({
    name: this.fb.control<string>('', [Validators.required, Validators.minLength(3)]),
    type_service: this.fb.control<string>('', [Validators.required]),
    description: this.fb.control<string>('', [Validators.required]),
  });

  public dataSource = new MatTableDataSource<ServiceModel>([]);
  public displayedColumns: string[] = ['name', 'type_service', 'description', 'actions'];

  ngOnInit(): void {
    this.loadServices();
  }

  /**
   * Se suscribe al flujo de servicios para mantener la tabla actualizada.
   */
  private loadServices(): void {
    this.serviceService
      .getServicesObservable()
      .pipe(takeUntilDestroyed(this.destroyRef),
      filter(data => data !== null))
      .subscribe((data: ServiceModel[]) => {
        this.dataSource.data = data;
        this.cd.markForCheck();
      });
  }

  /**
   * Guarda un nuevo servicio o actualiza uno existente.
   * Incluye validación de nombres duplicados.
   */
  saveService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }
    if (this.isLoading()) return;

    this.isLoading.set(true);

    const rawValue = this.serviceForm.getRawValue();
    const name = (rawValue.name ?? '').trim();
    const serviceType = (rawValue.type_service ?? '').trim();
    const description = (rawValue.description ?? '').trim();

    const user = this.authService.currentUser();
    if (!user?.id_user) {
      this.isLoading.set(false);
      return;
    }

    this.serviceService
      .existsService(name, this.currentServiceId || undefined)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((exists: boolean) => {
          if (exists) return throwError(() => new Error('DUPLICATE_SERVICE'));

          const payload: ServiceModel = {
            name,
            type_service: serviceType,
            description,
            id_admin: user.id_user,
          };

          return this.isEditing && this.currentServiceId
            ? this.serviceService.updateService(this.currentServiceId, payload)
            : this.serviceService.insertService(payload);
        }),
        switchMap(() => {
          const msgKey = this.isEditing
            ? 'MANAGEMENT_SERVICES.MESSAGES.SUCCESS_UPDATE'
            : 'MANAGEMENT_SERVICES.MESSAGES.SUCCESS_CREATE';
          return this.translate
            .get(msgKey)
            .pipe(map((text: string) => ({ type: 'success' as const, text })));
        }),
        catchError((err: any) => {
          console.error('Error detallado guardando servicio:', err);
          let msgKey = 'MANAGEMENT_SERVICES.MESSAGES.ERROR_GENERIC';
          if (err.message === 'DUPLICATE_SERVICE' || err.code === '23505') {
            msgKey = 'MANAGEMENT_SERVICES.MESSAGES.ERROR_DUPLICATE';
          }
          return this.translate
            .get(msgKey)
            .pipe(map((text: string) => ({ type: 'error' as const, text })));
        }),
        finalize(() => {
          this.isLoading.set(false);
          this.cd.markForCheck();
        }),
      )
      .subscribe((result) => {
        this.messageService.showMessage(result.text, result.type);
        if (result.type === 'success') {
          this.resetForm();
        }
      });
  }

  /**
   * Prepara el formulario con los datos del servicio seleccionado para edición.
   * @param service El modelo de servicio a editar.
   */
  editService(service: ServiceModel): void {
    this.isEditing = true;
    this.currentServiceId = service.id_service!;
    this.serviceForm.patchValue({
      name: service.name,
      type_service: service.type_service,
      description: service.description,
    });
    this.cd.markForCheck();
  }

  /**
   * Abre una modal de confirmación y elimina un servicio.
   * @param id El identificador único del servicio.
   */
  async deleteService(id: string): Promise<void> {
    if (this.isLoading()) return;

    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    const dialogRef = this.dialog.open(Cancelmodal, {
      data: { mode: 'deleteGlobalAdmin' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '600px',
      maxHeight: '90vh',
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result: boolean) => result === true),
        tap(() => {
          this.isLoading.set(true);
          this.cd.markForCheck();
        }),
        switchMap(() =>
          this.serviceService.deleteService(id).pipe(
            finalize(() => {
              this.isLoading.set(false);
              this.cd.markForCheck();
            }),
            switchMap(() =>
              this.translate
                .get('MANAGEMENT_SERVICES.MESSAGES.SUCCESS_DELETE')
                .pipe(map((text: string) => ({ type: 'success' as const, text }))),
            ),
            catchError(() =>
              this.translate
                .get('MANAGEMENT_SERVICES.MESSAGES.ERROR_DELETE')
                .pipe(map((text: string) => ({ type: 'error' as const, text }))),
            ),
          ),
        ),
      )
      .subscribe((result) => {
        this.messageService.showMessage(result.text, result.type);
      });
  }

  /**
   * Limpia el formulario y el estado de edición.
   */
  resetForm(): void {
    this.isEditing = false;
    this.currentServiceId = null;
    this.serviceForm.reset();
    this.cd.markForCheck();
  }

  /**
   * Aplica un filtro a la tabla de datos.
   * @param value Cadena de búsqueda.
   */
  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  /**
   * Auxiliar para obtener controles de formulario con seguridad de tipo.
   */
  getCtrl(name: string): FormControl {
    return this.serviceForm.get(name) as FormControl;
  }
}
