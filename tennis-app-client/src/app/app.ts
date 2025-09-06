import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private authService = inject(AuthService);
  private router = inject(Router);

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
}
