import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlayerService, Player } from '../../../core/services/player.service';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './player-detail.component.html',
  styleUrl: './player-detail.component.scss'
})
export class PlayerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private playerService = inject(PlayerService);

  player: Player | null = null;
  loading = true;
  error: string | null = null;

  // Mock data for demonstration - would come from API in real app
  recentMatches = [
    { opponent: 'John Smith', result: 'Won', score: '6-4, 6-3', date: '2024-01-15' },
    { opponent: 'Mike Johnson', result: 'Lost', score: '4-6, 6-7', date: '2024-01-10' },
    { opponent: 'David Wilson', result: 'Won', score: '7-5, 6-2', date: '2024-01-05' }
  ];

  tournaments = [
    { name: 'Summer Open 2024', status: 'Registered', startDate: '2024-02-01' },
    { name: 'Spring Championship', status: 'Completed', position: '2nd', startDate: '2024-01-01' }
  ];

  ngOnInit() {
    const playerId = this.route.snapshot.paramMap.get('id');
    if (playerId) {
      this.loadPlayer(playerId);
    } else {
      this.error = 'Invalid player ID';
      this.loading = false;
    }
  }

  loadPlayer(id: string) {
    this.loading = true;
    this.error = null;

    this.playerService.getPlayer(id).subscribe({
      next: (player) => {
        this.player = player;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load player details';
        this.loading = false;
        console.error('Error loading player:', err);
      }
    });
  }

  deletePlayer() {
    if (!this.player) return;
    
    if (confirm(`Are you sure you want to delete ${this.player.firstName} ${this.player.lastName}?`)) {
      this.playerService.deletePlayer(this.player.id).subscribe({
        next: () => {
          this.router.navigate(['/players']);
        },
        error: (err) => {
          this.error = 'Failed to delete player';
          console.error('Error deleting player:', err);
        }
      });
    }
  }

  getAge(dateOfBirth: string | undefined): number | string {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}