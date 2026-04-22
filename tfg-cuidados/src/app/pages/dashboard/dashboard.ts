import {
  Component,
  inject,
  OnInit,
  DestroyRef,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
import { ChartConfiguration, ChartData, Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

Chart.register(...registerables);

/**
 * Componente de panel de administrador.
 * Muestra métricas visuales de usuarios, contratos y rendimiento de servicios.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BaseChartDirective, CommonModule, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export default class Dashboard implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  public totalUsersCount = 0;
  public activeContractsCount = 0;
  public canceledContractsCount = 0;
  private timelineDates: Date[] = [];

  // --- Configuraciones de datos de gráficos ---

  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#60A5FA', '#ca165b'],
        hoverBackgroundColor: ['#93C5FD', '#e03e7d'],
        borderWidth: 0,
      },
    ],
  };

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        borderColor: '#17c448',
        tension: 0.4,
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: '', // Poblado vía traducción
        data: [],
        backgroundColor: '#17c448',
        borderRadius: 4,
      },
      {
        label: '', // Poblado vía traducción
        data: [],
        backgroundColor: '#60A5FA',
        borderRadius: 4,
      },
    ],
  };

  // --- Opciones de gráficos ---

  public doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: { legend: { display: false } },
  };

  public lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { display: false },
      x: { grid: { display: false }, border: { display: false } },
    },
    plugins: { legend: { display: false } },
  };

  public barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#9ca3af' } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      x: {
        grid: { display: true, color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#9ca3af' },
      },
    },
  };

  ngOnInit(): void {
    this.translateCharts();
    this.subscribeToAnalytics();
  }

  /**
   * Dispara manualmente una actualización para todos los gráficos en la vista.
   */
  private triggerChartsUpdate(): void {
    this.cd.markForCheck();
    this.charts?.forEach((chart) => chart.update());
  }

  /**
   * Actualiza las etiquetas de meses para el gráfico de línea según el idioma actual.
   */
  private updateMonthLabels(): void {
    if (this.timelineDates.length === 0) return;

    const currentLang = this.translate.currentLang || 'es';

    this.lineChartData.labels = this.timelineDates.map((date) => {
      const month = date.toLocaleString(currentLang, { month: 'short' });
      return month.charAt(0).toUpperCase() + month.slice(1);
    });

    this.triggerChartsUpdate();
  }

  /**
   * Escucha cambios de traducción para actualizar dinámicamente las etiquetas de gráficos.
   */
  private translateCharts(): void {
    this.translate
      .stream('DASHBOARD.CHART')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.doughnutChartData.labels = [res.ACTIVE, res.CANCELED];
        this.barChartData.datasets[0].label = res.DEMAND || 'Demanda';
        this.barChartData.datasets[1].label = res.SUPPLY || 'Oferta';
        this.updateMonthLabels();
      });
  }

  /**
   * Se suscribe a los observables del servicio de análisis para poblar las métricas.
   */
  private subscribeToAnalytics(): void {
    this.analyticsService
      .getUsuariosCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.totalUsersCount = count;
        this.cd.markForCheck();
      });

    this.analyticsService
      .getContractStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        this.activeContractsCount = stats.activeContract;
        this.canceledContractsCount = stats.cancelContract;
        this.doughnutChartData.datasets[0].data = [stats.activeContract, stats.cancelContract];
        this.triggerChartsUpdate();
      });

    this.analyticsService
      .fetchMonthlyUsersRecords()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((records) => {
        this.lineChartData.datasets[0].data = records.data;
        this.timelineDates = records.labels;
        this.updateMonthLabels();
      });

    this.analyticsService
      .getServicesStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        this.barChartData.labels = stats.labels;
        this.barChartData.datasets[0].data = stats.demand;
        this.barChartData.datasets[1].data = stats.supply;
        this.triggerChartsUpdate();
      });
  }
}
