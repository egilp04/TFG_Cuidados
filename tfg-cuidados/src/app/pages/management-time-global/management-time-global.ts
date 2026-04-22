import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { switchMap, throwError, map, catchError, filter, tap, finalize } from 'rxjs';
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

/**
 * Component for global time and schedule management by administrators.
 * Handles the creation, update, and deletion of time slots available in the system.
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
  private responsive = inject(ResponsiveSize);

  public weekDaysList: { valor: string; label: string }[] = week_days;
  public daysTranslationMap: Record<string, string> = tranlsate_days;
  public isLoading = signal(false);

  public isEditing = false;
  public currentTimeId: string | null = null;

  public timeForm = this.fb.group({
    time: this.fb.control<string>('', [Validators.required]),
    day: this.fb.control<string>('', [Validators.required]),
  });

  public dataSource = new MatTableDataSource<TimeModel>([]);
  public displayedColumns: string[] = ['time', 'day', 'actions'];

  ngOnInit(): void {
    this.loadTimes();
  }

  /**
   * Subscribes to the global times stream to populate the management table.
   */
  private loadTimes(): void {
    this.timeService
      .getTimesObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: TimeModel[]) => {
        this.dataSource.data = data;
        this.cd.markForCheck();
      });
  }

  /**
   * Processes the form submission to either create a new time slot or update an existing one.
   * Performs validation for duplicate entries and time ranges.
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

          const payload: TimeModel = {
            week_day: dayValue as any,
            time: timeValue,
            id_admin: user.id_user,
          };

          return this.isEditing && this.currentTimeId
            ? this.timeService.updateTime(this.currentTimeId, payload)
            : this.timeService.insertTime(payload);
        }),
        switchMap(() => {
          const msgKey = this.isEditing
            ? 'MANAGEMENT_SCHEDULES.MESSAGES.SUCCESS_UPDATE'
            : 'MANAGEMENT_SCHEDULES.MESSAGES.SUCCESS_CREATE';
          return this.translate.get(msgKey).pipe(map((text: string) => ({ type: 'success' as const, text })));
        }),
        catchError((err: Error) => {
          let msgKey = 'MANAGEMENT_SCHEDULES.MESSAGES.ERROR_GENERIC';
          let params = {};
          
          if (err.message === 'DUPLICATE_TIME') {
            msgKey = 'MANAGEMENT_SCHEDULES.MESSAGES.ERROR_DUPLICATE';
            params = { day: dayValue, time: timeValue };
          }
          
          return this.translate
            .get(msgKey, params)
            .pipe(map((text: string) => ({ type: 'error' as const, text })));
        }),
        finalize(() => {
          this.isLoading.set(false);
          this.cd.markForCheck();
        })
      )
      .subscribe((result) => {
        this.messageService.showMessage(result.text, result.type);
        if (result.type === 'success') {
          this.resetForm();
        }
      });
  }

  /**
   * Prepares the form for editing an existing time slot.
   * @param timeSlot The time record to be edited.
   */
  editTime(timeSlot: TimeModel): void {
    this.isEditing = true;
    this.currentTimeId = timeSlot.id_time!;
    this.timeForm.patchValue({
      time: timeSlot.time,
      day: timeSlot.week_day,
    });
    this.cd.markForCheck();
  }

  /**
   * Opens a confirmation modal and deletes the specified time slot.
   * @param id The unique identifier of the time record.
   */
  async deleteTime(id: string): Promise<void> {
    if (this.isLoading()) return;

    const { Cancelmodal } = await import('../../components/cancelmodal/cancelmodal');
    const dialogRef = this.dialog.open(Cancelmodal, {
      data: { mode: 'deleteGlobalAdmin' },
      width: '100%',
      maxWidth: this.responsive.isMobile() ? '95vw' : '500px',
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
          this.timeService.deleteTime(id).pipe(
            finalize(() => {
              this.isLoading.set(false);
              this.cd.markForCheck();
            }),
            switchMap(() =>
              this.translate
                .get('MANAGEMENT_GLOBAL.DELETE_SUCCESS')
                .pipe(map((text: string) => ({ type: 'success' as const, text })))
            ),
            catchError(() =>
              this.translate
                .get('MANAGEMENT_SCHEDULES.MESSAGES.ERROR_DELETE')
                .pipe(map((text: string) => ({ type: 'error' as const, text })))
            )
          )
        )
      )
      .subscribe((res) => {
        this.messageService.showMessage(res.text, res.type);
      });
  }

  /**
   * Resets the form state and clears any editing context.
   */
  resetForm(): void {
    this.isEditing = false;
    this.currentTimeId = null;
    this.timeForm.reset({
      time: '',
      day: ''
    });
    this.cd.markForCheck();
  }

  /**
   * Fetches a translated message and displays it via the message service.
   */
  private showTranslatedMessage(key: string, type: 'error' | 'success'): void {
    this.translate.get(key).subscribe((res: string) => {
      this.messageService.showMessage(res, type);
    });
  }

  /**
   * Utility method to get form controls.
   */
  getCtrl(name: string): FormControl {
    return this.timeForm.get(name) as FormControl;
  }
}