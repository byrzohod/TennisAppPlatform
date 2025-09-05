import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['register', 'isAuthenticated']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule, RouterTestingModule, CardComponent, ButtonComponent, InputComponent, AlertComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideAnimationsAsync()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    authServiceSpy.isAuthenticated.and.returnValue(false);
    spyOn(routerSpy, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize the form with empty fields', () => {
      fixture.detectChanges();
      
      expect(component.registerForm.get('firstName')?.value).toBe('');
      expect(component.registerForm.get('lastName')?.value).toBe('');
      expect(component.registerForm.get('email')?.value).toBe('');
      expect(component.registerForm.get('password')?.value).toBe('');
      expect(component.registerForm.get('confirmPassword')?.value).toBe('');
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

    it('should mark firstName as invalid when empty', () => {
      const firstNameControl = component.registerForm.get('firstName');
      firstNameControl?.setValue('');
      firstNameControl?.markAsTouched();
      
      expect(firstNameControl?.invalid).toBe(true);
      expect(firstNameControl?.errors?.['required']).toBe(true);
    });

    it('should mark firstName as invalid when less than 2 characters', () => {
      const firstNameControl = component.registerForm.get('firstName');
      firstNameControl?.setValue('J');
      firstNameControl?.markAsTouched();
      
      expect(firstNameControl?.invalid).toBe(true);
      expect(firstNameControl?.errors?.['minlength']).toBeTruthy();
    });

    it('should mark lastName as invalid when empty', () => {
      const lastNameControl = component.registerForm.get('lastName');
      lastNameControl?.setValue('');
      lastNameControl?.markAsTouched();
      
      expect(lastNameControl?.invalid).toBe(true);
      expect(lastNameControl?.errors?.['required']).toBe(true);
    });

    it('should mark lastName as invalid when less than 2 characters', () => {
      const lastNameControl = component.registerForm.get('lastName');
      lastNameControl?.setValue('D');
      lastNameControl?.markAsTouched();
      
      expect(lastNameControl?.invalid).toBe(true);
      expect(lastNameControl?.errors?.['minlength']).toBeTruthy();
    });

    it('should mark email as invalid when empty', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      
      expect(emailControl?.invalid).toBe(true);
      expect(emailControl?.errors?.['required']).toBe(true);
    });

    it('should mark email as invalid with incorrect format', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      
      expect(emailControl?.invalid).toBe(true);
      expect(emailControl?.errors?.['email']).toBeTruthy();
    });

    it('should mark password as invalid when empty', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.invalid).toBe(true);
      expect(passwordControl?.errors?.['required']).toBe(true);
    });

    it('should mark password as invalid with weak password', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('12345');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.invalid).toBe(true);
      expect(passwordControl?.errors?.['minLength']).toBeTruthy();
    });

    it('should mark confirmPassword as invalid when empty', () => {
      const confirmPasswordControl = component.registerForm.get('confirmPassword');
      confirmPasswordControl?.setValue('');
      confirmPasswordControl?.markAsTouched();
      
      expect(confirmPasswordControl?.invalid).toBe(true);
      expect(confirmPasswordControl?.errors?.['required']).toBe(true);
    });

    it('should validate password match', () => {
      component.registerForm.get('password')?.setValue('Password123!');
      component.registerForm.get('confirmPassword')?.setValue('different');
      component.registerForm.get('confirmPassword')?.markAsTouched();
      
      expect(component.registerForm.get('confirmPassword')?.invalid).toBe(true);
      expect(component.registerForm.get('confirmPassword')?.errors?.['mismatch']).toBeTruthy();
    });

    it('should clear password mismatch error when passwords match', () => {
      const password = 'Password123!';
      component.registerForm.get('password')?.setValue(password);
      component.registerForm.get('confirmPassword')?.setValue('different');
      component.registerForm.get('confirmPassword')?.markAsTouched();
      
      component.registerForm.get('confirmPassword')?.setValue(password);
      
      expect(component.registerForm.get('confirmPassword')?.errors).toBeNull();
    });

    it('should mark form as valid with correct inputs', () => {
      const password = 'Password123!';
      component.registerForm.setValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: password,
        confirmPassword: password
      });
      
      expect(component.registerForm.valid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit if form is invalid', () => {
      component.registerForm.setValue({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      component.onSubmit();
      
      expect(authServiceSpy.register).not.toHaveBeenCalled();
      expect(component.submitted).toBe(true);
    });

    it('should call authService.register with form values when valid', fakeAsync(() => {
      const password = 'Password123!';
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: password,
        confirmPassword: password
      };
      
      component.registerForm.setValue(formData);
      authServiceSpy.register.and.returnValue(of({ 
        token: 'test-token', 
        email: formData.email,
        userId: '123',
        expiresAt: new Date()
      }));
      
      component.onSubmit();
      tick();
      
      expect(authServiceSpy.register).toHaveBeenCalledWith(formData);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    }));

    it('should handle 409 conflict error', fakeAsync(() => {
      const password = 'Password123!';
      component.registerForm.setValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: password,
        confirmPassword: password
      });
      
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ status: 409, error: { message: 'Email already exists' } }))
      );
      
      component.onSubmit();
      tick();
      
      expect(component.error).toBe('Email is already registered');
      expect(component.loading).toBe(false);
    }));

    it('should handle network error', fakeAsync(() => {
      const password = 'Password123!';
      component.registerForm.setValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: password,
        confirmPassword: password
      });
      
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ status: 0 }))
      );
      
      component.onSubmit();
      tick();
      
      expect(component.error).toBe('Unable to connect to server. Please try again later.');
      expect(component.loading).toBe(false);
    }));

    it('should handle generic error', fakeAsync(() => {
      const password = 'Password123!';
      component.registerForm.setValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: password,
        confirmPassword: password
      });
      
      authServiceSpy.register.and.returnValue(
        throwError(() => ({ status: 500, error: { message: 'Server error' } }))
      );
      
      component.onSubmit();
      tick();
      
      expect(component.error).toBe('Server error');
      expect(component.loading).toBe(false);
    }));
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render register form elements', () => {
      const firstNameInput = compiled.querySelector('app-input[formControlName="firstName"] input');
      const lastNameInput = compiled.querySelector('app-input[formControlName="lastName"] input');
      const emailInput = compiled.querySelector('app-input[formControlName="email"] input');
      const passwordInput = compiled.querySelector('app-input[formControlName="password"] input');
      const confirmPasswordInput = compiled.querySelector('app-input[formControlName="confirmPassword"] input');
      const submitButton = compiled.querySelector('app-button[type="submit"]');
      
      expect(firstNameInput).toBeTruthy();
      expect(lastNameInput).toBeTruthy();
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(confirmPasswordInput).toBeTruthy();
      expect(submitButton).toBeTruthy();
    });

    it('should show error message when error is set', () => {
      component.error = 'Test error message';
      fixture.detectChanges();
      
      const errorAlert = compiled.querySelector('app-alert[variant="error"]');
      expect(errorAlert).toBeTruthy();
    });

    it('should show validation errors after submission', () => {
      component.submitted = true;
      component.registerForm.get('firstName')?.setErrors({ required: true });
      component.registerForm.get('email')?.setErrors({ required: true });
      fixture.detectChanges();
      
      const errorTexts = compiled.textContent || '';
      
      expect(errorTexts.includes('First name is required')).toBeTruthy();
      expect(errorTexts.includes('Email is required')).toBeTruthy();
    });

    it('should disable submit button when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const submitButton = compiled.querySelector('app-button[type="submit"]');
      expect(submitButton).toBeTruthy();
      expect(compiled.textContent).toContain('Creating Account...');
    });

    it('should show login link', () => {
      const loginLink = compiled.querySelector('a[routerLink="/login"]');
      expect(loginLink).toBeTruthy();
      expect(loginLink?.textContent).toContain('Sign In');
    });
  });
});