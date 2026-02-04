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
import { Buttonback } from '../../components/buttonback/buttonback';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BaseChartDirective, CommonModule, Buttonback, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);

  @ViewChildren(BaseChartDirective) charts: QueryList<BaseChartDirective> | undefined;

  public totalUsuarios = 0;
  public contratosActivos = 0;
  public contratosCancelados = 0;

  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#60A5FA', '#ca165b'],
        hoverBackgroundColor: ['#6EE7B7', '#6EE7B7'],
        borderWidth: 0,
      },
    ],
  };

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: { legend: { display: false } },
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

  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { display: false },
      x: { grid: { display: false }, border: { display: false } },
    },
    plugins: { legend: { display: false } },
  };

  ngOnInit() {
    this.traducirGraficas();
    this.suscribirADatos();
  }
  private updateCharts() {
    this.cd.markForCheck();
    this.charts?.forEach((child) => {
      child.update();
    });
  }

  private traducirGraficas() {
    this.translate
      .stream('DASHBOARD.CHART')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.doughnutChartData.labels = [res.ACTIVE, res.CANCELED];
        this.lineChartData.labels = res.DAYS;
        this.updateCharts();
      });
  }

  private suscribirADatos() {
    this.analyticsService
      .getUsuariosCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.totalUsuarios = count;
        this.cd.markForCheck();
      });
    this.analyticsService
      .getContractStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        this.contratosActivos = stats.activos;
        this.contratosCancelados = stats.cancelados;
        this.doughnutChartData.datasets[0].data = [stats.activos, stats.cancelados];
        this.updateCharts();
      });
    this.analyticsService
      .fetchWeeklyRecords()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((datos) => {
        this.lineChartData.datasets[0].data = datos;
        this.updateCharts();
      });
  }
}
