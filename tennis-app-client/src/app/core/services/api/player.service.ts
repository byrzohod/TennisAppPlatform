import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player, CreatePlayer, UpdatePlayer } from '../../models/player.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/players`;

  getAllPlayers(): Observable<Player[]> {
    return this.http.get<Player[]>(this.apiUrl);
  }

  getPlayerById(id: number): Observable<Player> {
    return this.http.get<Player>(`${this.apiUrl}/${id}`);
  }

  getTopPlayers(count: number): Observable<Player[]> {
    return this.http.get<Player[]>(`${this.apiUrl}/top/${count}`);
  }

  createPlayer(player: CreatePlayer): Observable<Player> {
    return this.http.post<Player>(this.apiUrl, player);
  }

  updatePlayer(id: number, player: UpdatePlayer): Observable<Player> {
    return this.http.put<Player>(`${this.apiUrl}/${id}`, player);
  }

  deletePlayer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}