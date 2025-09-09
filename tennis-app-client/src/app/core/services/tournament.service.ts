import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TournamentType } from '../../shared/enums/tournament-type.enum';
import { Surface } from '../../shared/enums/surface.enum';

export interface Tournament {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  type: TournamentType;
  surface: Surface;
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
    return this.http.get<Tournament[]>(this.apiUrl);
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

  getRegisteredPlayers(tournamentId: number): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.apiUrl}/${tournamentId}/players`);
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