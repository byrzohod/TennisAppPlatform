import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { CardComponent } from '../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../shared/components/ui/button/button.component';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: of({ email: 'test@example.com' })
    });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, CardComponent, ButtonComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with mock data', () => {
    expect(component.stats.totalPlayers).toBe(156);
    expect(component.stats.activeTournaments).toBe(8);
    expect(component.stats.upcomingMatches).toBe(24);
    expect(component.stats.recentResults).toBe(12);
  });

  it('should have quick actions configured', () => {
    expect(component.quickActions).toBeDefined();
    expect(component.quickActions.length).toBe(4);
    
    const actionTitles = component.quickActions.map(action => action.title);
    expect(actionTitles).toContain('View Players');
    expect(actionTitles).toContain('Tournaments');
    expect(actionTitles).toContain('My Profile');
    expect(actionTitles).toContain('Schedule');
  });

  it('should have recent activities configured', () => {
    expect(component.recentActivities).toBeDefined();
    expect(component.recentActivities.length).toBe(3);
    
    const activityTypes = component.recentActivities.map(activity => activity.type);
    expect(activityTypes).toContain('tournament');
    expect(activityTypes).toContain('player');
    expect(activityTypes).toContain('match');
  });

  it('should display user email in welcome message', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Welcome back, test@example.com!');
  });

  it('should call logout method when logout button is clicked', () => {
    const authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should render stats cards with correct values', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('156');
    expect(compiled.textContent).toContain('Total Players');
    expect(compiled.textContent).toContain('8');
    expect(compiled.textContent).toContain('Active Tournaments');
    expect(compiled.textContent).toContain('24');
    expect(compiled.textContent).toContain('Upcoming Matches');
    expect(compiled.textContent).toContain('12');
    expect(compiled.textContent).toContain('Recent Results');
  });

  it('should render quick action buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('View Players');
    expect(compiled.textContent).toContain('Tournaments');
    expect(compiled.textContent).toContain('My Profile');
    expect(compiled.textContent).toContain('Schedule');
  });

  it('should render recent activities', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('New tournament "Summer Open" created');
    expect(compiled.textContent).toContain('Player John Doe registered');
    expect(compiled.textContent).toContain('Match result updated: Smith vs Johnson');
  });

  it('should have logout button with correct testid', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector('[data-testid="logout-button"]');
    
    expect(logoutButton).toBeTruthy();
    expect(logoutButton?.textContent?.trim()).toBe('Logout');
  });
});
