import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);

  user$;
  
  stats = {
    totalPlayers: 0,
    activeTournaments: 0,
    upcomingMatches: 0,
    recentResults: 0
  };

  quickActions = [
    { title: 'View Players', icon: '👥', route: '/players', color: 'bg-blue-500' },
    { title: 'Tournaments', icon: '🏆', route: '/tournaments', color: 'bg-green-500' },
    { title: 'My Profile', icon: '👤', route: '/profile', color: 'bg-purple-500' },
    { title: 'Schedule', icon: '📅', route: '/schedule', color: 'bg-yellow-500' }
  ];

  recentActivities = [
    { type: 'tournament', message: 'New tournament "Summer Open" created', time: '2 hours ago' },
    { type: 'player', message: 'Player John Doe registered', time: '5 hours ago' },
    { type: 'match', message: 'Match result updated: Smith vs Johnson', time: '1 day ago' }
  ];

  constructor() {
    this.user$ = this.authService.currentUser$;
  }

  ngOnInit() {
    // In a real app, these would be fetched from the API
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Placeholder for API calls
    this.stats = {
      totalPlayers: 156,
      activeTournaments: 8,
      upcomingMatches: 24,
      recentResults: 12
    };
  }

  logout() {
    this.authService.logout();
  }
}
