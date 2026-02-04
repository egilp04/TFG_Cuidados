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
import { switchMap, throwError, map, catchError, of, filter } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Inputs } from '../../components/inputs/inputs';
import { ButtonComponent } from '../../components/button/button';
import { Buttonback } from '../../components/buttonback/buttonback';
import { TimeService } from '../../services/time.service';
import { MessageService } from '../../services/message-service';
import { HorarioModel } from '../../models/Horario';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { Cancelmodal } from '../../components/cancelmodal/cancelmodal';
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
export class ManagementTimeGlobal implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  private timeService = inject(TimeService);
  public messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  isEditing: boolean = false;
  currentTimeId: string | null = null;

  horarioForm: FormGroup = this.fb.group({
    hora: ['', [Validators.required]],
    dia: ['', [Validators.required]],
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
    if (this.horarioForm.invalid) {
      this.horarioForm.markAllAsTouched();
      this.showMessageTraducido('MANAGEMENT_SCHEDULES.MESSAGES.FILL_FIELDS', 'error');
      return;
    }
    const { hora, dia } = this.horarioForm.getRawValue();
    const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const user = this.authService.currentUser();

    if (!user || !user.id_usuario) return;

    if (!diasValidos.includes(dia.toLowerCase())) {
      this.showMessageTraducido('MANAGEMENT_SCHEDULES.MESSAGES.INVALID_DAY', 'error');
      return;
    }
    const [horasStr, minutosStr] = hora.split(':');
    const h = parseInt(horasStr, 10);
    const m = parseInt(minutosStr, 10);
    if (isNaN(h) || h < 0 || h > 23) {
      this.showMessageTraducido('MANAGEMENT_SCHEDULES.MESSAGES.INVALID_TIME_RANGE', 'error');
      return;
    }
    if (m !== 0 && m !== 30) {
      this.showMessageTraducido('MANAGEMENT_SCHEDULES.MESSAGES.INVALID_MINUTES', 'error');
      return;
    }
    const idExcluir = this.isEditing && this.currentTimeId ? this.currentTimeId : undefined;
    this.timeService
      .existsTime(dia, hora, idExcluir)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((existe) => {
          if (existe) return throwError(() => new Error('DUPLICADO'));

          if (this.isEditing && this.currentTimeId) {
            return this.timeService.updateTime(this.currentTimeId, {
              dia_semana: dia,
              hora: hora,
            });
          } else {
            return this.timeService.insertTime({
              id_admin: user.id_usuario,
              dia_semana: dia,
              hora: hora,
            });
          }
        }),
        switchMap(() => {
          const msgKey = this.isEditing
            ? 'MANAGEMENT_SCHEDULES.MESSAGES.SUCCESS_UPDATE'
            : 'MANAGEMENT_SCHEDULES.MESSAGES.SUCCESS_CREATE';

          return this.translate.get(msgKey).pipe(map((text) => ({ type: 'exito' as const, text })));
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
      )
      .subscribe((resultado) => {
        this.messageService.showMessage(resultado.text, resultado.type);
        if (resultado.type === 'exito') {
          this.resetForm();
        }
        this.cd.markForCheck();
      });
  }

  onEdit(horario: HorarioModel) {
    this.isEditing = true;
    this.currentTimeId = horario.id_horario!;
    this.horarioForm.patchValue({
      hora: horario.hora,
      dia: horario.dia_semana,
    });
  }

  isMobile = window.innerWidth < 768;
  onDelete(id: string) {
    const dialogRef = this.dialog.open(Cancelmodal, {
      data: { modo: 'eliminarAdminGlobal' },
      width: '100%',
      maxWidth: this.isMobile ? '95vw' : '500px',
    });

    dialogRef
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => result === true),
        switchMap(() =>
          this.timeService.deleteTime(id).pipe(
            switchMap(() =>
              this.translate
                .get('MANAGEMENT_GLOBAL.DELETE')
                .pipe(map((text) => ({ type: 'exito' as const, text }))),
            ),
            catchError(() =>
              this.translate
                .get('MANAGEMENT_SCHEDULES.MESSAGES.ERROR_DELETE')
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
    this.currentTimeId = null;
    this.horarioForm.reset();
    this.horarioForm.get('dia')?.setValue('');
    this.cd.markForCheck();
  }
  private showMessageTraducido(key: string, type: 'error' | 'exito') {
    this.translate.get(key).subscribe((res) => {
      this.messageService.showMessage(res, type);
    });
  }

  getCtrl(name: string) {
    return this.horarioForm.get(name) as FormControl;
  }
}
