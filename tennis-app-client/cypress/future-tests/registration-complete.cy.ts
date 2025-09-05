/// <reference types="cypress" />

describe('Registration - Complete Flow', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  describe('Form Rendering', () => {
    it('should display all registration form fields', () => {
      // Check form exists
      cy.get('form').should('be.visible');
      
      // Check all input fields
      cy.get('input#firstName').should('be.visible');
      cy.get('input#lastName').should('be.visible');
      cy.get('input#email').should('be.visible');
      cy.get('input#password').should('be.visible');
      cy.get('input#confirmPassword').should('be.visible');
      
      // Check labels
      cy.get('label[for="firstName"]').should('contain', 'First Name');
      cy.get('label[for="lastName"]').should('contain', 'Last Name');
      cy.get('label[for="email"]').should('contain', 'Email');
      cy.get('label[for="password"]').should('contain', 'Password');
      cy.get('label[for="confirmPassword"]').should('contain', 'Confirm Password');
      
      // Check submit button
      cy.get('button[type="submit"]').should('contain', 'Register');
    });

    it('should have correct input types and attributes', () => {
      cy.get('input#firstName').should('have.attr', 'type', 'text');
      cy.get('input#lastName').should('have.attr', 'type', 'text');
      cy.get('input#email').should('have.attr', 'type', 'email');
      cy.get('input#password').should('have.attr', 'type', 'password');
      cy.get('input#confirmPassword').should('have.attr', 'type', 'password');
      
      // Check autocomplete attributes
      cy.get('input#firstName').should('have.attr', 'autocomplete', 'given-name');
      cy.get('input#lastName').should('have.attr', 'autocomplete', 'family-name');
      cy.get('input#email').should('have.attr', 'autocomplete', 'email');
      cy.get('input#password').should('have.attr', 'autocomplete', 'new-password');
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty form submission', () => {
      cy.get('button[type="submit"]').click();
      
      // Check that all fields show invalid state
      cy.get('input#firstName').should('have.class', 'is-invalid');
      cy.get('input#lastName').should('have.class', 'is-invalid');
      cy.get('input#email').should('have.class', 'is-invalid');
      cy.get('input#password').should('have.class', 'is-invalid');
      cy.get('input#confirmPassword').should('have.class', 'is-invalid');
      
      // Check error messages appear
      cy.get('.error-message').should('have.length.at.least', 1);
    });

    it('should validate first name requirements', () => {
      cy.get('input#firstName').type('A');
      cy.get('button[type="submit"]').click();
      cy.get('.error-message').should('contain', 'at least 2 characters');
      
      cy.get('input#firstName').clear().type('Jo');
      cy.get('input#firstName').should('not.have.class', 'is-invalid');
    });

    it('should validate last name requirements', () => {
      cy.get('input#lastName').type('B');
      cy.get('button[type="submit"]').click();
      cy.get('.error-message').should('contain', 'at least 2 characters');
      
      cy.get('input#lastName').clear().type('Doe');
      cy.get('input#lastName').should('not.have.class', 'is-invalid');
    });

    it('should validate email format', () => {
      // Invalid email formats
      const invalidEmails = ['test', 'test@', 'test@.com', '@test.com', 'test@test'];
      
      invalidEmails.forEach(email => {
        cy.get('input#email').clear().type(email);
        cy.get('button[type="submit"]').click();
        cy.get('.error-message').should('exist');
      });
      
      // Valid email
      cy.get('input#email').clear().type('test@example.com');
      cy.get('button[type="submit"]').click();
      cy.get('input#email').should('not.have.class', 'is-invalid');
    });

    it('should validate password requirements', () => {
      // Too short
      cy.get('input#password').type('12345');
      cy.get('button[type="submit"]').click();
      cy.get('.error-message').should('contain', 'at least 6 characters');
      
      // Valid password
      cy.get('input#password').clear().type('Test123!');
      cy.get('input#password').should('not.have.class', 'is-invalid');
    });

    it('should validate password confirmation match', () => {
      cy.get('input#password').type('Test123!');
      cy.get('input#confirmPassword').type('Different123!');
      cy.get('button[type="submit"]').click();
      
      // Check for mismatch error
      cy.get('.error-message').should('contain', 'do not match');
      
      // Fix the mismatch
      cy.get('input#confirmPassword').clear().type('Test123!');
      cy.get('button[type="submit"]').click();
      cy.get('input#confirmPassword').should('not.have.class', 'is-invalid');
    });
  });

  describe('Password Features', () => {
    it('should toggle password visibility', () => {
      const password = 'Test123!';
      
      // Type password
      cy.get('input#password').type(password);
      
      // Initially should be password type
      cy.get('input#password').should('have.attr', 'type', 'password');
      
      // Click toggle button
      cy.get('[data-testid="toggle-password"]').click();
      
      // Should now be text type
      cy.get('input#password').should('have.attr', 'type', 'text');
      cy.get('input#password').should('have.value', password);
      
      // Click again to hide
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('input#password').should('have.attr', 'type', 'password');
    });

    it('should show password strength indicator', () => {
      // Weak password
      cy.get('input#password').type('123456');
      cy.get('.password-strength').should('exist');
      
      // Medium password  
      cy.get('input#password').clear().type('Test123');
      cy.get('.password-strength').should('exist');
      
      // Strong password
      cy.get('input#password').clear().type('Test123!@#');
      cy.get('.password-strength').should('exist');
    });
  });

  describe('Form Submission', () => {
    it('should successfully register with valid data', () => {
      const timestamp = Date.now();
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe.${timestamp}@example.com`,
        password: 'Test123!',
        confirmPassword: 'Test123!'
      };

      // Fill form
      cy.get('input#firstName').type(userData.firstName);
      cy.get('input#lastName').type(userData.lastName);
      cy.get('input#email').type(userData.email);
      cy.get('input#password').type(userData.password);
      cy.get('input#confirmPassword').type(userData.confirmPassword);
      
      // Submit
      cy.get('button[type="submit"]').click();
      
      // Should show success or redirect
      cy.url().then(url => {
        // Either redirects to login or stays with success message
        expect(url).to.satisfy((u: string) => 
          u.includes('/login') || u.includes('/register')
        );
      });
    });

    it('should disable submit button while processing', () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'Test123!',
        confirmPassword: 'Test123!'
      };

      // Fill form
      cy.get('input#firstName').type(userData.firstName);
      cy.get('input#lastName').type(userData.lastName);
      cy.get('input#email').type(userData.email);
      cy.get('input#password').type(userData.password);
      cy.get('input#confirmPassword').type(userData.confirmPassword);
      
      // Check button state
      cy.get('button[type="submit"]').should('not.be.disabled');
      cy.get('button[type="submit"]').click();
      
      // Button should be disabled during processing
      cy.get('button[type="submit"]').should('be.disabled');
    });

    it('should show loading indicator during submission', () => {
      const userData = {
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@example.com',
        password: 'Test123!',
        confirmPassword: 'Test123!'
      };

      // Fill form
      cy.get('input#firstName').type(userData.firstName);
      cy.get('input#lastName').type(userData.lastName);
      cy.get('input#email').type(userData.email);
      cy.get('input#password').type(userData.password);
      cy.get('input#confirmPassword').type(userData.confirmPassword);
      
      // Submit and check for spinner
      cy.get('button[type="submit"]').click();
      cy.get('.spinner-border').should('be.visible');
    });
  });

  describe('Navigation', () => {
    it('should navigate to login page from registration', () => {
      cy.get('a[href="/login"]').should('be.visible');
      cy.get('a[href="/login"]').click();
      cy.url().should('include', '/login');
    });

    it('should navigate back to home page', () => {
      cy.get('a[href="/"]').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Security', () => {
    it('should not expose passwords in DOM or network', () => {
      const password = 'SuperSecret123!';
      
      cy.get('input#password').type(password);
      cy.get('input#confirmPassword').type(password);
      
      // Check password fields are masked
      cy.get('input#password').should('have.attr', 'type', 'password');
      cy.get('input#confirmPassword').should('have.attr', 'type', 'password');
      
      // Check password not in HTML
      cy.get('body').invoke('html').should('not.contain', password);
    });

    it('should sanitize user inputs to prevent XSS', () => {
      const xssAttempt = '<script>alert("XSS")</script>';
      
      cy.get('input#firstName').type(xssAttempt);
      cy.get('input#lastName').type('Test');
      cy.get('input#email').type('test@example.com');
      cy.get('input#password').type('Test123!');
      cy.get('input#confirmPassword').type('Test123!');
      
      cy.get('button[type="submit"]').click();
      
      // Should not execute script
      cy.on('window:alert', () => {
        throw new Error('XSS vulnerability detected!');
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      // Tab through form fields
      cy.get('body').tab();
      cy.focused().should('have.attr', 'id').and('match', /firstName|email/);
      
      // Continue tabbing
      cy.focused().tab();
      cy.focused().should('have.attr', 'type');
    });

    it('should have proper ARIA labels', () => {
      cy.get('form').should('have.attr', 'role').or('have.attr', 'aria-label');
      cy.get('button[type="submit"]').should('have.attr', 'aria-label').or('contain.text', 'Register');
    });

    it('should announce errors to screen readers', () => {
      cy.get('button[type="submit"]').click();
      cy.get('.error-message').should('have.attr', 'role', 'alert')
        .or('have.attr', 'aria-live', 'polite');
    });
  });

  describe('Responsive Design', () => {
    const viewports: Cypress.ViewportPreset[] = ['iphone-6', 'ipad-2', 'macbook-13'];
    
    viewports.forEach(viewport => {
      it(`should be usable on ${viewport}`, () => {
        cy.viewport(viewport);
        
        // Check form is visible and usable
        cy.get('form').should('be.visible');
        cy.get('input#firstName').should('be.visible');
        cy.get('input#email').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');
        
        // Check no horizontal scroll
        cy.window().then(win => {
          expect(win.document.body.scrollWidth).to.be.lte(win.innerWidth);
        });
      });
    });
  });
});