/// <reference types="cypress" />

describe('Login Feature', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  describe('UI Elements', () => {
    it('should display all login form elements', () => {
      cy.get('h2').should('contain', 'Login');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Login');
      cy.get('a').should('contain', "Don't have an account? Register");
    });

    it('should have proper input types and placeholders', () => {
      cy.get('input[name="email"]')
        .should('have.attr', 'type', 'email')
        .should('have.attr', 'placeholder', 'Email');
      
      cy.get('input[name="password"]')
        .should('have.attr', 'type', 'password')
        .should('have.attr', 'placeholder', 'Password');
    });

    it('should be accessible', () => {
      cy.injectAxe();
      cy.checkA11y();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty form submission', () => {
      cy.get('button[type="submit"]').click();
      
      cy.get('.error-message').should('be.visible');
      cy.get('input[name="email"]').should('have.class', 'ng-invalid');
      cy.get('input[name="password"]').should('have.class', 'ng-invalid');
    });

    it('should show error for invalid email format', () => {
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="password"]').type('ValidPassword123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('.error-message').should('contain', 'Please enter a valid email');
    });

    it('should show error for password less than 6 characters', () => {
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('123');
      cy.get('button[type="submit"]').click();
      
      cy.get('.error-message').should('contain', 'Password must be at least 6 characters');
    });
  });

  describe('Login Process', () => {
    it('should login successfully with valid credentials', () => {
      // Create a test user first
      cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, {
        email: 'testuser@example.com',
        password: 'Test123!',
        confirmPassword: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      });

      // Now login
      cy.get('input[name="email"]').type('testuser@example.com');
      cy.get('input[name="password"]').type('Test123!');
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('.welcome-message').should('contain', 'Welcome, Test User');
      
      // Should store auth token
      cy.window().its('localStorage.authToken').should('exist');
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[name="email"]').type('nonexistent@example.com');
      cy.get('input[name="password"]').type('WrongPassword123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-danger').should('contain', 'Invalid email or password');
      cy.url().should('include', '/login');
    });

    it('should handle network errors gracefully', () => {
      // Simulate network error
      cy.intercept('POST', '**/auth/login', { forceNetworkError: true }).as('loginError');
      
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test123!');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginError');
      cy.get('.alert-danger').should('contain', 'Network error. Please try again.');
    });

    it('should handle server errors gracefully', () => {
      // Simulate server error
      cy.intercept('POST', '**/auth/login', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('serverError');
      
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test123!');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@serverError');
      cy.get('.alert-danger').should('contain', 'Something went wrong. Please try again later.');
    });
  });

  describe('Navigation', () => {
    it('should navigate to register page', () => {
      cy.get('a').contains("Don't have an account? Register").click();
      cy.url().should('include', '/register');
    });

    it('should navigate to forgot password page', () => {
      cy.get('a').contains('Forgot password?').click();
      cy.url().should('include', '/forgot-password');
    });
  });

  describe('Security', () => {
    it('should not expose password in the DOM', () => {
      cy.get('input[name="password"]').type('SecretPassword123!');
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
      cy.get('input[name="password"]').invoke('val').should('eq', 'SecretPassword123!');
      
      // Check that password is not visible in HTML
      cy.get('body').invoke('html').should('not.contain', 'SecretPassword123!');
    });

    it('should clear sensitive data on logout', () => {
      // Login first
      cy.loginByAPI('test@example.com', 'Test123!');
      cy.visit('/dashboard');
      
      // Logout
      cy.get('[data-testid="logout-button"]').click();
      
      // Check that auth data is cleared
      cy.window().its('localStorage.authToken').should('not.exist');
      cy.window().its('localStorage.user').should('not.exist');
      cy.getCookie('auth').should('not.exist');
    });

    it('should prevent XSS attacks in login form', () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      cy.get('input[name="email"]').type(xssPayload);
      cy.get('input[name="password"]').type('Test123!');
      cy.get('button[type="submit"]').click();
      
      // Check that script is not executed
      cy.on('window:alert', (txt) => {
        throw new Error('XSS vulnerability detected!');
      });
    });
  });

  describe('Performance', () => {
    it('should load login page quickly', () => {
      cy.visit('/login', {
        onBeforeLoad: (win) => {
          win.performance.mark('start');
        },
        onLoad: (win) => {
          win.performance.mark('end');
          win.performance.measure('pageLoad', 'start', 'end');
          const measure = win.performance.getEntriesByName('pageLoad')[0];
          expect(measure.duration).to.be.lessThan(3000); // Less than 3 seconds
        }
      });
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { device: 'iphone-x', width: 375, height: 812 },
      { device: 'ipad-2', width: 768, height: 1024 },
      { device: 'macbook-15', width: 1440, height: 900 }
    ];

    viewports.forEach(viewport => {
      it(`should be responsive on ${viewport.device}`, () => {
        cy.viewport(viewport.width, viewport.height);
        
        cy.get('input[name="email"]').should('be.visible');
        cy.get('input[name="password"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');
        
        // Check that form is not cut off
        cy.get('form').should('be.visible');
      });
    });
  });
});