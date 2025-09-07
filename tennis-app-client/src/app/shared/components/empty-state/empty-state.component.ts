import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-6 text-center">
        <!-- Icon Container -->
        <div class="mx-auto w-24 h-24 flex items-center justify-center rounded-full"
             [ngClass]="iconBackgroundClass || 'bg-gray-100 dark:bg-gray-800'">
          @if (icon) {
            <span class="text-4xl">{{ icon }}</span>
          } @else if (svgIcon) {
            <svg class="w-12 h-12" [ngClass]="iconColorClass || 'text-gray-400 dark:text-gray-600'" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" [innerHTML]="svgIcon"></svg>
          } @else {
            <!-- Default empty icon -->
            <svg class="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
        </div>

        <!-- Title -->
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>

        <!-- Description -->
        @if (description) {
          <p class="text-gray-600 dark:text-gray-400 text-sm">
            {{ description }}
          </p>
        }

        <!-- Action Buttons -->
        @if (actionLabel && actionRoute) {
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a [routerLink]="actionRoute" 
               class="inline-flex items-center justify-center px-4 py-2 border border-transparent 
                      text-sm font-medium rounded-lg shadow-sm text-white bg-grass-600 
                      hover:bg-grass-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                      focus:ring-grass-500 transition-colors duration-200">
              @if (actionIcon) {
                <span class="mr-2">{{ actionIcon }}</span>
              }
              {{ actionLabel }}
            </a>
            
            @if (secondaryActionLabel && secondaryActionRoute) {
              <a [routerLink]="secondaryActionRoute"
                 class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 
                        dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 
                        dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 
                        dark:hover:bg-gray-700 focus:outline-none focus:ring-2 
                        focus:ring-offset-2 focus:ring-grass-500 transition-colors duration-200">
                @if (secondaryActionIcon) {
                  <span class="mr-2">{{ secondaryActionIcon }}</span>
                }
                {{ secondaryActionLabel }}
              </a>
            }
          </div>
        }

        <!-- Custom action template -->
        @if (showCustomAction) {
          <div class="mt-6">
            <ng-content select="[customAction]"></ng-content>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class EmptyStateComponent {
  @Input() title = 'No data found';
  @Input() description?: string;
  @Input() icon?: string; // Emoji icon
  @Input() svgIcon?: string; // SVG path content
  @Input() iconColorClass?: string;
  @Input() iconBackgroundClass?: string;
  @Input() actionLabel?: string;
  @Input() actionRoute?: string;
  @Input() actionIcon?: string;
  @Input() secondaryActionLabel?: string;
  @Input() secondaryActionRoute?: string;
  @Input() secondaryActionIcon?: string;
  @Input() showCustomAction = false;
}