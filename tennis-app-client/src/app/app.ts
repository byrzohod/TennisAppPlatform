import { Component, OnInit, inject } from '@angular/core';
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
export class App implements OnInit {
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

  ngOnInit() {
    // Check authentication status on app init
    if (!this.authService.isAuthenticated() && 
        !this.router.url.includes('/login') && 
        !this.router.url.includes('/register')) {
      this.router.navigate(['/login']);
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.isMenuOpen = false;
  }
}
