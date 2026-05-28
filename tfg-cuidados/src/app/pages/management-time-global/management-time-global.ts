import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { switchMap, throwError, map, catchError, filter, tap, finalize, delay } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { week_days, tranlsate_days, validDays } from '../../core/constants/week_days';
import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { Buttonback } from '../../components/buttonback/buttonback';
import { TimeService } from '../../services/time.service';
import { MessageService } from '../../services/message-service';
import { TimeModel } from '../../models/TimeModel';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ResponsiveSize } from '../../services/responsive-size';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Searchbar } from '../../components/searchbar/searchbar';
import { MatSort, MatSortModule } from '@angular/material/sort';

/**
 * Componente para la gestión global de horarios por administradores.
 * Maneja la creación, actualización y eliminación de franjas horarias disponibles en el sistema.
 */
@Component({
  selector: 'app-management-time-global',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    Inputs,
    ButtonComponent,
    Searchbar,
    ReactiveFormsModule,
    MatPaginatorModule,
    Buttonback,
    TranslateModule,
    MatSortModule,
  ],
  templateUrl: './management-time-global.html',
  styleUrl: './management-time-global.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ManagementTimeGlobal implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private timeService = inject(TimeService);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private responsive = inject(ResponsiveSize);
  public controlFilterItem = new FormControl<string>('');

  public weekDaysList: { valor: string; label: string }[] = week_days;
  public daysTranslationMap: Record<string, string> = tranlsate_days;
  public isLoading = signal(false);

  public isEditing = false;
  public currentTimeId: string | null = null;
  public originalTimeSlot: TimeModel | null = null;
  private deletingIds = new Set<string>();

  public timeForm = this.fb.group({
    time: this.fb.control<string>('', [Validators.required]),
    day: this.fb.control<string>('', [Validators.required]),
  });

  public dataSource = new MatTableDataSource<TimeModel>([]);
  public displayedColumns: string[] = ['day', 'time', 'actions'];

  public paginator = viewChild(MatPaginator);
  public sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      const currentPaginator = this.paginator();
      if (currentPaginator) {
        this.dataSource.paginator = currentPaginator;
      }
      const currentSort = this.sort();
      if (currentSort) {
        this.dataSource.sort = currentSort;
        this.dataSource.sortingDataAccessor = (item: any, property: string) => {
          switch (property) {
            case 'time':
              return item.time || '';
            case 'day':
              const dayWeights: { [key: string]: number } = {
                monday: 1,
                lunes: 1,
                tuesday: 2,
                martes: 2,
                wednesday: 3,
                miércoles: 3,
                miercoles: 3,
                thursday: 4,
                jueves: 4,
                friday: 5,
                viernes: 5,
                saturday: 6,
                sábado: 6,
                sabado: 6,
                sunday: 7,
                domingo: 7,
              };
              const dayStr = item.week_day?.toLowerCase() || '';
              return dayWeights[dayStr] || 99;
            default:
              return item[property];
          }
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadTimes();
  }

  /**
   * Aplica un filtro a la tabla de datos.
   * @param value Cadena de búsqueda.
   */
  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /**
   * Se suscribe al flujo global de horarios para llenar la tabla de gestión.
   */
  private loadTimes(): void {
    this.timeService
      .getTimesObservable()
      .pipe(takeUntilDestroyed(this.destroyRef), delay(100))
      .subscribe((data: TimeModel[]) => {
        this.dataSource.data = data;
        const paginatorInner = this.dataSource.paginator;
        if (paginatorInner) {
          const totalPaginas = Math.ceil(data.length / paginatorInner.pageSize);
          if (paginatorInner.pageIndex >= totalPaginas && data.length > 0) {
            paginatorInner.firstPage();
          }
        }
        this.cd.detectChanges();
      });
  }

  /**
   * Procesa el envío del formulario para crear una nueva franja horaria o actualizar una existente.
   * Realiza validación de entradas duplicadas, rangos de horarios, dependencias activas,
   * y bloquea peticiones si no hay cambios reales.
   */
  saveTime(): void {
    if (this.timeForm.invalid) {
      this.timeForm.markAllAsTouched();
      this.showTranslatedMessage('MANAGEMENT_SCHEDULES.MESSAGES.FILL_FIELDS', 'error');
      return;
    }
    if (this.isLoading()) return;
    const rawValue = this.timeForm.getRawValue();
    const timeValue = rawValue.time ?? '';
    const dayValue = rawValue.day ?? '';
    const user = this.authService.currentUser();
    if (!user?.id_user) return;
    if (this.isEditing && this.originalTimeSlot) {
      const timeChanged = timeValue !== this.originalTimeSlot.time;
      const dayChanged = dayValue !== this.originalTimeSlot.week_day;
      if (!timeChanged && !dayChanged) {
        this.showTranslatedMessage('MANAGEMENT_SCHEDULES.MESSAGES.NO_CHANGES', 'success');
        this.resetForm();
        return;
      }
    }

    if (!validDays.includes(dayValue.toLowerCase())) {
      this.showTranslatedMessage('MANAGEMENT_SCHEDULES.MESSAGES.INVALID_DAY', 'error');
      return;
    }
    const [hoursStr, minutesStr] = timeValue.split(':');
    const h = parseInt(hoursStr, 10);
    const m = parseInt(minutesStr, 10);

    if (isNaN(h) || h < 0 || h > 23) {
      this.showTranslatedMessage('MANAGEMENT_SCHEDULES.MESSAGES.INVALID_TIME_RANGE', 'error');
      return;
    }

    if (m !== 0 && m !== 30) {
      this.showTranslatedMessage('MANAGEMENT_SCHEDULES.MESSAGES.INVALID_MINUTES', 'error');
      return;
    }
    this.isLoading.set(true);
    const excludeId = this.isEditing && this.currentTimeId ? this.currentTimeId : undefined;

    this.timeService
      .existsTime(dayValue, timeValue, excludeId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((exists: boolean) => {
          if (exists) return throwError(() => new Error('DUPLICATE_TIME'));

          if (this.isEditing && this.currentTimeId) {
            return this.timeService.hasActiveServiceTimes(this.currentTimeId).pipe(
              switchMap((hasDependencies) => {
                if (hasDependencies) {
                  return throwError(() => new Error('HAS_DEPENDENCIES'));
                }

                const payload: Partial<TimeModel> = {
                  week_day: dayValue as any,
                  time: timeValue,
                };

                return this.timeService.updateTime(this.currentTimeId!, payload);
              }),
            );
          } else {
            const payload: TimeModel = {
              week_day: dayValue as any,
              time: timeValue,
              id_admin: user.id_user,
            };
            return this.timeService.insertTime(payload);
          }
        }),
        switchMap(() => {
          const msgKey = this.isEditing
            ? 'MANAGEMENT_SCHEDULES.MESSAGES.SUCCESS_UPDATE'
            : 'MANAGEMENT_SCHEDULES.MESSAGES.SUCCESS_CREATE';
          return this.translate
            .get(msgKey)
            .pipe(map((text: string) => ({ type: 'success' as const, text })));
        }),
        catchError((err: Error) => {
          let msgKey = 'MANAGEMENT_SCHEDULES.MESSAGES.ERROR_GENERIC';
          let params = {};

          if (err.message === 'DUPLICATE_TIME') {
            msgKey = 'MANAGEMENT_SCHEDULES.MESSAGES.ERROR_DUPLICATE';
            params = { day: dayValue, time: timeValue };
          } else if (err.message === 'HAS_DEPENDENCIES') {
            msgKey = 'MANAGEMENT_SCHEDULES.MESSAGES.ERROR_HAS_OFFERS';
          }
          return this.translate
            .get(msgKey, params)
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
          this.timeService.refreshTimes();
        }
      });
  }

  /**
   * Prepara el formulario para editar una franja horaria existente.
   * @param timeSlot El registro de tiempo a editar.
   */
  editTime(timeSlot: TimeModel): void {
    if (this.deletingIds.has(timeSlot.id_time!)) return;

    this.isEditing = true;
    this.currentTimeId = timeSlot.id_time!;
    this.originalTimeSlot = timeSlot;
    this.timeForm.patchValue({
      time: timeSlot.time,
      day: timeSlot.week_day,
    });
    this.cd.markForCheck();
  }

  /**
   * Abre una modal de confirmación y elimina la franja horaria especificada.
   * @param id El identificador único del registro de tiempo.
   */
  async deleteTime(id: string): Promise<void> {
    if (this.isLoading() || this.deletingIds.has(id)) return;

    this.timeService
      .hasActiveServiceTimes(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (hasDependencies) => {
        if (hasDependencies) {
          this.showTranslatedMessage('MANAGEMENT_SCHEDULES.MESSAGES.ERROR_HAS_OFFERS', 'error');
          return;
        }

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
            filter((result) => result === true),
            tap(() => {
              this.deletingIds.add(id);
              this.cd.markForCheck();

              if (this.currentTimeId === id) this.resetForm();
            }),
            switchMap(() =>
              this.timeService.deleteTime(id).pipe(
                switchMap(() =>
                  this.translate
                    .get('MANAGEMENT_GLOBAL.DELETE')
                    .pipe(map((text: string) => ({ type: 'success' as const, text }))),
                ),
                catchError(() =>
                  this.translate
                    .get('MANAGEMENT_SCHEDULES.MESSAGES.ERROR_DELETE')
                    .pipe(map((text: string) => ({ type: 'error' as const, text }))),
                ),
              ),
            ),
          )
          .subscribe((res: any) => {
            this.deletingIds.delete(id);

            if (res.type === 'success') {
              const currentData = this.dataSource.data;
              this.dataSource.data = currentData.filter((item) => item.id_time !== id);

              this.messageService.showMessage(res.text || 'Horario eliminado', 'success');
            } else {
              this.messageService.showMessage(res.text || 'Error', 'error');
            }
            this.cd.markForCheck();
          });
      });
  }
  /**
   * Reinicia el estado del formulario y limpia cualquier contexto de edición.
   */
  resetForm(): void {
    this.isEditing = false;
    this.currentTimeId = null;
    this.originalTimeSlot = null;
    this.timeForm.reset({
      time: '',
      day: '',
    });
    this.cd.markForCheck();
  }

  /**
   * Obtiene un mensaje traducido y lo muestra a través del servicio de mensajes.
   */
  private showTranslatedMessage(key: string, type: 'error' | 'success'): void {
    this.translate.get(key).subscribe((res: string) => {
      this.messageService.showMessage(res, type);
    });
  }

  /**
   * Método auxiliar para obtener controles de formulario.
   */
  getCtrl(name: string): FormControl {
    return this.timeForm.get(name) as FormControl;
  }

  isDeleting(id: string): boolean {
    return this.deletingIds.has(id);
  }

  /**
   * Evita que la tabla parpadee al recargar los datos
   */
  trackById(index: number, item: TimeModel): string {
    return item.id_time!;
  }
}
