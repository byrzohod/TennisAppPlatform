import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClasses">
      @if (gradient) {
        <div class="absolute inset-0 bg-gradient-to-br from-grass-500/5 to-hard-500/5 
                    opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
      }
      <div class="relative">
        @if (header || badge) {
          <div class="flex items-start justify-between mb-4">
            @if (header) {
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ header }}
              </h3>
            }
            @if (badge) {
              <span [class]="badgeClasses">
                {{ badge }}
              </span>
            }
          </div>
        }
        <div class="card-content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CardComponent {
  @Input() header?: string;
  @Input() badge?: string;
  @Input() badgeVariant: 'success' | 'warning' | 'error' | 'info' = 'info';
  @Input() hoverable = false;
  @Input() gradient = false;
  @Input() noPadding = false;
  @Input() className = '';

  get computedClasses(): string {
    const base = 'relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300';
    const hover = this.hoverable ? 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer group' : '';
    const padding = this.noPadding ? '' : 'p-6';
    
    return `${base} ${hover} ${padding} ${this.className}`.trim();
  }

  get badgeClasses(): string {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full';
    
    const variants = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    
    return `${base} ${variants[this.badgeVariant]}`.trim();
  }
}