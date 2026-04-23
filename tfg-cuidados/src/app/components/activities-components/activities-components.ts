import {
  Component,
  OnInit,
  Input,
  OnChanges,
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
import { ContractRowDataTable } from '../../models/Acitvities-component';
import { ContractDetail } from '../../models/ContractModel';

/**
 * Componente hijo que renderiza un calendario mensual y una tabla de datos de servicios contratados.
 */
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
export class ActivitiesComponents implements OnInit, OnChanges {
  private authService = inject(AuthService);

  @Input() dataSource: ContractDetail[] = [];
  @Output() onCancelContract = new EventEmitter<string>();

  public displayedColumns: string[] = ['user', 'service', 'day', 'time', 'location', 'actions'];
  public tableDataSource = new MatTableDataSource<ContractRowDataTable>([]);
  public userRole = this.authService.userRol();

  public contractHeader = computed(() => {
    if (this.userRole === 'client') return 'ACTIVITIES.TABLE.HEADER_BUSINESS';
    if (this.userRole === 'business') return 'ACTIVITIES.TABLE.HEADER_CLIENT';
    return 'ACTIVITIES.TABLE.HEADER_USER';
  });

  public weekDays = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];
  public displayDate = new Date();
  public monthDays: (number | null)[] = [];
  public eventsMap: Record<string, ContractRowDataTable[]> = {};

  private weekDayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  ngOnInit(): void {
    this.refreshActivityData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataSource']) {
      this.refreshActivityData();
    }
  }

  private refreshActivityData(): void {
    this.generateCalendar();
    this.updateTableDataSource();
    this.calculateMonthEvents();
  }

  /**
   * Actualiza la fuente de datos de la tabla mapeando contratos con información de ubicación.
   */
  private updateTableDataSource(): void {
    if (!this.dataSource || this.dataSource.length === 0) {
      this.tableDataSource.data = [];
      return;
    }

    const mappedData = this.dataSource.map((contract) => {
      let nameToShow: string | undefined;
      if (this.userRole === 'client') nameToShow = contract.Business?.businessName;
      if (this.userRole === 'business') nameToShow = contract.Client?.clientName;

      const place = contract.Client
        ? `${contract.Client.address}, ${contract.Client.city}, ${contract.Client.postcode}`
        : 'SL';
      return {
        ...contract,
        nameToShow: nameToShow || 'N/A',
        place: place,
      } as ContractRowDataTable;
    });

    this.tableDataSource.data = mappedData;
  }

  /**
   * Calcula qué eventos (contratos) ocurren en cada día del mes mostrado.
   * Filtra por rango de fechas y día de la semana contratado.
   */
  private calculateMonthEvents(): void {
    this.eventsMap = {};
    const processedData = this.tableDataSource.data;
    if (!processedData || processedData.length === 0) return;
    const year = this.displayDate.getFullYear();
    const month = this.displayDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    processedData.forEach((contract) => {
      const startDate = new Date(contract.start_date);
      const endDate = contract.end_date ? new Date(contract.end_date) : new Date(2100, 0, 1);

      const targetDay = (contract.week_day_hired || '').toLowerCase().trim();

      for (let d = 1; d <= daysInMonth; d++) {
        const currentDate = new Date(year, month, d);
        const dayIdx = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
        const dayName = this.weekDayNames[dayIdx];

        if (currentDate >= startDate && currentDate <= endDate && targetDay === dayName) {
          const key = `${year}-${month}-${d}`;
          if (!this.eventsMap[key]) this.eventsMap[key] = [];
          this.eventsMap[key].push(contract);
        }
      }
    });
  }

  /**
   * Genera la matriz de días para un calendario mensual.
   * Rellena días previos del mes anterior como nulos.
   */
  public generateCalendar(): void {
    const year = this.displayDate.getFullYear();
    const month = this.displayDate.getMonth();
    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysCount = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDayIndex).fill(null);
    for (let i = 1; i <= daysCount; i++) {
      days.push(i);
    }
    this.monthDays = days;
  }

  /**
   * Navega hacia adelante o atrás en el mes.
   * @param delta Número de meses a cambiar (+1 o -1).
   */
  public changeMonth(delta: number): void {
    this.displayDate = new Date(
      this.displayDate.getFullYear(),
      this.displayDate.getMonth() + delta,
      1,
    );
    this.refreshActivityData();
  }

  /**
   * Obtiene los eventos programados para un día específico.
   * @param day El número del día del mes.
   */
  public getDayEvents(day: number): ContractRowDataTable[] {
    const key = `${this.displayDate.getFullYear()}-${this.displayDate.getMonth()}-${day}`;
    return this.eventsMap[key] || [];
  }

  /**
   * Emite un evento de cancelación de contrato.
   * @param id El identificador del contrato.
   */
  public onCancel(id: string): void {
    this.onCancelContract.emit(id);
  }

  public selectedDay: number | null = null;

  /**
   * Alterna la selección de un día para mostrar/ocultar detalles de eventos.
   * @param day El número del día seleccionado.
   * @param events Los eventos que ocurren ese día.
   */
  public handleDayClick(day: number, events: ContractRowDataTable[]): void {
    if (events.length === 0) return;
    this.selectedDay = this.selectedDay === day ? null : day;
  }
}
