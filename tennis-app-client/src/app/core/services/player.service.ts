import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  rankingPoints: number;
  currentRanking?: number;
  profileImageUrl?: string;
  country?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PlayerCreateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface PlayerUpdateDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  rankingPoints?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/v1/players`;

  getPlayers(
    pageNumber = 1,
    pageSize = 10,
    searchTerm?: string,
    sortBy?: string,
    sortDescending = false
  ): Observable<PagedResult<Player>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }
    params = params.set('sortDescending', sortDescending.toString());

    return this.http.get<Player[]>(this.apiUrl, { params }).pipe(
      map((players: Player[]) => {
        const totalCount = players.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        
        return {
          items: players,
          totalCount,
          pageNumber,
          pageSize,
          totalPages
        } as PagedResult<Player>;
      })
    );
  }

  getPlayer(id: string): Observable<Player> {
    return this.http.get<Player>(`${this.apiUrl}/${id}`);
  }

  createPlayer(player: PlayerCreateDto): Observable<Player> {
    return this.http.post<Player>(this.apiUrl, player);
  }

  updatePlayer(id: string, player: PlayerUpdateDto): Observable<Player> {
    return this.http.put<Player>(`${this.apiUrl}/${id}`, player);
  }

  deletePlayer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  searchPlayers(searchTerm: string): Observable<Player[]> {
    const params = new HttpParams()
      .set('searchTerm', searchTerm)
      .set('pageSize', '20');
    
    return this.http.get<Player[]>(`${this.apiUrl}/search`, { params });
  }
}