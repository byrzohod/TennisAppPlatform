import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto" [@fadeIn]>
        <div 
          class="fixed inset-0 bg-black/50 backdrop-blur-sm" 
          (click)="handleBackdropClick()"
          (keyup.escape)="handleBackdropClick()"
          tabindex="0"
        ></div>
        
        <div class="relative min-h-screen flex items-center justify-center p-4">
          <div 
            [class]="modalClasses"
            [@slideUp]
            (click)="$event.stopPropagation()"
            (keyup.escape)="close()"
            tabindex="0"
          >
            @if (showHeader) {
              <div class="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ title }}
                </h3>
                @if (showCloseButton) {
                  <button
                    type="button"
                    (click)="close()"
                    class="ml-auto -mr-2 -mt-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Close modal"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                }
              </div>
            }
            
            <div class="p-6">
              <ng-content></ng-content>
            </div>
            
            @if (showFooter) {
              <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <ng-content select="[modal-footer]"></ng-content>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(20px)', opacity: 0 }))
      ])
    ])
  ]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: ModalSize = 'md';
  @Input() showHeader = true;
  @Input() showFooter = false;
  @Input() showCloseButton = true;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEsc = true;
  @Input() className = '';
  @Output() closed = new EventEmitter<void>();

  get modalClasses(): string {
    const base = 'relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all';
    
    const sizes = {
      sm: 'max-w-sm w-full',
      md: 'max-w-md w-full',
      lg: 'max-w-lg w-full',
      xl: 'max-w-xl w-full',
      full: 'max-w-7xl w-full mx-4'
    };
    
    return `${base} ${sizes[this.size]} ${this.className}`.trim();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && this.closeOnEsc) {
      this.close();
    }
  }

  handleBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }
}