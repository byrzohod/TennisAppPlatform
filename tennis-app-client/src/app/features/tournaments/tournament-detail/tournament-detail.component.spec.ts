import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { Surface } from '../../../shared/enums/surface.enum';
import { TournamentType } from '../../../shared/enums/tournament-type.enum';
import { TournamentService } from '../../../core/services/tournament.service';
import { PlayerService } from '../../../core/services/player.service';

import { TournamentDetailComponent } from './tournament-detail.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';

describe('TournamentDetailComponent', () => {
  let component: TournamentDetailComponent;
  let fixture: ComponentFixture<TournamentDetailComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: { snapshot: { params: { id: string } } };
  let mockHttpClient: jasmine.SpyObj<HttpClient>;
  let mockTournamentService: jasmine.SpyObj<TournamentService>;
  let mockPlayerService: jasmine.SpyObj<PlayerService>;

  const mockTournament = {
    id: 1,
    name: 'Wimbledon',
    location: 'London, UK',
    startDate: '2024-07-01',
    endDate: '2024-07-14',
    type: TournamentType.GrandSlam,
    surface: Surface.Grass,
    drawSize: 128,
    status: 'Upcoming',
    prizeMoneyUSD: 50000000,
    description: 'The oldest tennis tournament in the world',
    entryFee: 1000,
    playersCount: 0,
    maxPlayers: 128
  };

  const mockPlayers = [
    {
      id: 1,
      firstName: 'Novak',
      lastName: 'Djokovic',
      country: 'Serbia',
      ranking: 1,
      seed: 1,
      status: 'Registered'
    },
    {
      id: 2,
      firstName: 'Carlos',
      lastName: 'Alcaraz',
      country: 'Spain',
      ranking: 2,
      seed: 2,
      status: 'Registered'
    }
  ];

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);
    mockTournamentService = jasmine.createSpyObj('TournamentService', [
      'getTournament', 
      'getRegisteredPlayers',
      'registerPlayer',
      'unregisterPlayer',
      'deleteTournament',
      'updateSeed'
    ]);
    mockPlayerService = jasmine.createSpyObj('PlayerService', ['getPlayers']);
    
    // Setup default return values
    mockTournamentService.getTournament.and.returnValue(of(mockTournament));
    mockTournamentService.getRegisteredPlayers.and.returnValue(of([
      {
        id: 1,
        name: 'Novak Djokovic',
        country: 'Serbia',
        ranking: 1,
        seed: 1,
        age: 36,
        height: 188,
        weight: 77,
        plays: 'Right-handed'
      },
      {
        id: 2,
        name: 'Carlos Alcaraz',
        country: 'Spain',
        ranking: 2,
        seed: 2,
        age: 20,
        height: 183,
        weight: 74,
        plays: 'Right-handed'
      }
    ]));
    mockTournamentService.registerPlayer.and.returnValue(of(void 0));
    mockTournamentService.unregisterPlayer.and.returnValue(of(void 0));
    mockTournamentService.deleteTournament.and.returnValue(of(void 0));
    mockTournamentService.updateSeed.and.returnValue(of(void 0));
    mockPlayerService.getPlayers.and.returnValue(of({
      items: [
        { id: '3', firstName: 'Rafael', lastName: 'Nadal', country: 'Spain', rankingPoints: 5000, email: 'rafael@example.com', createdAt: '2024-01-01' },
        { id: '4', firstName: 'Daniil', lastName: 'Medvedev', country: 'Russia', rankingPoints: 4000, email: 'daniil@example.com', createdAt: '2024-01-01' }
      ],
      totalCount: 2,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1
    }));
    
    mockActivatedRoute = {
      snapshot: {
        params: { id: '1' }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        TournamentDetailComponent,
        CardComponent,
        ButtonComponent,
        BadgeComponent,
        SkeletonComponent
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: TournamentService, useValue: mockTournamentService },
        { provide: PlayerService, useValue: mockPlayerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load tournament on init', () => {
      fixture.detectChanges();
      
      expect(component.tournament).toBeTruthy();
      expect(component.tournament?.name).toBe('Wimbledon');
      expect(component.tournament?.id).toBe(1);
    });

    it('should load players on init', () => {
      fixture.detectChanges();
      
      expect(component.players.length).toBe(2);
      expect(component.players[0].firstName).toBe('Novak');
    });

    it('should load available players on init', () => {
      fixture.detectChanges();
      
      expect(component.availablePlayers.length).toBeGreaterThan(0);
    });

    it('should initialize with overview tab active', () => {
      expect(component.activeTab).toBe('overview');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch tabs when selectTab is called', () => {
      component.selectTab('players');
      expect(component.activeTab).toBe('players');
      
      component.selectTab('bracket');
      expect(component.activeTab).toBe('bracket');
    });
  });

  describe('Admin Actions', () => {
    beforeEach(() => {
      component.tournament = mockTournament;
      component.isAdmin = true;
    });

    it('should navigate to edit page when editTournament is called', () => {
      component.editTournament();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tournaments', 1, 'edit']);
    });

    it('should navigate to tournaments list when deleteTournament is confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.deleteTournament();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tournaments']);
    });

    it('should not navigate when deleteTournament is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteTournament();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Player Registration Modal', () => {
    it('should open registration modal', () => {
      component.openRegisterModal();
      expect(component.showRegisterModal).toBe(true);
    });

    it('should close registration modal and reset state', () => {
      component.showRegisterModal = true;
      component.selectedPlayerId = '1';
      component.playerSearchTerm = 'test';
      
      component.closeRegisterModal();
      
      expect(component.showRegisterModal).toBe(false);
      expect(component.selectedPlayerId).toBeNull();
      expect(component.playerSearchTerm).toBe('');
    });

    it('should select a player', () => {
      component.selectPlayer('3');
      expect(component.selectedPlayerId).toBe('3');
    });

    it('should confirm registration and add player', () => {
      component.tournament = mockTournament;
      component.availablePlayers = [
        { id: '3', firstName: 'Rafael', lastName: 'Nadal', country: 'Spain', rankingPoints: 3000, email: 'rafael@example.com', createdAt: '2024-01-01' }
      ];
      component.selectedPlayerId = '3';
      
      component.confirmRegistration();
      
      expect(mockTournamentService.registerPlayer).toHaveBeenCalledWith(1, 3);
    });
  });

  describe('Player Management', () => {
    beforeEach(() => {
      component.players = mockPlayers.map(p => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        country: p.country,
        ranking: p.ranking,
        seed: p.seed,
        age: 30,
        height: 180,
        weight: 75,
        plays: 'Right-handed',
        firstName: p.firstName,
        lastName: p.lastName,
        status: p.status
      }));
    });

    it('should update player seed', () => {
      component.updateSeed(1, '5');
      const player = component.players.find(p => p.id === 1);
      expect(player?.seed).toBe(5);
    });

    it('should handle empty seed value', () => {
      component.updateSeed(1, '');
      const player = component.players.find(p => p.id === 1);
      expect(player?.seed).toBeUndefined();
    });

    it('should save seed', () => {
      component.tournament = mockTournament;
      component.players = mockPlayers.map(p => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        country: p.country,
        ranking: p.ranking,
        seed: p.seed,
        age: 30,
        height: 180,
        weight: 75,
        plays: 'Right-handed',
        firstName: p.firstName,
        lastName: p.lastName,
        status: p.status
      }));
      component.saveSeed(1);
      expect(mockTournamentService.updateSeed).toHaveBeenCalledWith(1, 1, 1);
    });

    it('should withdraw player when confirmed', () => {
      component.tournament = mockTournament;
      spyOn(window, 'confirm').and.returnValue(true);
      component.withdrawPlayer(1);
      
      expect(mockTournamentService.unregisterPlayer).toHaveBeenCalledWith(1, 1);
    });

    it('should not withdraw player when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const initialStatus = component.players.find(p => p.id === 1)?.status;
      
      component.withdrawPlayer(1);
      
      const player = component.players.find(p => p.id === 1);
      expect(player?.status).toBe(initialStatus);
    });
  });

  describe('Player Search', () => {
    beforeEach(() => {
      component.availablePlayers = [
        { id: '3', firstName: 'Rafael', lastName: 'Nadal', country: 'Spain', rankingPoints: 3000, email: 'rafael@example.com', createdAt: '2024-01-01' },
        { id: '4', firstName: 'Daniil', lastName: 'Medvedev', country: 'Russia', rankingPoints: 2500, email: 'daniil@example.com', createdAt: '2024-01-01' }
      ];
    });

    it('should filter players by first name', () => {
      component.playerSearchTerm = 'rafael';
      const filtered = component.filteredAvailablePlayers;
      expect(filtered.length).toBe(1);
      expect(filtered[0].firstName).toBe('Rafael');
    });

    it('should filter players by last name', () => {
      component.playerSearchTerm = 'medv';
      const filtered = component.filteredAvailablePlayers;
      expect(filtered.length).toBe(1);
      expect(filtered[0].lastName).toBe('Medvedev');
    });

    it('should return all players when search is empty', () => {
      component.playerSearchTerm = '';
      const filtered = component.filteredAvailablePlayers;
      expect(filtered.length).toBe(2);
    });
  });

  describe('Utility Methods', () => {
    it('should return correct surface icon', () => {
      expect(component.getSurfaceIcon(Surface.Grass)).toBe('🌱');
      expect(component.getSurfaceIcon(Surface.Clay)).toBe('🧱');
      expect(component.getSurfaceIcon(Surface.HardCourt)).toBe('🏟️');
      expect(component.getSurfaceIcon(999 as Surface)).toBe('🎾');
    });

    it('should return correct surface color classes', () => {
      expect(component.getSurfaceColor(Surface.Grass)).toContain('grass');
      expect(component.getSurfaceColor(Surface.Clay)).toContain('clay');
      expect(component.getSurfaceColor(Surface.HardCourt)).toContain('hard');
    });

    it('should return correct status badge variant', () => {
      expect(component.getStatusBadgeVariant('upcoming')).toBe('info');
      expect(component.getStatusBadgeVariant('in progress')).toBe('warning');
      expect(component.getStatusBadgeVariant('completed')).toBe('success');
      expect(component.getStatusBadgeVariant('cancelled')).toBe('error');
    });

    it('should format prize money correctly', () => {
      expect(component.formatPrizeMoney(50000000)).toBe('$50.0M');
      expect(component.formatPrizeMoney(1500000)).toBe('$1.5M');
      expect(component.formatPrizeMoney(50000)).toBe('$50K');
      expect(component.formatPrizeMoney(500)).toBe('$500');
    });

    it('should return correct tab icon', () => {
      expect(component.getTabIcon('overview')).toBe('📋');
      expect(component.getTabIcon('players')).toBe('👥');
      expect(component.getTabIcon('bracket')).toBe('🏆');
      expect(component.getTabIcon('matches')).toBe('🎾');
      expect(component.getTabIcon('results')).toBe('📊');
    });
  });

  describe('Tournament Status', () => {
    it('should identify tournament in progress', () => {
      component.tournament = { ...mockTournament, status: 'In Progress' };
      expect(component.isInProgress).toBe(true);
    });

    it('should identify tournament not in progress', () => {
      component.tournament = { ...mockTournament, status: 'Upcoming' };
      expect(component.isInProgress).toBe(false);
    });
  });
});