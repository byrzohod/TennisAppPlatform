import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="computedClasses"
      [style.width]="width"
      [style.height]="height"
      aria-hidden="true"
    >
      <span class="sr-only">Loading...</span>
    </div>
  `,
  styles: [`
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width = '';
  @Input() height = '';
  @Input() animation: 'pulse' | 'wave' | 'none' = 'pulse';
  @Input() className = '';

  get computedClasses(): string {
    const base = 'bg-gray-200 dark:bg-gray-700';
    
    const variants = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: '',
      rounded: 'rounded-lg'
    };
    
    const animations = {
      pulse: 'animate-pulse',
      wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:1000px_100%]',
      none: ''
    };
    
    const defaultSizes = this.getDefaultSizes();
    
    return `${base} ${variants[this.variant]} ${animations[this.animation]} ${defaultSizes} ${this.className}`.trim();
  }

  private getDefaultSizes(): string {
    if (this.width || this.height) {
      return '';
    }
    
    switch (this.variant) {
      case 'text':
        return 'h-4 w-full';
      case 'circular':
        return 'h-12 w-12';
      case 'rectangular':
        return 'h-32 w-full';
      case 'rounded':
        return 'h-24 w-full';
      default:
        return '';
    }
  }
}