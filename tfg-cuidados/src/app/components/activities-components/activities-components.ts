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
import { Contractmodel, ContractRowDataTable } from '../../models/Acitvities-component';
import { ContratoDetalle } from '../../models/ContractModel';

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
  @Input() dataSource: ContratoDetalle[] = [];

  displayedColumns: string[] = ['usuario', 'nombre', 'dia', 'hora', 'lugar', 'acciones'];
  dataSourceTable = new MatTableDataSource<ContractRowDataTable>([]);
  rol = this.authService.userRol();

  public headerContrato = computed(() => {
    if (this.rol === 'cliente') return 'ACTIVITIES.TABLE.HEADER_COMPANY';
    if (this.rol === 'empresa') return 'ACTIVITIES.TABLE.HEADER_CLIENT';
    return 'ACTIVITIES.TABLE.HEADER_USER';
  });
  public weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  public displayDate = new Date();
  public monthDays: (number | null)[] = [];
  public mapWithEvents: { [key: string]: ContractRowDataTable[] } = {};
  private daysOfWeekNames = [
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
    this.preCalculateMonthEvents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSource']) {
      this.generateCalendar();
      this.updateTable();
      this.preCalculateMonthEvents();
    }
  }

  private updateTable() {
    if (!this.dataSource || this.dataSource.length === 0) {
      this.dataSourceTable.data = [];
      return;
    }

    const mappedData = this.dataSource.map((contrato) => {
      let nombreAMostrar;
      if (this.rol == 'cliente') nombreAMostrar = contrato.Empresa?.nombreDeLaEmpresa;
      if (this.rol == 'empresa') nombreAMostrar = contrato.Cliente?.nombreDelCliente;
      const lugar = `${contrato.Cliente?.direccion}, ${contrato.Cliente?.localidad}, ${contrato.Cliente?.codpostal}`;
      return {
        ...contrato,
        nombreAMostrar: nombreAMostrar || 'N/A',
        lugar: lugar || 'SL',
      };
    });
    this.dataSourceTable.data = mappedData;
  }

  private preCalculateMonthEvents() {
    this.mapWithEvents = {};

    const processedData = this.dataSourceTable.data;
    if (!processedData || processedData.length === 0) return;

    const year = this.displayDate.getFullYear();
    const month = this.displayDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    processedData.forEach((contrato) => {
      const startDate = new Date(contrato.fecha_inicio);
      const endDate = contrato.fecha_fin ? new Date(contrato.fecha_fin) : new Date(2100, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const foundDayStr = (contrato.dia_semana_contratado || '').toLowerCase().trim();
      for (let d = 1; d <= daysInMonth; d++) {
        const evaluatingDate = new Date(year, month, d);
        const dateIndex = evaluatingDate.getDay();
        const calendarDayName = this.daysOfWeekNames[dateIndex].toLowerCase();
        if (
          evaluatingDate >= startDate &&
          evaluatingDate <= endDate &&
          foundDayStr === calendarDayName
        ) {
          const key = `${year}-${month}-${d}`;
          if (!this.mapWithEvents[key]) {
            this.mapWithEvents[key] = [];
          }
          this.mapWithEvents[key].push(contrato);
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

  public changeMonth(delta: number) {
    this.displayDate = new Date(
      this.displayDate.getFullYear(),
      this.displayDate.getMonth() + delta,
      1,
    );
    this.generateCalendar();
    this.preCalculateMonthEvents();
  }

  getEventosDia(dia: number): ContractRowDataTable[] {
    const key = `${this.displayDate.getFullYear()}-${this.displayDate.getMonth()}-${dia}`;
    return this.mapWithEvents[key] || [];
  }

  onCancel(id: string) {
    this.onCancelContract.emit(id);
  }

  selectedDia: number | null = null;
  manejarClickDia(dia: number, eventos: ContractRowDataTable[]) {
    if (eventos.length === 0) return;
    if (this.selectedDia === dia) {
      this.selectedDia = null;
    } else {
      this.selectedDia = dia;
    }
  }
}
