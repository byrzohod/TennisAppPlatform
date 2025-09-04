import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
}

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

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTournaments();
  }

  loadTournaments() {
    // Mock data for now
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
        prizeMoneyUSD: 50000000
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
        prizeMoneyUSD: 60000000
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
        prizeMoneyUSD: 49000000
      }
    ];
    
    this.applyFilters();
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