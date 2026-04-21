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

  @ViewChildren(BaseChartDirective) charts: QueryList<BaseChartDirective> | undefined;

  public totalAppUsers = 0;
  public activeContracts = 0;
  public canceledContracts = 0;
  private DatesToTranslate: Date[] = [];

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
    this.translateGraphs();
    this.subcribeData();
  }

  private updateCharts() {
    this.cd.markForCheck();
    this.charts?.forEach((child) => {
      child.update();
    });
  }

  private actualizarEtiquetasMeses() {
    if (this.DatesToTranslate.length === 0) return;

    const idiomaActual = this.translate.currentLang || 'es';

    this.lineChartData.labels = this.DatesToTranslate.map((date) => {
      const month = date.toLocaleString(idiomaActual, { month: 'short' });
      return month.charAt(0).toUpperCase() + month.slice(1);
    });

    this.updateCharts();
  }

  private translateGraphs() {
    this.translate
      .stream('DASHBOARD.CHART')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.doughnutChartData.labels = [res.ACTIVE, res.CANCELED];
        this.barChartData.datasets[0].label = res.DEMAND || 'Demanda';
        this.barChartData.datasets[1].label = res.SUPPLY || 'Oferta';
        this.actualizarEtiquetasMeses();
      });
  }

  private subcribeData() {
    this.analyticsService
      .getUsuariosCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.totalAppUsers = count;
        this.cd.markForCheck();
      });

    this.analyticsService
      .getContractStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        this.activeContracts = stats.activeContract;
        this.canceledContracts = stats.cancelContract;
        this.doughnutChartData.datasets[0].data = [stats.activeContract, stats.cancelContract];
        this.updateCharts();
      });

    this.analyticsService
      .fetchMonthlyUsersRecords()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((datos) => {
        this.lineChartData.datasets[0].data = datos.data;
        this.DatesToTranslate = datos.labels;
        this.actualizarEtiquetasMeses();
      });
    this.analyticsService
      .getServicesStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        this.barChartData.labels = stats.labels;
        this.barChartData.datasets[0].data = stats.demand;
        this.barChartData.datasets[1].data = stats.supply;

        this.updateCharts();
      });
  }

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Demanda (Contratos)',
        data: [],
        backgroundColor: '#17c448',
        borderRadius: 4,
      },
      {
        label: 'Oferta (Publicados)',
        data: [],
        backgroundColor: '#60A5FA',
        borderRadius: 4,
      },
    ],
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#9ca3af',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      x: {
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };
}
