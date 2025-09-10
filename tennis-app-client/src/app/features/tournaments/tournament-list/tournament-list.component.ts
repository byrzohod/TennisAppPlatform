import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TournamentService, Tournament } from '../../../core/services/tournament.service';
import { Surface } from '../../../shared/enums/surface.enum';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-tournament-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    SkeletonComponent,
    EmptyStateComponent
  ],
  templateUrl: './tournament-list.component.html',
  styleUrl: './tournament-list.component.scss'
})
export class TournamentListComponent implements OnInit {
  tournaments: Tournament[] = [];
  filteredTournaments: Tournament[] = [];
  searchTerm = '';
  statusFilter = 'All';
  sortBy = 'Date (Newest First)';
  currentPage = 1;
  itemsPerPage = 10;
  isAdmin = true; // For testing, we'll assume admin rights
  loading = false;
  error = '';

  private tournamentService = inject(TournamentService);
  private router = inject(Router);

  ngOnInit() {
    this.loadTournaments();
  }

  loadTournaments() {
    this.loading = true;
    this.error = '';
    
    this.tournamentService.getTournaments()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (tournaments) => {
          this.tournaments = tournaments;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Failed to load tournaments:', error);
          this.error = error.message || 'Failed to load tournaments';
          this.tournaments = [];
          this.applyFilters();
        }
      });
  }

  applyFilters() {
    let filtered = [...this.tournaments];
    
    // Apply status filter
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(t => t.status === this.statusFilter);
    }
    
    // Apply search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.location.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    if (this.sortBy === 'Date (Newest First)') {
      filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    } else if (this.sortBy === 'Name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    this.filteredTournaments = filtered;
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  get paginatedTournaments() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredTournaments.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredTournaments.length / this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  createTournament() {
    this.router.navigate(['/tournaments/create']);
  }

  viewTournament(id: number) {
    this.router.navigate(['/tournaments', id]);
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

  getUpcomingCount(): number {
    return this.filteredTournaments.filter(t => t.status === 'Upcoming').length;
  }

  getInProgressCount(): number {
    return this.filteredTournaments.filter(t => t.status === 'In Progress').length;
  }

  getCompletedCount(): number {
    return this.filteredTournaments.filter(t => t.status === 'Completed').length;
  }
}