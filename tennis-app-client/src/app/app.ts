import { Component, inject, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { GlobalSearchComponent } from './shared/components/global-search/global-search.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, GlobalSearchComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  @ViewChild(GlobalSearchComponent) globalSearch!: GlobalSearchComponent;
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  title = 'Tennis App';
  isAuthenticated$;
  currentUser$;
  isMenuOpen = false;

  navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊' },
    { label: 'Players', route: '/players', icon: '👥' },
    { label: 'Tournaments', route: '/tournaments', icon: '🏆' },
    { label: 'Profile', route: '/profile', icon: '👤' }
  ];

  constructor() {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit() {
    // Close mobile menu on route change
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isMenuOpen = false;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.isMenuOpen = false;
  }

  openSearch() {
    if (this.globalSearch) {
      this.globalSearch.openSearch();
    }
  }
}
