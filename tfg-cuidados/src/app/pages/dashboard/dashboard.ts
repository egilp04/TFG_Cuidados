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
 * Dashboard component for administrators.
 * Displays visual metrics for users, contracts, and service performance.
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

  // --- Chart Data Configurations ---

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
        label: '', // Populated via translation
        data: [],
        backgroundColor: '#17c448',
        borderRadius: 4,
      },
      {
        label: '', // Populated via translation
        data: [],
        backgroundColor: '#60A5FA',
        borderRadius: 4,
      },
    ],
  };

  // --- Chart Options ---

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
   * Manually triggers an update for all charts in the view.
   */
  private triggerChartsUpdate(): void {
    this.cd.markForCheck();
    this.charts?.forEach((chart) => chart.update());
  }

  /**
   * Updates the month labels for the line chart based on the current language.
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
   * Listens to translation changes to update chart labels dynamically.
   */
  private translateCharts(): void {
    this.translate
      .stream('DASHBOARD.CHART')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.doughnutChartData.labels = [res.ACTIVE, res.CANCELED];
        this.barChartData.datasets[0].label = res.DEMAND || 'Demand';
        this.barChartData.datasets[1].label = res.SUPPLY || 'Supply';
        this.updateMonthLabels();
      });
  }

  /**
   * Subscribes to the analytics service observables to populate metrics.
   */
  private subscribeToAnalytics(): void {
    this.analyticsService.getUsuariosCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.totalUsersCount = count;
        this.cd.markForCheck();
      });

    this.analyticsService.getContractStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        this.activeContractsCount = stats.activeContract;
        this.canceledContractsCount = stats.cancelContract;
        this.doughnutChartData.datasets[0].data = [stats.activeContract, stats.cancelContract];
        this.triggerChartsUpdate();
      });

    this.analyticsService.fetchMonthlyUsersRecords()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((records) => {
        this.lineChartData.datasets[0].data = records.data;
        this.timelineDates = records.labels;
        this.updateMonthLabels();
      });

    this.analyticsService.getServicesStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        this.barChartData.labels = stats.labels;
        this.barChartData.datasets[0].data = stats.demand;
        this.barChartData.datasets[1].data = stats.supply;
        this.triggerChartsUpdate();
      });
  }
}