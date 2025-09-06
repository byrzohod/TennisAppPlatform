import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CardComponent } from '../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
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
    { title: 'View Players', icon: '👥', route: '/players', color: 'from-grass-500 to-grass-600', bgColor: 'bg-grass-50', iconColor: 'text-grass-600' },
    { title: 'Tournaments', icon: '🏆', route: '/tournaments', color: 'from-clay-500 to-clay-600', bgColor: 'bg-clay-50', iconColor: 'text-clay-600' },
    { title: 'My Profile', icon: '👤', route: '/profile', color: 'from-hard-500 to-hard-600', bgColor: 'bg-hard-50', iconColor: 'text-hard-600' },
    { title: 'Schedule', icon: '📅', route: '/schedule', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' }
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
