import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';
import { TournamentService, Tournament, Player as TournamentPlayer } from '../../../core/services/tournament.service';
import { PlayerService, Player } from '../../../core/services/player.service';
import { TournamentType, TournamentTypeLabels } from '../../../shared/enums/tournament-type.enum';
import { Surface, SurfaceLabels } from '../../../shared/enums/surface.enum';
import { finalize } from 'rxjs';

interface EnrichedPlayer extends TournamentPlayer {
  firstName?: string;
  lastName?: string;
  status?: string;
}

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    SkeletonComponent
  ],
  templateUrl: './tournament-detail.component.html',
  styleUrl: './tournament-detail.component.scss'
})
export class TournamentDetailComponent implements OnInit {
  tournament: Tournament | null = null;
  activeTab = 'overview';
  players: EnrichedPlayer[] = [];
  isAdmin = true; // For testing
  showRegisterModal = false;
  availablePlayers: Player[] = [];
  selectedPlayerId: string | null = null;
  playerSearchTerm = '';
  loading = false;
  loadingPlayers = false;
  error = '';
  
  tournamentTypeLabels = TournamentTypeLabels;
  surfaceLabels = SurfaceLabels;

  private route = inject(ActivatedRoute);
  protected router = inject(Router);
  private tournamentService = inject(TournamentService);
  private playerService = inject(PlayerService);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadTournament(+id);
  }

  loadTournament(id: number) {
    this.loading = true;
    this.tournamentService.getTournament(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (tournament) => {
          this.tournament = tournament;
          this.loadPlayers();
          this.loadAvailablePlayers();
        },
        error: (error) => {
          console.error('Failed to load tournament:', error);
          this.error = 'Failed to load tournament details';
        }
      });
  }

  loadPlayers() {
    if (!this.tournament) return;
    
    this.loadingPlayers = true;
    this.tournamentService.getRegisteredPlayers(this.tournament.id)
      .pipe(finalize(() => this.loadingPlayers = false))
      .subscribe({
        next: (players) => {
          this.players = players.map(p => ({
            ...p,
            firstName: p.name?.split(' ')[0] || '',
            lastName: p.name?.split(' ').slice(1).join(' ') || '',
            status: 'Registered'
          }));
        },
        error: (error) => {
          console.error('Failed to load registered players:', error);
          this.players = [];
        }
      });
  }

  loadAvailablePlayers() {
    this.playerService.getPlayers(1, 100)
      .subscribe({
        next: (result) => {
          const registeredIds = this.players.map(p => p.id);
          this.availablePlayers = result.items.filter(p => 
            !registeredIds.includes(parseInt(p.id))
          );
        },
        error: (error) => {
          console.error('Failed to load available players:', error);
          this.availablePlayers = [];
        }
      });
  }

  selectTab(tab: string) {
    this.activeTab = tab;
  }

  editTournament() {
    if (this.tournament) {
      this.router.navigate(['/tournaments', this.tournament.id, 'edit']);
    }
  }

  deleteTournament() {
    if (!this.tournament) return;
    
    if (confirm('Are you sure you want to delete this tournament?')) {
      this.tournamentService.deleteTournament(this.tournament.id)
        .subscribe({
          next: () => {
            this.router.navigate(['/tournaments']);
          },
          error: (error) => {
            console.error('Failed to delete tournament:', error);
            this.error = 'Failed to delete tournament';
          }
        });
    }
  }

  openRegisterModal() {
    this.showRegisterModal = true;
    this.loadAvailablePlayers();
  }

  closeRegisterModal() {
    this.showRegisterModal = false;
    this.selectedPlayerId = null;
    this.playerSearchTerm = '';
  }

  selectPlayer(playerId: string) {
    this.selectedPlayerId = playerId;
  }

  confirmRegistration() {
    if (!this.selectedPlayerId || !this.tournament) return;
    
    const playerId = parseInt(this.selectedPlayerId);
    this.tournamentService.registerPlayer(this.tournament.id, playerId)
      .subscribe({
        next: () => {
          this.loadPlayers();
          this.closeRegisterModal();
        },
        error: (error) => {
          console.error('Failed to register player:', error);
          this.error = 'Failed to register player';
        }
      });
  }

  updateSeed(playerId: number, seed: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.seed = seed ? parseInt(seed) : undefined;
    }
  }

  saveSeed(playerId: number) {
    if (!this.tournament) return;
    
    const player = this.players.find(p => p.id === playerId);
    if (player && player.seed !== undefined) {
      this.tournamentService.updateSeed(this.tournament.id, playerId, player.seed)
        .subscribe({
          next: () => {
            console.log(`Seed updated for player ${playerId}: ${player.seed}`);
          },
          error: (error) => {
            console.error('Failed to update seed:', error);
            this.error = 'Failed to update seed';
          }
        });
    }
  }

  withdrawPlayer(playerId: number) {
    if (!this.tournament) return;
    
    if (confirm('Confirm withdrawal?')) {
      this.tournamentService.unregisterPlayer(this.tournament.id, playerId)
        .subscribe({
          next: () => {
            this.loadPlayers();
          },
          error: (error) => {
            console.error('Failed to withdraw player:', error);
            this.error = 'Failed to withdraw player';
          }
        });
    }
  }

  get filteredAvailablePlayers() {
    if (!this.playerSearchTerm) {
      return this.availablePlayers;
    }
    const search = this.playerSearchTerm.toLowerCase();
    return this.availablePlayers.filter(p => 
      p.firstName.toLowerCase().includes(search) ||
      p.lastName.toLowerCase().includes(search) ||
      (p.email && p.email.toLowerCase().includes(search))
    );
  }

  get isInProgress() {
    return this.tournament?.status === 'In Progress';
  }

  getTournamentTypeLabel(type: TournamentType): string {
    return this.tournamentTypeLabels[type] || 'Unknown';
  }

  getSurfaceLabel(surface: Surface): string {
    return this.surfaceLabels[surface] || 'Unknown';
  }

  getSurfaceIcon(surface: Surface): string {
    switch(surface) {
      case Surface.Grass: return '🌱';
      case Surface.Clay: return '🧱';
      case Surface.HardCourt: return '🏟️';
      case Surface.Indoor: return '🏢';
      case Surface.Carpet: return '🟫';
      default: return '🎾';
    }
  }

  getSurfaceColor(surface: Surface): string {
    switch(surface) {
      case Surface.Grass: return 'bg-grass-100 text-grass-700 dark:bg-grass-900 dark:text-grass-300';
      case Surface.Clay: return 'bg-clay-100 text-clay-700 dark:bg-clay-900 dark:text-clay-300';
      case Surface.HardCourt: return 'bg-hard-100 text-hard-700 dark:bg-hard-900 dark:text-hard-300';
      case Surface.Indoor: return 'bg-indoor-100 text-indoor-700 dark:bg-indoor-900 dark:text-indoor-300';
      case Surface.Carpet: return 'bg-carpet-100 text-carpet-700 dark:bg-carpet-900 dark:text-carpet-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  getStatusBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
    switch(status?.toLowerCase()) {
      case 'upcoming': return 'info';
      case 'in progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  }

  formatPrizeMoney(amount: number): string {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  }

  getTabIcon(tab: string): string {
    switch(tab) {
      case 'overview': return '📋';
      case 'players': return '👥';
      case 'bracket': return '🏆';
      case 'matches': return '🎾';
      case 'results': return '📊';
      default: return '📄';
    }
  }
}