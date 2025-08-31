import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['register', 'isAuthenticated']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy }
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
      
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
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
      expect(emailControl?.errors?.['email']).toBe(true);
    });

    it('should mark password as invalid when empty', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.invalid).toBe(true);
      expect(passwordControl?.errors?.['required']).toBe(true);
    });

    it('should mark password as invalid when less than 6 characters', () => {
      const passwordControl = component.registerForm.get('password');
      passwordControl?.setValue('12345');
      passwordControl?.markAsTouched();
      
      expect(passwordControl?.invalid).toBe(true);
      expect(passwordControl?.errors?.['minlength']).toBeTruthy();
    });

    it('should mark confirmPassword as invalid when empty', () => {
      const confirmPasswordControl = component.registerForm.get('confirmPassword');
      confirmPasswordControl?.setValue('');
      confirmPasswordControl?.markAsTouched();
      
      expect(confirmPasswordControl?.invalid).toBe(true);
      expect(confirmPasswordControl?.errors?.['required']).toBe(true);
    });

    it('should validate password match', () => {
      component.registerForm.get('password')?.setValue('password123');
      component.registerForm.get('confirmPassword')?.setValue('different');
      component.registerForm.get('confirmPassword')?.markAsTouched();
      
      expect(component.registerForm.get('confirmPassword')?.errors?.['passwordMismatch']).toBe(true);
    });

    it('should clear password mismatch error when passwords match', () => {
      component.registerForm.get('password')?.setValue('password123');
      component.registerForm.get('confirmPassword')?.setValue('different');
      component.registerForm.get('confirmPassword')?.markAsTouched();
      
      component.registerForm.get('confirmPassword')?.setValue('password123');
      
      expect(component.registerForm.get('confirmPassword')?.errors).toBeNull();
    });

    it('should mark form as valid with correct inputs', () => {
      component.registerForm.setValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
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
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
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
      
      const { confirmPassword, ...expectedData } = formData;
      expect(authServiceSpy.register).toHaveBeenCalledWith(expectedData);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should handle 409 conflict error', fakeAsync(() => {
      component.registerForm.setValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123'
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
      component.registerForm.setValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
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
      component.registerForm.setValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
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
      const firstNameInput = compiled.querySelector('#firstName');
      const lastNameInput = compiled.querySelector('#lastName');
      const emailInput = compiled.querySelector('#email');
      const passwordInput = compiled.querySelector('#password');
      const confirmPasswordInput = compiled.querySelector('#confirmPassword');
      const submitButton = compiled.querySelector('button[type="submit"]');
      
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
      
      const errorAlert = compiled.querySelector('.alert-error');
      expect(errorAlert?.textContent).toContain('Test error message');
    });

    it('should show validation errors after submission', () => {
      component.submitted = true;
      component.registerForm.get('firstName')?.setErrors({ required: true });
      component.registerForm.get('email')?.setErrors({ required: true });
      fixture.detectChanges();
      
      const allErrors = compiled.querySelectorAll('.invalid-feedback');
      const errorTexts = Array.from(allErrors).map(el => el.textContent);
      
      expect(errorTexts.some(text => text?.includes('First name is required'))).toBeTruthy();
      expect(errorTexts.some(text => text?.includes('Email is required'))).toBeTruthy();
    });

    it('should disable submit button when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBe(true);
      expect(submitButton.textContent).toContain('Creating account...');
    });

    it('should show login link', () => {
      const loginLink = compiled.querySelector('a[routerLink="/login"]');
      expect(loginLink).toBeTruthy();
      expect(loginLink?.textContent).toContain('Sign in');
    });
  });
});