import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TournamentType } from '../../../shared/enums/tournament-type.enum';
import { Surface } from '../../../shared/enums/surface.enum';

import { TournamentListComponent } from './tournament-list.component';
import { TournamentService } from '../../../core/services/tournament.service';
import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';

describe('TournamentListComponent', () => {
  let component: TournamentListComponent;
  let fixture: ComponentFixture<TournamentListComponent>;
  let mockTournamentService: jasmine.SpyObj<TournamentService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockTournaments = [
    {
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
      entryFee: 0,
      playersCount: 45,
      maxPlayers: 128
    },
    {
      id: 2,
      name: 'US Open',
      location: 'New York, USA',
      startDate: '2024-08-26',
      endDate: '2024-09-08',
      type: TournamentType.GrandSlam,
      surface: Surface.HardCourt,
      drawSize: 128,
      status: 'Upcoming',
      prizeMoneyUSD: 60000000,
      entryFee: 0,
      playersCount: 89,
      maxPlayers: 128
    },
    {
      id: 3,
      name: 'French Open',
      location: 'Paris, France',
      startDate: '2024-05-26',
      endDate: '2024-06-09',
      type: TournamentType.GrandSlam,
      surface: Surface.Clay,
      drawSize: 128,
      status: 'In Progress',
      prizeMoneyUSD: 49000000,
      entryFee: 0,
      playersCount: 128,
      maxPlayers: 128
    }
  ];

  beforeEach(async () => {
    mockTournamentService = jasmine.createSpyObj('TournamentService', ['getTournaments']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        TournamentListComponent,
        CardComponent,
        ButtonComponent,
        InputComponent,
        BadgeComponent,
        SkeletonComponent
      ],
      providers: [
        { provide: TournamentService, useValue: mockTournamentService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TournamentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load tournaments on init', () => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
      
      fixture.detectChanges();
      
      expect(mockTournamentService.getTournaments).toHaveBeenCalled();
      expect(component.tournaments).toEqual(mockTournaments);
      // Tournaments are sorted by date newest first by default
      const expectedSorted = [...mockTournaments].sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      expect(component.filteredTournaments).toEqual(expectedSorted);
    });

    it('should handle error when loading tournaments fails', () => {
      const error = new Error('Failed to load');
      mockTournamentService.getTournaments.and.returnValue(throwError(() => error));
      
      fixture.detectChanges();
      
      expect(component.error).toBe('Failed to load');
      expect(component.tournaments.length).toBeGreaterThan(0); // Falls back to mock data
    });

    it('should set loading to false after loading completes', () => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
      
      // Before loading
      component.loading = false;
      
      component.loadTournaments();
      
      // Since we're using 'of()', which is synchronous, loading is already false due to finalize
      // This is the expected behavior with synchronous observables
      expect(component.loading).toBe(false);
      expect(component.tournaments).toEqual(mockTournaments);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
      fixture.detectChanges();
    });

    it('should filter tournaments by search term', () => {
      component.searchTerm = 'wimbledon';
      component.onSearchChange();
      
      expect(component.filteredTournaments.length).toBe(1);
      expect(component.filteredTournaments[0].name).toBe('Wimbledon');
    });

    it('should filter tournaments by location', () => {
      component.searchTerm = 'paris';
      component.onSearchChange();
      
      expect(component.filteredTournaments.length).toBe(1);
      expect(component.filteredTournaments[0].location).toBe('Paris, France');
    });

    it('should filter tournaments by status', () => {
      component.statusFilter = 'In Progress';
      component.onStatusFilterChange();
      
      expect(component.filteredTournaments.length).toBe(1);
      expect(component.filteredTournaments[0].status).toBe('In Progress');
    });

    it('should reset to first page when status filter changes', () => {
      component.currentPage = 3;
      component.statusFilter = 'Upcoming';
      component.onStatusFilterChange();
      
      expect(component.currentPage).toBe(1);
    });

    it('should reset to first page when search changes', () => {
      component.currentPage = 2;
      component.searchTerm = 'test';
      component.onSearchChange();
      
      expect(component.currentPage).toBe(1);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
      fixture.detectChanges();
    });

    it('should sort by date newest first', () => {
      component.sortBy = 'Date (Newest First)';
      component.onSortChange();
      
      // US Open starts on 2024-08-26 (most recent)
      // Wimbledon starts on 2024-07-01 (middle)
      // French Open starts on 2024-05-26 (oldest)
      expect(component.filteredTournaments[0].name).toBe('US Open');
      expect(component.filteredTournaments[1].name).toBe('Wimbledon');
      expect(component.filteredTournaments[2].name).toBe('French Open');
    });

    it('should sort by name alphabetically', () => {
      component.sortBy = 'Name';
      component.onSortChange();
      
      expect(component.filteredTournaments[0].name).toBe('French Open');
      expect(component.filteredTournaments[1].name).toBe('US Open');
      expect(component.filteredTournaments[2].name).toBe('Wimbledon');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
      fixture.detectChanges();
      component.itemsPerPage = 2;
    });

    it('should calculate total pages correctly', () => {
      expect(component.totalPages).toBe(2);
    });

    it('should return correct paginated tournaments', () => {
      component.currentPage = 1;
      expect(component.paginatedTournaments.length).toBe(2);
      
      component.currentPage = 2;
      expect(component.paginatedTournaments.length).toBe(1);
    });

    it('should navigate to valid page', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
    });

    it('should not navigate to invalid page', () => {
      component.currentPage = 1;
      component.goToPage(0);
      expect(component.currentPage).toBe(1);
      
      component.goToPage(10);
      expect(component.currentPage).toBe(1);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
      fixture.detectChanges();
    });

    it('should navigate to create tournament page', () => {
      component.createTournament();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tournaments/create']);
    });

    it('should navigate to tournament details page', () => {
      component.viewTournament(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tournaments', 1]);
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
      expect(component.getSurfaceColor(999 as Surface)).toContain('gray');
    });

    it('should return correct status badge variant', () => {
      expect(component.getStatusBadgeVariant('upcoming')).toBe('info');
      expect(component.getStatusBadgeVariant('in progress')).toBe('warning');
      expect(component.getStatusBadgeVariant('completed')).toBe('success');
      expect(component.getStatusBadgeVariant('cancelled')).toBe('error');
      expect(component.getStatusBadgeVariant('unknown')).toBe('default');
    });

    it('should format prize money correctly', () => {
      expect(component.formatPrizeMoney(50000000)).toBe('$50.0M');
      expect(component.formatPrizeMoney(1500000)).toBe('$1.5M');
      expect(component.formatPrizeMoney(50000)).toBe('$50K');
      expect(component.formatPrizeMoney(500)).toBe('$500');
    });

    it('should count tournaments by status correctly', () => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
      fixture.detectChanges();
      
      expect(component.getUpcomingCount()).toBe(2); // Wimbledon and US Open
      expect(component.getInProgressCount()).toBe(1); // French Open
      expect(component.getCompletedCount()).toBe(0); // None
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
    });

    it('should show loading skeletons when loading', () => {
      // Mock the service to prevent ngOnInit from completing immediately
      const subject = new Subject<typeof mockTournaments>();
      mockTournamentService.getTournaments.and.returnValue(subject.asObservable());
      
      // Initialize component - this will call ngOnInit and set loading to true
      fixture.detectChanges();
      
      // Verify loading state is true (since the observable hasn't completed)
      expect(component.loading).toBe(true);
      
      // Look for skeleton components in the rendered template
      const skeletons = fixture.nativeElement.querySelectorAll('app-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
      
      // Complete the observable to clean up
      subject.next(mockTournaments);
      subject.complete();
    });

    it('should show error state when error occurs', () => {
      fixture.detectChanges(); // Initialize first
      component.loading = false;
      component.error = 'Test error';
      fixture.detectChanges();
      
      const errorText = fixture.nativeElement.textContent;
      expect(errorText).toContain('Error Loading Tournaments');
      expect(errorText).toContain('Test error');
    });

    it('should show empty state when no tournaments', () => {
      fixture.detectChanges(); // Initialize first
      component.loading = false;
      component.filteredTournaments = [];
      fixture.detectChanges();
      
      const emptyText = fixture.nativeElement.textContent;
      expect(emptyText).toContain('No tournaments yet');
    });

    it('should show create button for admin users', () => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
      component.isAdmin = true;
      fixture.detectChanges();
      
      const createBtn = fixture.nativeElement.querySelector('[data-testid="create-tournament-btn"]');
      expect(createBtn).toBeTruthy();
    });

    it('should not show create button for non-admin users', () => {
      mockTournamentService.getTournaments.and.returnValue(of(mockTournaments));
      component.isAdmin = false;
      fixture.detectChanges();
      
      const createBtn = fixture.nativeElement.querySelector('[data-testid="create-tournament-btn"]');
      expect(createBtn).toBeFalsy();
    });
  });
});