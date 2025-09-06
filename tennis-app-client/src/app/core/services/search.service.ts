import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SearchResult {
  id: string;
  type: 'tournament' | 'player' | 'match' | 'quick-action';
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
      return of(this.getQuickActions());
    }

    // For now, return mock data combined with quick actions
    // TODO: Replace with actual API call when backend search endpoint is ready
    const mockResults = this.getMockSearchResults(query.toLowerCase());
    const filteredQuickActions = this.getQuickActions().filter(action =>
      action.title.toLowerCase().includes(query.toLowerCase()) ||
      action.subtitle.toLowerCase().includes(query.toLowerCase())
    );
    
    return of([...mockResults, ...filteredQuickActions]);
  }

  private getMockSearchResults(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    
    // Mock tournaments
    const tournaments = [
      { id: '1', name: 'Summer Championship', location: 'New York', status: 'Upcoming' },
      { id: '2', name: 'Spring Open', location: 'Miami', status: 'Registration Open' },
      { id: '3', name: 'Winter Classic', location: 'Boston', status: 'Completed' }
    ];
    
    results.push(...tournaments
      .filter(t => t.name.toLowerCase().includes(query))
      .map(t => ({
        id: t.id,
        type: 'tournament' as const,
        title: t.name,
        subtitle: `${t.location} • ${t.status}`,
        icon: 'trophy',
        route: `/tournaments/${t.id}`
      }))
    );
    
    // Mock players
    const players = [
      { id: '1', firstName: 'John', lastName: 'Smith', ranking: 5, country: 'USA' },
      { id: '2', firstName: 'Sarah', lastName: 'Johnson', ranking: 3, country: 'UK' },
      { id: '3', firstName: 'Mike', lastName: 'Davis', ranking: 12, country: 'Canada' }
    ];
    
    results.push(...players
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(query))
      .map(p => ({
        id: p.id,
        type: 'player' as const,
        title: `${p.firstName} ${p.lastName}`,
        subtitle: `Ranking: ${p.ranking} • ${p.country}`,
        icon: 'user',
        route: `/players/${p.id}`
      }))
    );
    
    return results.slice(0, 6);
  }
  
  private getQuickActions(): SearchResult[] {
    return [
      {
        id: 'create-tournament',
        type: 'quick-action',
        title: 'Create New Tournament',
        subtitle: 'Start a new tournament',
        icon: 'plus-circle',
        route: '/tournaments/new'
      },
      {
        id: 'add-player',
        type: 'quick-action',
        title: 'Add New Player',
        subtitle: 'Register a new player',
        icon: 'user-plus',
        route: '/players/new'
      },
      {
        id: 'view-rankings',
        type: 'quick-action',
        title: 'View Rankings',
        subtitle: 'See current player rankings',
        icon: 'chart-bar',
        route: '/rankings'
      },
      {
        id: 'recent-matches',
        type: 'quick-action',
        title: 'Recent Matches',
        subtitle: 'View recent match results',
        icon: 'clock',
        route: '/matches'
      }
    ];
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