import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  
  const mockAuthResponse: AuthResponse = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxOTk5OTk5OTk5fQ.Vg30C57s3l90JNap_VgMhKZjfc-p7SoBXaSAy8c6BS8',
    email: 'test@example.com',
    userId: '123',
    expiresAt: new Date(Date.now() + 3600000)
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: spy }
      ]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should authenticate user and store token', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(loginRequest).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(localStorage.getItem('authToken')).toBe(mockAuthResponse.token);
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      req.flush(mockAuthResponse);
    });

    it('should handle login error', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      service.login(loginRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(service.isAuthenticated()).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('should register user and store token', (done) => {
      const registerRequest: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      service.register(registerRequest).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(localStorage.getItem('authToken')).toBe(mockAuthResponse.token);
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should clear token and redirect to login', () => {
      // Setup: Set token and user
      localStorage.setItem('authToken', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '123', email: 'test@example.com' }));

      service.logout();

      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getCurrentUser()).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('token management', () => {
    it('should get token from localStorage', () => {
      const testToken = 'test-token-123';
      localStorage.setItem('authToken', testToken);

      expect(service.getToken()).toBe(testToken);
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });

    xit('should validate token expiration', () => {
      // Valid token (expires in future)
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxOTk5OTk5OTk5fQ.Vg30C57s3l90JNap_VgMhKZjfc-p7SoBXaSAy8c6BS8';
      localStorage.setItem('authToken', validToken);
      
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should detect expired token', () => {
      // Expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjoxMDAwMDAwMDAwfQ.FPfUBn1DHryJQoRns-ficUZsUUvSb3QTDXPH72ZM_CE';
      localStorage.setItem('authToken', expiredToken);
      
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('user management', () => {
    xit('should get current user from storage', () => {
      const userData = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      expect(service.getCurrentUser()).toEqual(userData);
    });

    it('should emit user changes to subscribers', (done) => {
      service.currentUser$.subscribe(user => {
        if (user) {
          expect(user.email).toBe('test@example.com');
          done();
        }
      });

      service.login({
        email: 'test@example.com',
        password: 'password123'
      }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/auth/login`);
      req.flush(mockAuthResponse);
    });
  });
});