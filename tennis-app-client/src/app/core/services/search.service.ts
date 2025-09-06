import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SearchResult {
  id: string;
  type: 'tournament' | 'player' | 'match';
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

export interface SearchResponse {
  tournaments: SearchResult[];
  players: SearchResult[];
  matches: SearchResult[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly apiUrl = `${environment.apiUrl}/${environment.apiVersion}`;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private http = inject(HttpClient);

  search(query: string): Observable<SearchResult[]> {
    if (!query.trim()) {
      return of([]);
    }

    this.loadingSubject.next(true);

    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, {
      params: { q: query.trim(), limit: '10' }
    }).pipe(
      tap(() => this.loadingSubject.next(false)),
      switchMap(response => {
        const results: SearchResult[] = [
          ...this.mapTournamentResults(response.tournaments || []),
          ...this.mapPlayerResults(response.players || []),
          ...this.mapMatchResults(response.matches || [])
        ];
        return of(results);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        console.error('Search error:', error);
        return of([]);
      })
    );
  }

  private mapTournamentResults(tournaments: unknown[]): SearchResult[] {
    return tournaments.map(tournament => {
      const t = tournament as { id: string; name: string; location: string; status: string };
      return {
        id: t.id,
        type: 'tournament' as const,
        title: t.name,
        subtitle: `${t.location} • ${t.status}`,
        icon: 'trophy',
        route: `/tournaments/${t.id}`
      };
    });
  }

  private mapPlayerResults(players: unknown[]): SearchResult[] {
    return players.map(player => {
      const p = player as { id: string; firstName: string; lastName: string; ranking?: number; country?: string };
      return {
        id: p.id,
        type: 'player' as const,
        title: `${p.firstName} ${p.lastName}`,
        subtitle: `Ranking: ${p.ranking || 'Unranked'} • ${p.country || 'Unknown'}`,
        icon: 'user',
        route: `/players/${p.id}`
      };
    });
  }

  private mapMatchResults(matches: unknown[]): SearchResult[] {
    return matches.map(match => {
      const m = match as { id: string; player1Name: string; player2Name: string; tournamentName: string; round: string };
      return {
        id: m.id,
        type: 'match' as const,
        title: `${m.player1Name} vs ${m.player2Name}`,
        subtitle: `${m.tournamentName} • ${m.round}`,
        icon: 'play',
        route: `/matches/${m.id}`
      };
    });
  }

  // Create debounced search for real-time results
  createDebouncedSearch(searchTerm$: Observable<string>): Observable<SearchResult[]> {
    return searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.search(term))
    );
  }
}