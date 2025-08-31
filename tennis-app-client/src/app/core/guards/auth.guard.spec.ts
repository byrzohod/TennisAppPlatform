import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = guard.canActivate(
      {} as any,
      { url: '/protected' } as any
    );

    expect(result).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should deny access and redirect to login when not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = guard.canActivate(
      {} as any,
      { url: '/protected' } as any
    );

    expect(result).toBe(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: '/protected' } }
    );
  });

  it('should preserve the attempted URL in query params', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    const attemptedUrl = '/tournaments/123/details';

    guard.canActivate(
      {} as any,
      { url: attemptedUrl } as any
    );

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: attemptedUrl } }
    );
  });
});