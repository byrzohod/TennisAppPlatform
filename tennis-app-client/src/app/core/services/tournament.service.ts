import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tournament {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  type: string;
  surface: string;
  drawSize: number;
  prizeMoneyUSD: number;
  entryFee: number;
  description?: string;
  status: string;
  playersCount: number;
  maxPlayers: number;
}

export interface Player {
  id: number;
  name: string;
  country: string;
  ranking: number;
  seed?: number;
  age: number;
  height: number;
  weight: number;
  plays: string;
}

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private apiUrl = `${environment.apiUrl}/api/v1/tournaments`;
  private http = inject(HttpClient);

  getTournaments(): Observable<Tournament[]> {
    // Mock data for now - replace with actual HTTP call
    return of([
      {
        id: 1,
        name: 'Wimbledon',
        location: 'London, UK',
        startDate: '2024-07-01',
        endDate: '2024-07-14',
        type: 'Grand Slam',
        surface: 'Grass',
        drawSize: 128,
        prizeMoneyUSD: 50000000,
        entryFee: 0,
        description: 'The oldest tennis tournament',
        status: 'Upcoming',
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
        surface: 'Hard',
        drawSize: 128,
        prizeMoneyUSD: 60000000,
        entryFee: 0,
        description: 'The final Grand Slam of the year',
        status: 'Upcoming',
        playersCount: 89,
        maxPlayers: 128
      }
    ]);
  }

  getTournament(id: number): Observable<Tournament> {
    return this.http.get<Tournament>(`${this.apiUrl}/${id}`);
  }

  createTournament(tournament: Partial<Tournament>): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl, tournament);
  }

  updateTournament(id: number, tournament: Partial<Tournament>): Observable<Tournament> {
    return this.http.put<Tournament>(`${this.apiUrl}/${id}`, tournament);
  }

  deleteTournament(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getRegisteredPlayers(): Observable<Player[]> {
    // Mock data for now
    return of([
      { id: 1, name: 'Roger Federer', country: 'Switzerland', ranking: 8, seed: 1, age: 42, height: 185, weight: 85, plays: 'Right-handed' },
      { id: 2, name: 'Rafael Nadal', country: 'Spain', ranking: 2, seed: 2, age: 37, height: 185, weight: 85, plays: 'Left-handed' },
      { id: 3, name: 'Novak Djokovic', country: 'Serbia', ranking: 1, seed: 3, age: 36, height: 188, weight: 77, plays: 'Right-handed' }
    ]);
  }

  registerPlayer(tournamentId: number, playerId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tournamentId}/players/${playerId}`, {});
  }

  unregisterPlayer(tournamentId: number, playerId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tournamentId}/players/${playerId}`);
  }

  updateSeed(tournamentId: number, playerId: number, seed: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${tournamentId}/players/${playerId}/seed`, { seed });
  }
}