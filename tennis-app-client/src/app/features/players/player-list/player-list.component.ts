import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PlayerService, Player, PagedResult } from '../../../core/services/player.service';

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.scss'
})
export class PlayerListComponent implements OnInit, OnDestroy {
  Math = Math; // Expose Math to template
  players: Player[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalCount = 0;
  
  // Search and sorting
  searchTerm = '';
  sortBy = 'lastName';
  sortDescending = false;
  
  // Search subject for debouncing
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private playerService: PlayerService) {}

  ngOnInit() {
    this.loadPlayers();
    
    // Set up search debouncing
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchTerm = searchTerm;
        this.currentPage = 1;
        this.loadPlayers();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlayers() {
    this.loading = true;
    this.error = null;

    this.playerService
      .getPlayers(
        this.currentPage,
        this.pageSize,
        this.searchTerm,
        this.sortBy,
        this.sortDescending
      )
      .subscribe({
        next: (result: PagedResult<Player>) => {
          this.players = result.items;
          this.totalCount = result.totalCount;
          this.totalPages = result.totalPages;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load players. Please try again.';
          this.loading = false;
          console.error('Error loading players:', err);
        }
      });
  }

  onSearch(searchTerm: string) {
    this.searchSubject.next(searchTerm);
  }

  onSort(column: string) {
    if (this.sortBy === column) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortBy = column;
      this.sortDescending = false;
    }
    this.loadPlayers();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPlayers();
    }
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadPlayers();
  }

  deletePlayer(id: string) {
    if (confirm('Are you sure you want to delete this player?')) {
      this.playerService.deletePlayer(id).subscribe({
        next: () => {
          this.loadPlayers();
        },
        error: (err) => {
          this.error = 'Failed to delete player. Please try again.';
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

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return '↕️';
    return this.sortDescending ? '↓' : '↑';
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}