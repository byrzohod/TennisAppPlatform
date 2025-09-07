import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, interval, takeUntil } from 'rxjs';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

interface GameScore {
  player1: number;
  player2: number;
  winner?: 1 | 2;
}

interface SetScore {
  games: GameScore[];
  player1Games: number;
  player2Games: number;
  tiebreak?: GameScore;
  winner?: 1 | 2;
}

interface MatchScore {
  sets: SetScore[];
  currentSet: number;
  currentGame: GameScore;
  server: 1 | 2;
  player1Sets: number;
  player2Sets: number;
  winner?: 1 | 2;
}

interface PointHistory {
  timestamp: Date;
  scorer: 1 | 2;
  score: string;
  server: 1 | 2;
  type: 'ace' | 'winner' | 'forced-error' | 'unforced-error' | 'double-fault';
}

@Component({
  selector: 'app-match-scoring',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CardComponent,
    BadgeComponent
  ],
  templateUrl: './match-scoring.component.html',
  styleUrl: './match-scoring.component.scss'
})
export class MatchScoringComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  matchId!: number;
  match = {
    player1: { name: 'Roger Federer', ranking: 3 },
    player2: { name: 'Rafael Nadal', ranking: 2 },
    tournament: 'Wimbledon 2024',
    round: 'Final',
    court: 'Centre Court',
    surface: 'Grass'
  };

  score: MatchScore = {
    sets: [],
    currentSet: 0,
    currentGame: { player1: 0, player2: 0 },
    server: 1,
    player1Sets: 0,
    player2Sets: 0
  };

  pointHistory: PointHistory[] = [];
  matchDuration = 0;
  matchStartTime?: Date;
  isPaused = false;
  
  // Tennis scoring display
  tennisScores = ['0', '15', '30', '40'];
  
  // Configuration
  setsToWin = 3; // Best of 5
  tiebreakAt = 6;
  finalSetTiebreak = true;

  ngOnInit() {
    this.matchId = +this.route.snapshot.paramMap.get('id')!;
    this.startMatch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startMatch() {
    this.matchStartTime = new Date();
    this.score.sets.push(this.createNewSet());
    
    // Start duration counter
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isPaused && this.matchStartTime) {
          this.matchDuration = Math.floor((Date.now() - this.matchStartTime.getTime()) / 1000);
        }
      });
  }

  createNewSet(): SetScore {
    return {
      games: [],
      player1Games: 0,
      player2Games: 0
    };
  }

  scorePoint(player: 1 | 2, pointType: PointHistory['type'] = 'winner') {
    if (this.score.winner) return;

    const game = this.score.currentGame;
    
    // Add point to history
    this.pointHistory.unshift({
      timestamp: new Date(),
      scorer: player,
      score: this.getScoreDisplay(),
      server: this.score.server,
      type: pointType
    });

    // Update game score
    if (player === 1) {
      game.player1++;
    } else {
      game.player2++;
    }

    // Check if game is won
    if (this.isGameWon(game)) {
      this.finishGame(player);
    }
  }

  isGameWon(game: GameScore): boolean {
    const p1 = game.player1;
    const p2 = game.player2;
    
    // Regular game
    if (p1 >= 4 || p2 >= 4) {
      return Math.abs(p1 - p2) >= 2;
    }
    
    return false;
  }

  finishGame(winner: 1 | 2) {
    const currentSet = this.score.sets[this.score.currentSet];
    
    // Update set score
    if (winner === 1) {
      currentSet.player1Games++;
    } else {
      currentSet.player2Games++;
    }

    // Add game to set history
    currentSet.games.push({
      ...this.score.currentGame,
      winner
    });

    // Check if set is won
    if (this.isSetWon(currentSet)) {
      this.finishSet(winner);
    } else {
      // Start new game
      this.score.currentGame = { player1: 0, player2: 0 };
      this.score.server = this.score.server === 1 ? 2 : 1; // Alternate server
    }
  }

  isSetWon(set: SetScore): boolean {
    const p1 = set.player1Games;
    const p2 = set.player2Games;
    
    // Regular set win (6 games with 2 game lead)
    if (p1 >= 6 || p2 >= 6) {
      if (Math.abs(p1 - p2) >= 2) {
        return true;
      }
    }
    
    // Tiebreak at 6-6
    if (p1 === this.tiebreakAt && p2 === this.tiebreakAt) {
      // Start tiebreak logic
      return false; // Will be handled by tiebreak
    }
    
    return false;
  }

  finishSet(winner: 1 | 2) {
    const currentSet = this.score.sets[this.score.currentSet];
    currentSet.winner = winner;
    
    // Update match score
    if (winner === 1) {
      this.score.player1Sets++;
    } else {
      this.score.player2Sets++;
    }

    // Check if match is won
    if (this.isMatchWon()) {
      this.finishMatch(winner);
    } else {
      // Start new set
      this.score.currentSet++;
      this.score.sets.push(this.createNewSet());
      this.score.currentGame = { player1: 0, player2: 0 };
    }
  }

  isMatchWon(): boolean {
    return this.score.player1Sets >= this.setsToWin || 
           this.score.player2Sets >= this.setsToWin;
  }

  finishMatch(winner: 1 | 2) {
    this.score.winner = winner;
    // Save match result
  }

  getScoreDisplay(): string {
    const game = this.score.currentGame;
    const p1Score = this.getGameScoreDisplay(game.player1, game.player2);
    const p2Score = this.getGameScoreDisplay(game.player2, game.player1);
    
    return `${p1Score}-${p2Score}`;
  }

  getGameScoreDisplay(playerScore: number, opponentScore: number): string {
    if (playerScore <= 3 && opponentScore <= 3) {
      return this.tennisScores[playerScore];
    }
    
    // Deuce situations
    if (playerScore >= 3 && opponentScore >= 3) {
      if (playerScore === opponentScore) return '40';
      if (playerScore > opponentScore) return 'AD';
      return '40';
    }
    
    return this.tennisScores[Math.min(playerScore, 3)];
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  undoLastPoint() {
    if (this.pointHistory.length === 0) return;
    
    this.pointHistory.shift();
    // Complex undo logic would go here
    // This is simplified for demonstration
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  endMatch() {
    if (confirm('Are you sure you want to end this match?')) {
      this.router.navigate(['/matches']);
    }
  }

  getSurfaceColor(): string {
    switch(this.match.surface?.toLowerCase()) {
      case 'grass': return 'bg-grass-100 text-grass-700';
      case 'clay': return 'bg-clay-100 text-clay-700';
      case 'hard': return 'bg-hard-100 text-hard-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getServerIndicator(player: 1 | 2): string {
    return this.score.server === player ? '🎾' : '';
  }
}