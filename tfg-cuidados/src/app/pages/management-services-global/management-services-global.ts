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
import { switchMap, tap, throwError, map, catchError, of, filter } from 'rxjs';
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
import { finalize } from 'rxjs';
import { signal } from '@angular/core';

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
  public isLoading = signal(false);
  private responsive = inject(ResponsiveSize);

  isEditing: boolean = false;
  currentServiceId: string | null = null;

  controlFilterItem = new FormControl<string>('');

  serviceFormular = this.fb.group({
    name: this.fb.control<string>('', [Validators.required, Validators.minLength(3)]),
    type: this.fb.control<string>('', [Validators.required]),
    description: this.fb.control<string>('', [Validators.required]),
  });

  dataSource = new MatTableDataSource<ServiceModel>([]);
  displayedColumns: string[] = ['name', 'type', 'description', 'actions'];

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
    if (this.serviceFormular.invalid) {
      this.serviceFormular.markAllAsTouched();
      return;
    }
    if (this.isLoading()) return;

    this.isLoading.set(true);

    const rawValue = this.serviceFormular.getRawValue();
    const nombre = (rawValue.name ?? '').trim();
    const tipo = (rawValue.type ?? '').trim();
    const descripcion = (rawValue.description ?? '').trim();

    const user = this.authService.currentUser();
    if (!user || !user.id_usuario) {
      this.isLoading.set(false);
      return;
    }

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
              descripcion: descripcion,
            });
          } else {
            return this.serviceService.insertService({
              nombre,
              tipo_servicio: tipo,
              id_admin: user.id_usuario,
              descripcion: descripcion,
            });
          }
        }),
        switchMap(() => {
          const msgKey = this.isEditing
            ? 'MANAGEMENT_SERVICES.MESSAGES.SUCCESS_UPDATE'
            : 'MANAGEMENT_SERVICES.MESSAGES.SUCCESS_CREATE';
          return this.translate.get(msgKey).pipe(map((text) => ({ type: 'success' as const, text })));
        }),
        catchError((err) => {
          console.error('Error detallado al guardar servicio:', err);
          let msgKey = 'MANAGEMENT_SERVICES.MESSAGES.ERROR_GENERIC';
          if (err.message === 'DUPLICADO' || err.code === '23505') {
            msgKey = 'MANAGEMENT_SERVICES.MESSAGES.ERROR_DUPLICATE';
          }
          return this.translate.get(msgKey).pipe(map((text) => ({ type: 'error' as const, text })));
        }),
        finalize(() => {
          this.isLoading.set(false);
          this.cd.markForCheck();
        }),
      )
      .subscribe((resultado) => {
        this.messageService.showMessage(resultado.text, resultado.type);
        if (resultado.type === 'success') {
          this.resetForm();
        }
        this.cd.markForCheck();
      });
  }

  onEdit(servicio: ServiceModel) {
    this.isEditing = true;
    this.currentServiceId = servicio.id_servicio!;
    this.serviceFormular.patchValue({
      name: servicio.nombre,
      type: servicio.tipo_servicio,
      description: servicio.descripcion,
    });
  }

  async onDelete(id: string) {
    if (this.isLoading()) return;

    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    const dialogRef = this.dialog.open(Cancelmodal, {
      data: { mode: 'eliminarAdminGlobal' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
      maxHeight: '90vh',
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
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
                .pipe(map((text) => ({ type: 'success' as const, text }))),
            ),
            catchError(() =>
              this.translate
                .get('MANAGEMENT_SERVICES.MESSAGES.ERROR_DELETE')
                .pipe(map((text) => ({ type: 'error' as const, text }))),
            ),
          ),
        ),
      )
      .subscribe({
        next: (resultado) => {
          this.messageService.showMessage(resultado.text, resultado.type);
        },
      });
  }

  resetForm() {
    this.isEditing = false;
    this.currentServiceId = null;
    this.serviceFormular.reset();
  }

  toFilter(valor: string) {
    this.dataSource.filter = valor.trim().toLowerCase();
  }

  getCtrl(name: string) {
    return this.serviceFormular.get(name) as FormControl;
  }
}
