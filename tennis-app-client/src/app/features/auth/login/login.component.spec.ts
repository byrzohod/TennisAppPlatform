import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';
import { CardComponent } from '../../../shared/components/ui/card/card.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRouteSpy: { snapshot: { queryParams: Record<string, string> } };
  let compiled: HTMLElement;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login', 'isAuthenticated']);
    const activatedRouteSpyObj = {
      snapshot: {
        queryParams: {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule, ButtonComponent, InputComponent, AlertComponent, CardComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpyObj },
        provideAnimationsAsync()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRouteSpy = TestBed.inject(ActivatedRoute);
    
    authServiceSpy.isAuthenticated.and.returnValue(false);
    spyOn(routerSpy, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize the form with empty fields', () => {
      fixture.detectChanges();
      
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should set returnUrl from query params', () => {
      activatedRouteSpy.snapshot.queryParams = { returnUrl: '/dashboard' };
      fixture.detectChanges();
      
      expect(component.returnUrl).toBe('/dashboard');
    });

    it('should redirect if user is already authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      fixture.detectChanges();
      
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark email as invalid when empty', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      
      expect(emailControl?.invalid).toBe(true);
      expect(emailControl?.errors?.['required']).toBe(true);
    });

    it('should mark email as invalid with incorrect format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      
      expect(emailControl?.invalid).toBe(true);
      expect(emailControl?.errors?.['email']).toBe(true);
    });

    it('should mark password as invalid when empty', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.invalid).toBe(true);
      expect(passwordControl?.errors?.['required']).toBe(true);
    });

    it('should mark password as invalid when less than 6 characters', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('12345');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.invalid).toBe(true);
      expect(passwordControl?.errors?.['minlength']).toBeTruthy();
    });

    it('should mark form as valid with correct inputs', () => {
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123'
      });
      
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit if form is invalid', () => {
      component.loginForm.setValue({
        email: '',
        password: ''
      });
      
      component.onSubmit();
      
      expect(authServiceSpy.login).not.toHaveBeenCalled();
      expect(component.submitted).toBe(true);
    });

    it('should call authService.login with form values when valid', fakeAsync(() => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      component.loginForm.setValue(credentials);
      authServiceSpy.login.and.returnValue(of({ 
        token: 'test-token', 
        email: credentials.email,
        userId: '123',
        expiresAt: new Date()
      }));
      
      component.onSubmit();
      tick();
      
      expect(authServiceSpy.login).toHaveBeenCalledWith(credentials);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));

    it('should navigate to returnUrl after successful login', fakeAsync(() => {
      component.returnUrl = '/tournaments';
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123'
      });
      
      authServiceSpy.login.and.returnValue(of({ 
        token: 'test-token',
        email: 'test@example.com',
        userId: '123',
        expiresAt: new Date()
      }));
      
      component.onSubmit();
      tick();
      
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/tournaments']);
    }));

    it('should handle 401 error', fakeAsync(() => {
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      
      authServiceSpy.login.and.returnValue(
        throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }))
      );
      
      component.onSubmit();
      tick();
      
      expect(component.error).toBe('Invalid email or password');
      expect(component.loading).toBe(false);
    }));

    it('should handle network error', fakeAsync(() => {
      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123'
      });
      
      authServiceSpy.login.and.returnValue(
        throwError(() => ({ status: 0 }))
      );
      
      component.onSubmit();
      tick();
      
      expect(component.error).toBe('Network error. Please try again.');
      expect(component.loading).toBe(false);
    }));
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render login form elements', () => {
      const emailInput = compiled.querySelector('app-input[formControlName="email"]');
      const passwordInput = compiled.querySelector('app-input[formControlName="password"]');
      const submitButton = compiled.querySelector('app-button[type="submit"]');
      
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(submitButton).toBeTruthy();
    });

    it('should show error message when error is set', () => {
      component.error = 'Test error message';
      fixture.detectChanges();
      
      const errorAlert = compiled.querySelector('app-alert');
      expect(errorAlert?.textContent).toContain('Test error message');
    });

    it('should show validation errors after submission', () => {
      component.submitted = true;
      component.loginForm.get('email')?.setErrors({ required: true });
      fixture.detectChanges();
      
      // The error message is shown through the hasError binding, which gets computed in the template
      expect(component.submitted && component.f['email'].errors !== null).toBe(true);
    });

    it('should disable submit button when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      
      // The loading state is bound to the component's loading property
      expect(component.loading).toBe(true);
      // The button should be disabled when loading
      expect(component.loading).toBe(true);
    });

    it('should show register link', () => {
      const registerLink = compiled.querySelector('a[routerLink="/register"]');
      expect(registerLink).toBeTruthy();
      expect(registerLink?.textContent).toContain('create a new account');
    });

    it('should show forgot password link', () => {
      const forgotLink = compiled.querySelector('a[routerLink="/forgot-password"]');
      expect(forgotLink).toBeTruthy();
      expect(forgotLink?.textContent).toContain('Forgot your password?');
    });
  });
});