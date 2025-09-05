import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible) {
      <div 
        [class]="containerClasses"
        [@slideIn]="position"
      >
        <div [class]="toastClasses">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              @switch (variant) {
                @case ('success') {
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                }
                @case ('error') {
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  </svg>
                }
                @case ('warning') {
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                }
                @default {
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                  </svg>
                }
              }
            </div>
            <div class="flex-1">
              @if (title) {
                <p class="font-semibold">{{ title }}</p>
              }
              @if (message) {
                <p class="text-sm" [class.mt-1]="title">{{ message }}</p>
              }
            </div>
            @if (dismissible) {
              <button
                type="button"
                (click)="dismiss()"
                class="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
            }
          </div>
          @if (progress && duration > 0) {
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 rounded-b-lg overflow-hidden">
              <div 
                class="h-full bg-current transition-all duration-100"
                [style.width.%]="progressWidth"
              ></div>
            </div>
          }
        </div>
      </div>
    }
  `,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: '{{enterTransform}}', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translate(0, 0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: '{{leaveTransform}}', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() variant: ToastVariant = 'info';
  @Input() title = '';
  @Input() message = '';
  @Input() position: ToastPosition = 'top-right';
  @Input() duration = 5000;
  @Input() dismissible = true;
  @Input() progress = true;
  @Input() className = '';
  @Output() dismissed = new EventEmitter<void>();

  isVisible = true;
  progressWidth = 100;
  private progressInterval?: number;
  private dismissTimeout?: number;

  get containerClasses(): string {
    const base = 'fixed z-50';
    
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
    };
    
    return `${base} ${positions[this.position]}`.trim();
  }

  get toastClasses(): string {
    const base = 'relative min-w-[300px] max-w-md p-4 rounded-lg shadow-lg border backdrop-blur-sm';
    
    const variants = {
      success: 'bg-green-50/90 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200',
      error: 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200',
      warning: 'bg-yellow-50/90 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200',
      info: 'bg-blue-50/90 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200'
    };
    
    return `${base} ${variants[this.variant]} ${this.className}`.trim();
  }

  ngOnInit(): void {
    if (this.duration > 0) {
      this.startProgress();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private startProgress(): void {
    const interval = 100;
    const decrement = (interval / this.duration) * 100;
    
    this.progressInterval = window.setInterval(() => {
      this.progressWidth -= decrement;
      if (this.progressWidth <= 0) {
        this.dismiss();
      }
    }, interval);
    
    this.dismissTimeout = window.setTimeout(() => {
      this.dismiss();
    }, this.duration);
  }

  private clearTimers(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
    }
  }

  dismiss(): void {
    this.clearTimers();
    this.isVisible = false;
    setTimeout(() => {
      this.dismissed.emit();
    }, 200);
  }
}