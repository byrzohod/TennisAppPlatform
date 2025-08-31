import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../../core/services/api/tournament.service';
import { Tournament } from '../../../core/models/tournament.model';

@Component({
  selector: 'app-tournament-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tournament-list.html',
  styleUrl: './tournament-list.scss'
})
export class TournamentListComponent implements OnInit {
  tournaments: Tournament[] = [];
  loading = false;

  constructor(private tournamentService: TournamentService) {}

  ngOnInit(): void {
    this.loadTournaments();
  }

  loadTournaments(): void {
    this.loading = true;
    this.tournamentService.getAllTournaments().subscribe({
      next: (data) => {
        this.tournaments = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tournaments:', error);
        this.loading = false;
      }
    });
  }
}
