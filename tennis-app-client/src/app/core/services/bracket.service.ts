import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BracketMatch {
  matchId: number;
  round: number;
  position: number;
  player1?: string;
  player2?: string;
  seed1?: number;
  seed2?: number;
  winner?: string;
  score?: string;
  courtNumber?: number;
  scheduledTime?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Bracket {
  id: number;
  tournamentId: number;
  type: 'Main' | 'Qualifying' | 'Consolation';
  drawSize: number;
  rounds: BracketMatch[][];
  createdAt: string;
  updatedAt: string;
}

export interface BracketGenerationOptions {
  type: 'Main' | 'Qualifying' | 'Consolation';
  drawSize: number;
  autoSeed: boolean;
  manualSeeds?: { playerId: number; seed: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class BracketService {
  private apiUrl = `${environment.apiUrl}/api/v1/brackets`;

  constructor(private http: HttpClient) {}

  getBracket(tournamentId: number): Observable<Bracket> {
    return this.http.get<Bracket>(`${this.apiUrl}/tournament/${tournamentId}`);
  }

  generateBracket(tournamentId: number, options: BracketGenerationOptions): Observable<Bracket> {
    return this.http.post<Bracket>(`${this.apiUrl}/tournament/${tournamentId}/generate`, options);
  }

  regenerateBracket(tournamentId: number, options: BracketGenerationOptions): Observable<Bracket> {
    return this.http.put<Bracket>(`${this.apiUrl}/tournament/${tournamentId}/regenerate`, options);
  }

  updateMatch(matchId: number, updates: Partial<BracketMatch>): Observable<BracketMatch> {
    return this.http.put<BracketMatch>(`${this.apiUrl}/matches/${matchId}`, updates);
  }

  startMatch(matchId: number): Observable<BracketMatch> {
    return this.http.post<BracketMatch>(`${this.apiUrl}/matches/${matchId}/start`, {});
  }

  completeMatch(matchId: number, winnerId: number, score: string): Observable<BracketMatch> {
    return this.http.post<BracketMatch>(`${this.apiUrl}/matches/${matchId}/complete`, { winnerId, score });
  }

  swapPlayers(matchId: number, position1: number, position2: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/matches/${matchId}/swap`, { position1, position2 });
  }

  exportBracket(tournamentId: number, format: 'pdf' | 'excel' | 'image'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tournament/${tournamentId}/export/${format}`, {
      responseType: 'blob'
    });
  }

  getPublicBracketUrl(tournamentId: number): string {
    return `${environment.apiUrl}/public/brackets/${tournamentId}`;
  }

  // Mock method for getting sample bracket data
  getMockBracket(drawSize: number): Bracket {
    const rounds: BracketMatch[][] = [];
    const totalRounds = Math.log2(drawSize);
    
    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = drawSize / Math.pow(2, round);
      const roundMatches: BracketMatch[] = [];
      
      for (let match = 1; match <= matchesInRound; match++) {
        roundMatches.push({
          matchId: rounds.flat().length + match,
          round,
          position: match,
          status: 'pending',
          player1: round === 1 ? `Player ${(match - 1) * 2 + 1}` : undefined,
          player2: round === 1 ? `Player ${(match - 1) * 2 + 2}` : undefined,
          seed1: round === 1 && match <= 8 ? (match - 1) * 2 + 1 : undefined,
          seed2: round === 1 && match <= 8 ? (match - 1) * 2 + 2 : undefined
        });
      }
      rounds.push(roundMatches);
    }

    return {
      id: 1,
      tournamentId: 1,
      type: 'Main',
      drawSize,
      rounds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}