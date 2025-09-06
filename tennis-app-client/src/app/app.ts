import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { GlobalSearchComponent } from './shared/components/global-search/global-search.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, GlobalSearchComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  @ViewChild(GlobalSearchComponent) globalSearch!: GlobalSearchComponent;
  
  private authService = inject(AuthService);

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
