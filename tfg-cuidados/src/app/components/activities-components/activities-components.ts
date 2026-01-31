import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  inject,
  computed,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { ButtonComponent } from '../button/button';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-activities-components',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    CommonModule,
    ButtonComponent,
    TranslateModule,
  ],
  templateUrl: './activities-components.html',
  styleUrl: './activities-components.css',
})
export class ActivitiesComponents implements OnInit {
  private authService = inject(AuthService);

  @Output() onCancelContract = new EventEmitter<string>();
  @Input() dataSource: any[] = [];

  displayedColumns: string[] = ['usuario', 'nombre', 'dia', 'hora', 'lugar', 'acciones'];
  dataSourceTable = new MatTableDataSource<any>([]);
  rol = this.authService.userRol();

  public headerContrato = computed(() => {
    if (this.rol === 'cliente') return 'ACTIVITIES.TABLE.HEADER_COMPANY';
    if (this.rol === 'empresa') return 'ACTIVITIES.TABLE.HEADER_CLIENT';
    return 'ACTIVITIES.TABLE.HEADER_USER';
  });
  public weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  public displayDate = new Date();
  public monthDays: (number | null)[] = [];
  public eventosMap: { [key: string]: any[] } = {};
  private diasSemanaNombres = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];

  ngOnInit(): void {
    this.generateCalendar();
    this.updateTable();
    this.precalcularEventosDelMes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSource']) {
      this.generateCalendar();
      this.updateTable();
      this.precalcularEventosDelMes();
    }
  }

  private updateTable() {
    if (!this.dataSource || this.dataSource.length === 0) {
      this.dataSourceTable.data = [];
      return;
    }

    const dataMapeada = this.dataSource.map((contrato) => {
      let nombreAMostrar;
      if (this.rol == 'cliente') nombreAMostrar = contrato.Empresa?.nombreDeLaEmpresa;
      if (this.rol == 'empresa') nombreAMostrar = contrato.Cliente?.nombreDelCliente;
      const lugar = `${contrato.Cliente?.direccion}, ${contrato.Cliente?.localidad}, ${contrato.Cliente?.codpostal}`;
      return {
        ...contrato,
        nombreAMostrar: nombreAMostrar || 'N/A',
        lugar: lugar,
      };
    });
    this.dataSourceTable.data = dataMapeada;
  }

  private precalcularEventosDelMes() {
    this.eventosMap = {};
    if (!this.dataSource) return;

    const year = this.displayDate.getFullYear();
    const month = this.displayDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.dataSource.forEach((contrato) => {
      const fechaInicio = new Date(contrato.fecha_inicio);
      const fechaFin = contrato.fecha_fin ? new Date(contrato.fecha_fin) : new Date(2100, 0, 1);
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin.setHours(23, 59, 59, 999);
      const diaContratadoStr = (contrato.dia_semana_contratado || '').toLowerCase().trim();
      for (let d = 1; d <= daysInMonth; d++) {
        const fechaEvaluar = new Date(year, month, d);
        const indiceDia = fechaEvaluar.getDay();
        const nombreDiaCalendario = this.diasSemanaNombres[indiceDia].toLowerCase();
        if (
          fechaEvaluar >= fechaInicio &&
          fechaEvaluar <= fechaFin &&
          diaContratadoStr === nombreDiaCalendario
        ) {
          const key = `${year}-${month}-${d}`;
          if (!this.eventosMap[key]) {
            this.eventosMap[key] = [];
          }
          this.eventosMap[key].push(contrato);
        }
      }
    });
  }

  public generateCalendar() {
    const year = this.displayDate.getFullYear();
    const month = this.displayDate.getMonth();
    const firstDayInSelectedMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDayInSelectedMonth).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    this.monthDays = days;
  }

  public cambiarMes(delta: number) {
    this.displayDate = new Date(
      this.displayDate.getFullYear(),
      this.displayDate.getMonth() + delta,
      1,
    );
    this.generateCalendar();
    this.precalcularEventosDelMes();
  }

  getEventosDia(dia: number): any[] {
    const key = `${this.displayDate.getFullYear()}-${this.displayDate.getMonth()}-${dia}`;
    return this.eventosMap[key] || [];
  }

  onCancel(id: string) {
    this.onCancelContract.emit(id);
  }

  selectedDia: number | null = null;
  manejarClickDia(dia: number, eventos: any[]) {
    if (eventos.length === 0) return;
    if (this.selectedDia === dia) {
      this.selectedDia = null;
    } else {
      this.selectedDia = dia;
    }
  }
}
