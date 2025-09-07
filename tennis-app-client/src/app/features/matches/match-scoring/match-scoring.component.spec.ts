import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchScoringComponent } from './match-scoring.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';

describe('MatchScoringComponent', () => {
  let component: MatchScoringComponent;
  let fixture: ComponentFixture<MatchScoringComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: {
    snapshot: {
      paramMap: {
        get: jasmine.Spy;
      };
    };
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        MatchScoringComponent,
        ButtonComponent,
        CardComponent,
        BadgeComponent
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MatchScoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Match Initialization', () => {
    it('should initialize match with correct data', () => {
      expect(component.matchId).toBe(1);
      expect(component.match.player1.name).toBe('Roger Federer');
      expect(component.match.player2.name).toBe('Rafael Nadal');
      expect(component.match.tournament).toBe('Wimbledon 2024');
    });

    it('should start match with initial score', () => {
      expect(component.score.player1Sets).toBe(0);
      expect(component.score.player2Sets).toBe(0);
      expect(component.score.currentSet).toBe(0);
      expect(component.score.server).toBe(1);
    });

    it('should create first set on match start', () => {
      expect(component.score.sets.length).toBe(1);
      expect(component.score.sets[0].player1Games).toBe(0);
      expect(component.score.sets[0].player2Games).toBe(0);
    });
  });

  describe('Scoring System', () => {
    it('should correctly display tennis scores', () => {
      expect(component.getGameScoreDisplay(0, 0)).toBe('0');
      expect(component.getGameScoreDisplay(1, 0)).toBe('15');
      expect(component.getGameScoreDisplay(2, 0)).toBe('30');
      expect(component.getGameScoreDisplay(3, 0)).toBe('40');
    });

    it('should handle deuce correctly', () => {
      component.score.currentGame = { player1: 3, player2: 3 };
      expect(component.getGameScoreDisplay(3, 3)).toBe('40');
    });

    it('should handle advantage correctly', () => {
      component.score.currentGame = { player1: 4, player2: 3 };
      expect(component.getGameScoreDisplay(4, 3)).toBe('AD');
      expect(component.getGameScoreDisplay(3, 4)).toBe('40');
    });

    it('should score point for player 1', () => {
      component.scorePoint(1, 'ace');
      expect(component.score.currentGame.player1).toBe(1);
      expect(component.pointHistory.length).toBe(1);
      expect(component.pointHistory[0].scorer).toBe(1);
      expect(component.pointHistory[0].type).toBe('ace');
    });

    it('should score point for player 2', () => {
      component.scorePoint(2, 'winner');
      expect(component.score.currentGame.player2).toBe(1);
      expect(component.pointHistory.length).toBe(1);
      expect(component.pointHistory[0].scorer).toBe(2);
      expect(component.pointHistory[0].type).toBe('winner');
    });
  });

  describe('Game Logic', () => {
    it('should detect game won with normal score', () => {
      component.score.currentGame = { player1: 4, player2: 2 };
      expect(component.isGameWon(component.score.currentGame)).toBe(true);
    });

    it('should not end game at deuce', () => {
      component.score.currentGame = { player1: 3, player2: 3 };
      expect(component.isGameWon(component.score.currentGame)).toBe(false);
    });

    it('should require two-point lead after deuce', () => {
      component.score.currentGame = { player1: 4, player2: 3 };
      expect(component.isGameWon(component.score.currentGame)).toBe(false);
      
      component.score.currentGame = { player1: 5, player2: 3 };
      expect(component.isGameWon(component.score.currentGame)).toBe(true);
    });

    it('should update set score when game is won', () => {
      // Win a game for player 1
      component.score.currentGame = { player1: 3, player2: 0 };
      component.scorePoint(1, 'winner');
      
      expect(component.score.sets[0].player1Games).toBe(1);
      expect(component.score.currentGame.player1).toBe(0);
      expect(component.score.currentGame.player2).toBe(0);
    });

    it('should alternate server after each game', () => {
      const initialServer = component.score.server;
      
      // Win a game
      component.score.currentGame = { player1: 3, player2: 0 };
      component.scorePoint(1, 'winner');
      
      expect(component.score.server).toBe(initialServer === 1 ? 2 : 1);
    });
  });

  describe('Set Logic', () => {
    it('should detect set won at 6 games with 2 game lead', () => {
      const set = { player1Games: 6, player2Games: 4, games: [] };
      expect(component.isSetWon(set)).toBe(true);
    });

    it('should not end set at 6-5', () => {
      const set = { player1Games: 6, player2Games: 5, games: [] };
      expect(component.isSetWon(set)).toBe(false);
    });

    it('should detect tiebreak situation at 6-6', () => {
      const set = { player1Games: 6, player2Games: 6, games: [] };
      expect(component.isSetWon(set)).toBe(false); // Tiebreak needed
    });

    it('should update match score when set is won', () => {
      component.score.sets[0].player1Games = 5;
      component.score.sets[0].player2Games = 3;
      
      // Win the set
      component.finishGame(1);
      
      expect(component.score.player1Sets).toBe(1);
    });
  });

  describe('Match Logic', () => {
    it('should detect match won in best of 5', () => {
      component.setsToWin = 3;
      component.score.player1Sets = 3;
      expect(component.isMatchWon()).toBe(true);
    });

    it('should detect match won in best of 3', () => {
      component.setsToWin = 2;
      component.score.player2Sets = 2;
      expect(component.isMatchWon()).toBe(true);
    });

    it('should not end match before reaching required sets', () => {
      component.setsToWin = 3;
      component.score.player1Sets = 2;
      component.score.player2Sets = 2;
      expect(component.isMatchWon()).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should format duration correctly', () => {
      expect(component.formatDuration(45)).toBe('0:45');
      expect(component.formatDuration(125)).toBe('2:05');
      expect(component.formatDuration(3665)).toBe('1:01:05');
    });

    it('should get correct surface color', () => {
      component.match.surface = 'Grass';
      expect(component.getSurfaceColor()).toContain('grass');
      
      component.match.surface = 'Clay';
      expect(component.getSurfaceColor()).toContain('clay');
      
      component.match.surface = 'Hard';
      expect(component.getSurfaceColor()).toContain('hard');
    });

    it('should show server indicator correctly', () => {
      component.score.server = 1;
      expect(component.getServerIndicator(1)).toBe('🎾');
      expect(component.getServerIndicator(2)).toBe('');
      
      component.score.server = 2;
      expect(component.getServerIndicator(1)).toBe('');
      expect(component.getServerIndicator(2)).toBe('🎾');
    });
  });

  describe('Match Controls', () => {
    it('should toggle pause state', () => {
      expect(component.isPaused).toBe(false);
      component.togglePause();
      expect(component.isPaused).toBe(true);
      component.togglePause();
      expect(component.isPaused).toBe(false);
    });

    it('should not score points after match is won', () => {
      component.score.winner = 1;
      const initialHistory = component.pointHistory.length;
      
      component.scorePoint(2, 'winner');
      expect(component.pointHistory.length).toBe(initialHistory);
    });

    it('should navigate back on end match', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.endMatch();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/matches']);
    });

    it('should not navigate if end match is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.endMatch();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Point History', () => {
    it('should add points to history in correct order', () => {
      component.scorePoint(1, 'ace');
      component.scorePoint(2, 'winner');
      component.scorePoint(1, 'forced-error');
      
      expect(component.pointHistory.length).toBe(3);
      expect(component.pointHistory[0].scorer).toBe(1); // Most recent first
      expect(component.pointHistory[0].type).toBe('forced-error');
      expect(component.pointHistory[2].type).toBe('ace'); // Oldest last
    });

    it('should track server in point history', () => {
      component.score.server = 1;
      component.scorePoint(1, 'ace');
      
      expect(component.pointHistory[0].server).toBe(1);
      
      component.score.server = 2;
      component.scorePoint(2, 'ace');
      
      expect(component.pointHistory[0].server).toBe(2);
    });
  });
});