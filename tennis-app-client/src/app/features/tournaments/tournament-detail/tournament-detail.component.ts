import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';

interface Tournament {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  type: string;
  surface: string;
  drawSize: number;
  status: string;
  prizeMoneyUSD?: number;
  entryFee?: number;
  description?: string;
}

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  country: string;
  ranking?: number;
  seed?: number;
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
  players: Player[] = [];
  isAdmin = true; // For testing
  showRegisterModal = false;
  availablePlayers: Player[] = [];
  selectedPlayerId: number | null = null;
  playerSearchTerm = '';

  private route = inject(ActivatedRoute);
  protected router = inject(Router);
  private http = inject(HttpClient);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadTournament(+id); // Convert to number
    this.loadPlayers();
    this.loadAvailablePlayers();
  }

  loadTournament(id: number) {
    // Mock data for now
    this.tournament = {
      id: id,
      name: 'Wimbledon',
      location: 'London, UK',
      startDate: '2024-07-01',
      endDate: '2024-07-14',
      type: 'Grand Slam',
      surface: 'Grass',
      drawSize: 128,
      status: 'Upcoming',
      prizeMoneyUSD: 50000000,
      description: 'The oldest tennis tournament in the world'
    };
  }

  loadPlayers() {
    // Mock registered players
    this.players = [
      {
        id: 1,
        firstName: 'Novak',
        lastName: 'Djokovic',
        country: 'Serbia',
        ranking: 1,
        seed: 1,
        status: 'Registered'
      },
      {
        id: 2,
        firstName: 'Carlos',
        lastName: 'Alcaraz',
        country: 'Spain',
        ranking: 2,
        seed: 2,
        status: 'Registered'
      }
    ];
  }

  loadAvailablePlayers() {
    // Mock available players for registration
    this.availablePlayers = [
      {
        id: 3,
        firstName: 'Rafael',
        lastName: 'Nadal',
        country: 'Spain',
        ranking: 3
      },
      {
        id: 4,
        firstName: 'Daniil',
        lastName: 'Medvedev',
        country: 'Russia',
        ranking: 4
      }
    ];
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
    if (confirm('Are you sure you want to delete this tournament?')) {
      // Delete logic here
      this.router.navigate(['/tournaments']);
    }
  }

  openRegisterModal() {
    this.showRegisterModal = true;
  }

  closeRegisterModal() {
    this.showRegisterModal = false;
    this.selectedPlayerId = null;
    this.playerSearchTerm = '';
  }

  selectPlayer(playerId: number) {
    this.selectedPlayerId = playerId;
  }

  confirmRegistration() {
    if (this.selectedPlayerId) {
      const player = this.availablePlayers.find(p => p.id === this.selectedPlayerId);
      if (player) {
        this.players.push({
          ...player,
          seed: undefined,
          status: 'Registered'
        });
        this.availablePlayers = this.availablePlayers.filter(p => p.id !== this.selectedPlayerId);
        this.closeRegisterModal();
      }
    }
  }

  updateSeed(playerId: number, seed: string) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.seed = seed ? parseInt(seed) : undefined;
    }
  }

  saveSeed(playerId: number) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      // Save seed logic here
      console.log(`Seed updated for player ${playerId}: ${player.seed}`);
    }
  }

  withdrawPlayer(playerId: number) {
    const player = this.players.find(p => p.id === playerId);
    if (player && confirm('Confirm withdrawal?')) {
      player.status = 'Withdrawn';
    }
  }

  get filteredAvailablePlayers() {
    if (!this.playerSearchTerm) {
      return this.availablePlayers;
    }
    const search = this.playerSearchTerm.toLowerCase();
    return this.availablePlayers.filter(p => 
      p.firstName.toLowerCase().includes(search) ||
      p.lastName.toLowerCase().includes(search)
    );
  }

  get isInProgress() {
    return this.tournament?.status === 'In Progress';
  }

  getSurfaceIcon(surface: string): string {
    switch(surface?.toLowerCase()) {
      case 'grass': return '🌱';
      case 'clay': return '🧱';
      case 'hardcourt':
      case 'hard': return '🏟️';
      default: return '🎾';
    }
  }

  getSurfaceColor(surface: string): string {
    switch(surface?.toLowerCase()) {
      case 'grass': return 'bg-grass-100 text-grass-700 dark:bg-grass-900 dark:text-grass-300';
      case 'clay': return 'bg-clay-100 text-clay-700 dark:bg-clay-900 dark:text-clay-300';
      case 'hardcourt':
      case 'hard': return 'bg-hard-100 text-hard-700 dark:bg-hard-900 dark:text-hard-300';
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