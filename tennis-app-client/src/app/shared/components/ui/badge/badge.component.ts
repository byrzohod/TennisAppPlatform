import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'grass' | 'clay' | 'hard' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="computedClasses">
      @if (dot) {
        <span [class]="dotClasses"></span>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: []
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'md';
  @Input() dot = false;
  @Input() pill = true;
  @Input() className = '';

  get computedClasses(): string {
    const base = 'inline-flex items-center font-medium transition-colors';
    const rounded = this.pill ? 'rounded-full' : 'rounded-md';
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base'
    };
    
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      grass: 'bg-grass-100 text-grass-800 dark:bg-grass-900/30 dark:text-grass-300',
      clay: 'bg-clay-100 text-clay-800 dark:bg-clay-900/30 dark:text-clay-300',
      hard: 'bg-hard-100 text-hard-800 dark:bg-hard-900/30 dark:text-hard-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    
    return `${base} ${rounded} ${sizes[this.size]} ${variants[this.variant]} ${this.className}`.trim();
  }

  get dotClasses(): string {
    const sizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5'
    };
    
    const colors = {
      default: 'bg-gray-500',
      grass: 'bg-grass-500',
      clay: 'bg-clay-500',
      hard: 'bg-hard-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };
    
    return `${sizes[this.size]} ${colors[this.variant]} rounded-full mr-1.5 animate-pulse`;
  }
}