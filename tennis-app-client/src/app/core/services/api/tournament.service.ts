import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tournament, CreateTournament, UpdateTournament } from '../../models/tournament.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private apiUrl = `${environment.apiUrl}/api/tournaments`;

  constructor(private http: HttpClient) {}

  getAllTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(this.apiUrl);
  }

  getTournamentById(id: number): Observable<Tournament> {
    return this.http.get<Tournament>(`${this.apiUrl}/${id}`);
  }

  getUpcomingTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(`${this.apiUrl}/upcoming`);
  }

  getActiveTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(`${this.apiUrl}/active`);
  }

  createTournament(tournament: CreateTournament): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl, tournament);
  }

  updateTournament(id: number, tournament: UpdateTournament): Observable<Tournament> {
    return this.http.put<Tournament>(`${this.apiUrl}/${id}`, tournament);
  }

  deleteTournament(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}