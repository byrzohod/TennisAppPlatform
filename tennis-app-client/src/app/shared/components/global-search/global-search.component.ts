import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SearchService, SearchResult } from '../../../core/services/search.service';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Search Modal Backdrop -->
    <div class="fixed inset-0 z-50 overflow-y-auto"
         *ngIf="isOpen"
         (click)="closeSearch()"
         (keydown)="$event.key === 'Escape' && closeSearch()"
         tabindex="-1">
      <div class="flex items-start justify-center min-h-screen pt-20 px-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
             (click)="closeSearch()"
             (keydown)="$event.key === 'Escape' && closeSearch()"
             tabindex="-1"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all"
             [class.animate-scale-up]="isOpen"
             (click)="$event.stopPropagation()"
             (keydown)="$event.key === 'Escape' && closeSearch()"
             tabindex="0">
          
          <!-- Search Input Header -->
          <div class="flex items-center border-b border-gray-200 dark:border-gray-700 p-4">
            <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input #searchInput
                   type="text"
                   [(ngModel)]="searchQuery"
                   (input)="onSearch()"
                   (keydown)="onKeyDown($event)"
                   class="flex-1 outline-none bg-transparent text-gray-900 dark:text-white
                          placeholder-gray-500 text-lg"
                   placeholder="Search tournaments, players, matches..."
                   autocomplete="off">
            <kbd class="hidden sm:inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 
                       text-gray-600 dark:text-gray-400 rounded border">
              ESC
            </kbd>
          </div>
          
          <!-- Search Results -->
          <div class="max-h-96 overflow-y-auto">
            <!-- Loading State -->
            <div *ngIf="loading" class="p-4">
              <div class="animate-pulse space-y-3">
                <div *ngFor="let i of [1,2,3]; trackBy: trackByIndex" 
                     class="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
            
            <!-- Results -->
            <div *ngIf="!loading && results.length > 0" class="py-2">
              <button *ngFor="let result of results; trackBy: trackByResult; let i = index"
                      [class.bg-gray-100]="i === selectedIndex && !isDarkMode"
                      [class.dark:bg-gray-700]="i === selectedIndex && isDarkMode"
                      class="w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700
                             flex items-center gap-3 transition-colors focus:outline-none
                             focus:bg-gray-100 dark:focus:bg-gray-700"
                      (click)="navigateTo(result)"
                      (mouseenter)="selectedIndex = i">
                
                <!-- Result Icon -->
                <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                  <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path *ngIf="result.icon === 'trophy'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    <path *ngIf="result.icon === 'user'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    <path *ngIf="result.icon === 'play'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15" />
                    <path *ngIf="result.icon === 'plus-circle'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path *ngIf="result.icon === 'user-plus'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    <path *ngIf="result.icon === 'chart-bar'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    <path *ngIf="result.icon === 'clock'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <!-- Result Content -->
                <div class="flex-1 text-left min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ result.title }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ result.subtitle }}
                  </p>
                </div>
                
                <!-- Result Type Badge -->
                <div class="flex-shrink-0">
                  <span class="px-2 py-1 text-xs rounded-full"
                        [class.bg-grass-100]="result.type === 'tournament'"
                        [class.text-grass-800]="result.type === 'tournament'"
                        [class.dark:bg-grass-900]="result.type === 'tournament'"
                        [class.dark:text-grass-200]="result.type === 'tournament'"
                        [class.bg-blue-100]="result.type === 'player'"
                        [class.text-blue-800]="result.type === 'player'"
                        [class.dark:bg-blue-900]="result.type === 'player'"
                        [class.dark:text-blue-200]="result.type === 'player'"
                        [class.bg-purple-100]="result.type === 'match'"
                        [class.text-purple-800]="result.type === 'match'"
                        [class.dark:bg-purple-900]="result.type === 'match'"
                        [class.dark:text-purple-200]="result.type === 'match'"
                        [class.bg-amber-100]="result.type === 'quick-action'"
                        [class.text-amber-800]="result.type === 'quick-action'"
                        [class.dark:bg-amber-900]="result.type === 'quick-action'"
                        [class.dark:text-amber-200]="result.type === 'quick-action'">
                    {{ result.type === 'quick-action' ? 'action' : result.type }}
                  </span>
                </div>
                
                <!-- Arrow Icon -->
                <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <!-- Empty State -->
            <div *ngIf="!loading && results.length === 0 && searchQuery.trim()" 
                 class="p-8 text-center">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                No results found for "{{ searchQuery }}"
              </p>
              <p class="text-gray-400 dark:text-gray-500 text-xs mt-2">
                Try different keywords or check spelling
              </p>
            </div>
            
            <!-- Initial State -->
            <div *ngIf="!loading && results.length === 0 && !searchQuery.trim()" 
                 class="p-8 text-center">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                Search across tournaments, players, and matches
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-3 
                      bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 border rounded text-xs">↵</kbd>
                  <span>to select</span>
                </div>
                <div class="flex items-center gap-1">
                  <kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 border rounded text-xs">↑</kbd>
                  <kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 border rounded text-xs">↓</kbd>
                  <span>to navigate</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 border rounded text-xs">ESC</kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-scale-up {
      animation: scaleUp 0.2s ease-out;
    }
    
    @keyframes scaleUp {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `]
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  isOpen = false;
  searchQuery = '';
  results: SearchResult[] = [];
  loading = false;
  selectedIndex = -1;
  isDarkMode = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  private searchService = inject(SearchService);
  private router = inject(Router);

  ngOnInit() {
    // Set up debounced search
    this.searchService.createDebouncedSearch(this.searchSubject.asObservable())
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.results = results;
        this.selectedIndex = results.length > 0 ? 0 : -1;
      });

    // Subscribe to loading state
    this.searchService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    // Detect dark mode
    this.isDarkMode = document.documentElement.classList.contains('dark');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent) {
    // Open search with Cmd+K or Ctrl+K
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
    
    // Close search with Escape
    if (event.key === 'Escape' && this.isOpen) {
      event.preventDefault();
      this.closeSearch();
    }
  }

  openSearch() {
    this.isOpen = true;
    this.searchQuery = '';
    this.results = [];
    this.selectedIndex = -1;
    
    // Focus input after animation
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 100);
  }

  closeSearch() {
    this.isOpen = false;
    this.searchQuery = '';
    this.results = [];
    this.selectedIndex = -1;
  }

  onSearch() {
    this.searchSubject.next(this.searchQuery);
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.results[this.selectedIndex]) {
          this.navigateTo(this.results[this.selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeSearch();
        break;
    }
  }

  navigateTo(result: SearchResult) {
    this.router.navigate([result.route]);
    this.closeSearch();
  }

  trackByResult(index: number, result: SearchResult): string {
    return result.id;
  }

  trackByIndex(index: number): number {
    return index;
  }
}