import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stats-radar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Skills Overview
      </h3>
      <div class="relative h-80">
        <canvas #radarCanvas></canvas>
      </div>
      <div class="mt-6 grid grid-cols-2 gap-3">
        @for (stat of stats; track stat.label) {
          <div class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ stat.label }}</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ stat.value }}/10</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class StatsRadarComponent implements AfterViewInit, OnDestroy {
  @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() playerId: string | null = null;
  
  chart: Chart | null = null;
  
  stats = [
    { label: 'Serve', value: 8 },
    { label: 'Return', value: 7 },
    { label: 'Forehand', value: 9 },
    { label: 'Backhand', value: 7 },
    { label: 'Volley', value: 6 },
    { label: 'Movement', value: 8 }
  ];

  ngAfterViewInit() {
    this.createRadarChart();
  }

  createRadarChart() {
    const ctx = this.radarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'radar',
      data: {
        labels: this.stats.map(s => s.label),
        datasets: [{
          label: 'Current',
          data: this.stats.map(s => s.value),
          borderColor: 'rgb(74, 222, 128)',
          backgroundColor: 'rgba(74, 222, 128, 0.2)',
          pointBackgroundColor: 'rgb(74, 222, 128)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(74, 222, 128)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 10,
            ticks: {
              stepSize: 2,
              color: '#6b7280'
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.2)'
            },
            pointLabels: {
              color: '#374151',
              font: {
                size: 12,
                weight: 500
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}