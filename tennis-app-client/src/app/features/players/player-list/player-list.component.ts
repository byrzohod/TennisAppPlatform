import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PlayerService, Player, PagedResult } from '../../../core/services/player.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { DataTableComponent, TableColumn, TableConfig } from '../../../shared/components/ui/data-table/data-table.component';

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, DataTableComponent],
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.scss'
})
export class PlayerListComponent implements OnInit, OnDestroy {
  private playerService = inject(PlayerService);
  private router = inject(Router);

  players: Player[] = [];
  loading = false;
  error: string | null = null;
  
  // Data table configuration
  columns: TableColumn[] = [
    { 
      key: 'firstName', 
      label: 'First Name', 
      sortable: true
    },
    { 
      key: 'lastName', 
      label: 'Last Name', 
      sortable: true
    },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'phone', 
      label: 'Phone', 
      sortable: false,
      format: (value: unknown) => (value as string) || 'N/A'
    },
    { 
      key: 'dateOfBirth', 
      label: 'Age', 
      sortable: true,
      format: (value: unknown) => {
        if (!value) return 'N/A';
        return String(this.getAge(value as string));
      }
    },
    { 
      key: 'rankingPoints', 
      label: 'Points', 
      sortable: true,
      type: 'number'
    },
    { 
      key: 'currentRanking', 
      label: 'Ranking', 
      sortable: true,
      type: 'badge',
      format: (value: unknown) => value ? `#${value}` : 'Unranked'
    }
  ];

  tableConfig: TableConfig = {
    searchable: true,
    exportable: true,
    selectable: false,
    striped: true,
    hoverable: true,
    bordered: false,
    compact: false,
    responsive: true,
    pageSize: 10,
    pageSizes: [10, 25, 50, 100]
  };
  
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadPlayers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPlayers() {
    this.loading = true;
    this.error = null;

    // For now, load all players - the data table will handle client-side pagination/filtering
    // In a real app, you'd implement server-side pagination through the data table
    this.playerService
      .getPlayers(1, 1000, '', 'lastName', false) // Get all players
      .subscribe({
        next: (result: PagedResult<Player>) => {
          this.players = result.items;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load players. Please try again.';
          this.loading = false;
          console.error('Error loading players:', err);
        }
      });
  }

  onRowAction(event: { action: string; item: Player }) {
    switch (event.action) {
      case 'view':
        this.router.navigate(['/players', event.item.id]);
        break;
      case 'edit':
        this.router.navigate(['/players', event.item.id, 'edit']);
        break;
      case 'delete':
        this.deletePlayer(event.item.id);
        break;
    }
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

  onAddPlayer() {
    this.router.navigate(['/players/new']);
  }
}