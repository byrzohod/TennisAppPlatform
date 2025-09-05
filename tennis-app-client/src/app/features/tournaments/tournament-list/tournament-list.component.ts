import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TournamentService, Tournament } from '../../../core/services/tournament.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-tournament-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          this.error = error.message || 'Failed to load tournaments';
          // Use mock data as fallback for development
          this.tournaments = [
            {
              id: 1,
              name: 'Wimbledon',
              location: 'London, UK',
              startDate: '2024-07-01',
              endDate: '2024-07-14',
              type: 'Grand Slam',
              surface: 'Grass',
              drawSize: 128,
              status: 'Upcoming',
              prizeMoneyUSD: 50000000,
              entryFee: 0,
              playersCount: 45,
              maxPlayers: 128
            },
            {
              id: 2,
              name: 'US Open',
              location: 'New York, USA',
              startDate: '2024-08-26',
              endDate: '2024-09-08',
              type: 'Grand Slam',
              surface: 'HardCourt',
              drawSize: 128,
              status: 'Upcoming',
              prizeMoneyUSD: 60000000,
              entryFee: 0,
              playersCount: 89,
              maxPlayers: 128
            },
            {
              id: 3,
              name: 'French Open',
              location: 'Paris, France',
              startDate: '2024-05-26',
              endDate: '2024-06-09',
              type: 'Grand Slam',
              surface: 'Clay',
              drawSize: 128,
              status: 'In Progress',
              prizeMoneyUSD: 49000000,
              entryFee: 0,
              playersCount: 128,
              maxPlayers: 128
            }
          ];
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
}