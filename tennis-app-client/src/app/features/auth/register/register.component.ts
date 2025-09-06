import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { finalize } from 'rxjs/operators';

import { CardComponent } from '../../../shared/components/ui/card/card.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { InputComponent } from '../../../shared/components/ui/input/input.component';
import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CardComponent, ButtonComponent, InputComponent, AlertComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  showPassword = false;
  passwordStrength: 'weak' | 'medium' | 'strong' | '' = '';

  ngOnInit(): void {
    this.initializeForm();
    
    // Note: Redirect logic removed - let route guards handle authentication flow
    // This keeps the component simpler and more focused on registration logic
  }

  private initializeForm(): void {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, CustomValidators.email()]],
      password: ['', [Validators.required, CustomValidators.passwordStrength()]],
      confirmPassword: ['', [Validators.required, CustomValidators.matchField('password')]]
    });
  }


  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    
    this.authService.register(this.registerForm.value)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          if (error.status === 409) {
            this.error = 'Email is already registered';
          } else if (error.status === 0) {
            this.error = 'Unable to connect to server. Please try again later.';
          } else {
            this.error = error.error?.message || 'An error occurred during registration';
          }
        }
      });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  updatePasswordStrength(): void {
    const password = this.registerForm.get('password')?.value || '';
    
    if (password.length === 0) {
      this.passwordStrength = '';
      return;
    }
    
    // Simple password strength calculation
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character type checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    // Determine strength level
    if (strength <= 2) {
      this.passwordStrength = 'weak';
    } else if (strength <= 4) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }
}