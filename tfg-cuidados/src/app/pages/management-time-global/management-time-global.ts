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
import { switchMap, throwError, map, catchError, of, filter, tap } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { week_days, tranlsate_days, validDays } from '../../core/constants/week_days';
import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { Buttonback } from '../../components/buttonback/buttonback';
import { TimeService } from '../../services/time.service';
import { MessageService } from '../../services/message-service';
import { HorarioModel } from '../../models/TimeModel';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ResponsiveSize } from '../../services/responsive-size';
import { finalize } from 'rxjs';
import { signal } from '@angular/core';

@Component({
  selector: 'app-management-time-global',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    Inputs,
    ButtonComponent,
    Buttonback,
    TranslateModule,
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
  public week_days: { valor: string; label: string }[] = week_days;
  public days_translate: { [key: string]: string } = tranlsate_days;
  public isLoading = signal(false);
  private responsive = inject(ResponsiveSize);

  isEditing: boolean = false;
  currentTimeId: string | null = null;

  timeFormular = this.fb.group({
    hora: this.fb.control<string>('', [Validators.required]),
    dia: this.fb.control<string>('', [Validators.required]),
  });

  dataSource = new MatTableDataSource<HorarioModel>([]);
  displayedColumns: string[] = ['hora', 'dia', 'acciones'];

  ngOnInit() {
    this.timeService
      .getTimesObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.dataSource.data = data;
        this.cd.markForCheck();
      });
  }

  onSave() {
    if (this.timeFormular.invalid) {
      this.timeFormular.markAllAsTouched();
      this.showMessageTraducido('MANAGEMENT_SCHEDULES.MESSAGES.FILL_FIELDS', 'error');
      return;
    }

    if (this.isLoading()) return;

    const rawValue = this.timeFormular.getRawValue();
    const hora = rawValue.hora ?? '';
    const dia = rawValue.dia ?? '';
    const user = this.authService.currentUser();

    if (!user || !user.id_usuario) return;

    if (!validDays.includes(dia.toLowerCase())) {
      this.showMessageTraducido('MANAGEMENT_SCHEDULES.MESSAGES.INVALID_DAY', 'error');
      return;
    }

    const [timeStr, minutesStr] = hora.split(':');
    const h = parseInt(timeStr, 10);
    const m = parseInt(minutesStr, 10);

    if (isNaN(h) || h < 0 || h > 23) {
      this.showMessageTraducido('MANAGEMENT_SCHEDULES.MESSAGES.INVALID_TIME_RANGE', 'error');
      return;
    }
    if (m !== 0 && m !== 30) {
      this.showMessageTraducido('MANAGEMENT_SCHEDULES.MESSAGES.INVALID_MINUTES', 'error');
      return;
    }

    this.isLoading.set(true);

    const excludeId = this.isEditing && this.currentTimeId ? this.currentTimeId : undefined;

    this.timeService
      .existsTime(dia, hora, excludeId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((existe) => {
          if (existe) return throwError(() => new Error('DUPLICADO'));

          const payload: HorarioModel = {
            dia_semana: dia as any,
            hora: hora,
            id_admin: user.id_usuario,
          };

          return this.isEditing && this.currentTimeId
            ? this.timeService.updateTime(this.currentTimeId, payload)
            : this.timeService.insertTime(payload);
        }),
        switchMap(() => {
          const msgKey = this.isEditing
            ? 'MANAGEMENT_SCHEDULES.MESSAGES.SUCCESS_UPDATE'
            : 'MANAGEMENT_SCHEDULES.MESSAGES.SUCCESS_CREATE';
          return this.translate.get(msgKey).pipe(map((text) => ({ type: 'success' as const, text })));
        }),
        catchError((err) => {
          let msgKey = 'MANAGEMENT_SCHEDULES.MESSAGES.ERROR_GENERIC';
          let params = {};
          if (err.message === 'DUPLICADO') {
            msgKey = 'MANAGEMENT_SCHEDULES.MESSAGES.ERROR_DUPLICATE';
            params = { dia, hora };
          }
          return this.translate
            .get(msgKey, params)
            .pipe(map((text) => ({ type: 'error' as const, text })));
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
      });
  }

  onEdit(horario: HorarioModel) {
    this.isEditing = true;
    this.currentTimeId = horario.id_horario!;
    this.timeFormular.patchValue({
      hora: horario.hora,
      dia: horario.dia_semana,
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
          this.timeService.deleteTime(id).pipe(
            finalize(() => {
              this.isLoading.set(false);
              this.cd.markForCheck();
            }),
            switchMap(() =>
              this.translate
                .get('MANAGEMENT_GLOBAL.DELETE')
                .pipe(map((text) => ({ type: 'success' as const, text }))),
            ),
            catchError(() =>
              this.translate
                .get('MANAGEMENT_SCHEDULES.MESSAGES.ERROR_DELETE')
                .pipe(map((text) => ({ type: 'error' as const, text }))),
            ),
          ),
        ),
      )
      .subscribe((res) => {
        this.messageService.showMessage(res.text, res.type);
      });
  }

  resetForm() {
    this.isEditing = false;
    this.currentTimeId = null;
    this.timeFormular.reset();
    this.timeFormular.get('dia')?.setValue('');
    this.cd.markForCheck();
  }
  private showMessageTraducido(key: string, type: 'error' | 'success') {
    this.translate.get(key).subscribe((res) => {
      this.messageService.showMessage(res, type);
    });
  }

  getCtrl(name: string) {
    return this.timeFormular.get(name) as FormControl;
  }
}
