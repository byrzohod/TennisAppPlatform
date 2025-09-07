import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-performance-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <div class="flex gap-2">
          @for (period of periods; track period) {
            <button 
              (click)="selectPeriod(period)"
              (keydown.enter)="selectPeriod(period)"
              [class.bg-grass-100]="selectedPeriod === period"
              [class.dark:bg-grass-900]="selectedPeriod === period"
              [class.text-grass-700]="selectedPeriod === period"
              [class.dark:text-grass-300]="selectedPeriod === period"
              [class.text-gray-600]="selectedPeriod !== period"
              [class.dark:text-gray-400]="selectedPeriod !== period"
              class="px-3 py-1 text-sm font-medium rounded-lg transition-colors
                     hover:bg-gray-100 dark:hover:bg-gray-700">
              {{ period }}
            </button>
          }
        </div>
      </div>
      <div class="relative h-64">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: []
})
export class PerformanceChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() title = 'Performance';
  @Input() type: ChartType = 'line';
  @Input() data: number[] = [];
  
  chart: Chart | null = null;
  periods = ['1M', '3M', '6M', '1Y', 'All'];
  selectedPeriod = '6M';

  ngOnInit() {
    // Initialize component properties
    this.selectedPeriod = '6M';
  }

  ngAfterViewInit() {
    this.createChart();
  }

  createChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Generate sample data for demonstration
    const labels = this.generateLabels();
    const data = this.generateSampleData(labels.length);

    const config: ChartConfiguration = {
      type: this.type,
      data: {
        labels: labels,
        datasets: [{
          label: 'Win Rate %',
          data: data,
          borderColor: 'rgb(74, 222, 128)',
          backgroundColor: 'rgba(74, 222, 128, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgb(74, 222, 128)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(156, 163, 175, 0.1)'
            },
            ticks: {
              color: '#6b7280',
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    this.updateChartData();
  }

  updateChartData() {
    if (!this.chart) return;
    
    const labels = this.generateLabels();
    const data = this.generateSampleData(labels.length);
    
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  generateLabels(): string[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    switch (this.selectedPeriod) {
      case '1M':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case '3M':
        return months.slice(0, 3);
      case '6M':
        return months;
      case '1Y':
        return ['Q1', 'Q2', 'Q3', 'Q4'];
      case 'All':
        return ['2021', '2022', '2023', '2024'];
      default:
        return months;
    }
  }

  generateSampleData(length: number): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * 30) + 60);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}