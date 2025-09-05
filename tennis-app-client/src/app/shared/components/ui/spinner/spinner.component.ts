import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center" [class]="containerClass">
      @if (variant === 'circle') {
        <svg 
          [class]="spinnerClasses"
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            class="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="4"
          ></circle>
          <path 
            class="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      } @else if (variant === 'dots') {
        <div class="flex space-x-2">
          @for (dot of [1, 2, 3]; track dot) {
            <div 
              [class]="dotClasses"
              [style.animation-delay.ms]="dot * 150"
            ></div>
          }
        </div>
      } @else if (variant === 'pulse') {
        <div class="relative">
          <div [class]="pulseClasses"></div>
          <div [class]="pulseClasses + ' absolute inset-0 animate-ping'"></div>
        </div>
      }
      @if (message) {
        <p [class]="messageClasses">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }
  `]
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() variant: 'circle' | 'dots' | 'pulse' = 'circle';
  @Input() color = 'grass';
  @Input() message?: string;
  @Input() containerClass = '';

  get spinnerClasses(): string {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };
    
    const colors = {
      grass: 'text-grass-600',
      clay: 'text-clay-600',
      hard: 'text-hard-600',
      gray: 'text-gray-600',
      white: 'text-white'
    };
    
    return `animate-spin ${sizes[this.size]} ${colors[this.color as keyof typeof colors] || colors.grass}`;
  }

  get dotClasses(): string {
    const sizes = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4',
      xl: 'w-5 h-5'
    };
    
    const colors = {
      grass: 'bg-grass-600',
      clay: 'bg-clay-600',
      hard: 'bg-hard-600',
      gray: 'bg-gray-600',
      white: 'bg-white'
    };
    
    return `${sizes[this.size]} ${colors[this.color as keyof typeof colors] || colors.grass} rounded-full animate-bounce`;
  }

  get pulseClasses(): string {
    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-20 h-20'
    };
    
    const colors = {
      grass: 'bg-grass-600',
      clay: 'bg-clay-600',
      hard: 'bg-hard-600',
      gray: 'bg-gray-600',
      white: 'bg-white'
    };
    
    return `${sizes[this.size]} ${colors[this.color as keyof typeof colors] || colors.grass} rounded-full`;
  }

  get messageClasses(): string {
    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg'
    };
    
    return `mt-3 ${sizes[this.size]} text-gray-600 dark:text-gray-400`;
  }
}