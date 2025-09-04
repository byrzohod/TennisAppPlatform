/// <reference types="cypress" />

describe('Registration Feature', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  describe('UI Elements', () => {
    it('should display all registration form elements', () => {
      cy.get('h2').should('contain', 'Register');
      cy.get('input[name="firstName"]').should('be.visible');
      cy.get('input[name="lastName"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Register');
      cy.get('a').should('contain', 'Already have an account? Login');
    });

    it('should have proper input attributes', () => {
      cy.get('input[name="firstName"]').should('have.attr', 'type', 'text');
      cy.get('input[name="lastName"]').should('have.attr', 'type', 'text');
      cy.get('input[name="email"]').should('have.attr', 'type', 'email');
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
      cy.get('input[name="confirmPassword"]').should('have.attr', 'type', 'password');
    });

    it('should be accessible', () => {
      cy.injectAxe();
      cy.checkA11y();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty form submission', () => {
      cy.get('button[type="submit"]').click();
      
      cy.get('input[name="firstName"]').should('have.class', 'ng-invalid');
      cy.get('input[name="lastName"]').should('have.class', 'ng-invalid');
      cy.get('input[name="email"]').should('have.class', 'ng-invalid');
      cy.get('input[name="password"]').should('have.class', 'ng-invalid');
      cy.get('input[name="confirmPassword"]').should('have.class', 'ng-invalid');
    });

    it('should validate email format', () => {
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="email"]').blur();
      cy.get('.error-message').should('contain', 'Please enter a valid email');
    });

    it('should validate password strength', () => {
      cy.get('input[name="password"]').type('weak');
      cy.get('input[name="password"]').blur();
      cy.get('.error-message').should('contain', 'Password must be at least 6 characters');
    });

    it('should validate password match', () => {
      cy.get('input[name="password"]').type('StrongPass123!');
      cy.get('input[name="confirmPassword"]').type('DifferentPass123!');
      cy.get('input[name="confirmPassword"]').blur();
      cy.get('.error-message').should('contain', 'Passwords do not match');
    });

    it('should show password strength indicator', () => {
      // Weak password
      cy.get('input[name="password"]').type('123456');
      cy.get('.password-strength').should('have.class', 'weak');
      
      // Medium password
      cy.get('input[name="password"]').clear().type('Test123');
      cy.get('.password-strength').should('have.class', 'medium');
      
      // Strong password
      cy.get('input[name="password"]').clear().type('Test123!@#');
      cy.get('.password-strength').should('have.class', 'strong');
    });
  });

  describe('Registration Process', () => {
    it('should register successfully with valid data', () => {
      const timestamp = Date.now();
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe.${timestamp}@example.com`,
        password: 'Test123!',
        confirmPassword: 'Test123!'
      };

      cy.get('input[name="firstName"]').type(userData.firstName);
      cy.get('input[name="lastName"]').type(userData.lastName);
      cy.get('input[name="email"]').type(userData.email);
      cy.get('input[name="password"]').type(userData.password);
      cy.get('input[name="confirmPassword"]').type(userData.confirmPassword);
      cy.get('button[type="submit"]').click();
      
      // Should redirect to login or dashboard
      cy.url().should('not.include', '/register');
      cy.get('.alert-success').should('contain', 'Registration successful');
    });

    it('should show error for duplicate email', () => {
      // First, register a user
      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: 'Test123!',
        confirmPassword: 'Test123!'
      };

      cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, userData);

      // Try to register with the same email
      cy.get('input[name="firstName"]').type('Another');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type(userData.email);
      cy.get('input[name="password"]').type('Test123!');
      cy.get('input[name="confirmPassword"]').type('Test123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-danger').should('contain', 'Email already registered');
    });

    it('should handle server errors gracefully', () => {
      cy.intercept('POST', '**/auth/register', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('serverError');
      
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test123!');
      cy.get('input[name="confirmPassword"]').type('Test123!');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@serverError');
      cy.get('.alert-danger').should('contain', 'Something went wrong');
    });
  });

  describe('Security', () => {
    it('should not expose password in the DOM', () => {
      cy.get('input[name="password"]').type('SecretPassword123!');
      cy.get('input[name="confirmPassword"]').type('SecretPassword123!');
      
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
      cy.get('input[name="confirmPassword"]').should('have.attr', 'type', 'password');
      
      cy.get('body').invoke('html').should('not.contain', 'SecretPassword123!');
    });

    it('should sanitize user input to prevent XSS', () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      cy.get('input[name="firstName"]').type(xssPayload);
      cy.get('input[name="lastName"]').type('Test');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test123!');
      cy.get('input[name="confirmPassword"]').type('Test123!');
      cy.get('button[type="submit"]').click();
      
      cy.on('window:alert', (txt) => {
        throw new Error('XSS vulnerability detected!');
      });
    });

    it('should prevent SQL injection', () => {
      const sqlPayload = "'; DROP TABLE users; --";
      
      cy.get('input[name="firstName"]').type(sqlPayload);
      cy.get('input[name="lastName"]').type('Test');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test123!');
      cy.get('input[name="confirmPassword"]').type('Test123!');
      cy.get('button[type="submit"]').click();
      
      // Should handle the input safely
      cy.get('.alert').should('exist');
    });
  });

  describe('User Experience', () => {
    it('should show/hide password toggle', () => {
      cy.get('input[name="password"]').type('Test123!');
      
      // Initially password should be hidden
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
      
      // Click show password toggle
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'text');
      
      // Click again to hide
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    });

    it('should provide helpful error messages', () => {
      cy.get('input[name="email"]').type('test@').blur();
      cy.get('.error-message').should('contain', 'valid email');
      
      cy.get('input[name="password"]').type('12345').blur();
      cy.get('.error-message').should('contain', 'at least 6 characters');
    });

    it('should disable submit button while processing', () => {
      cy.intercept('POST', '**/auth/register', (req) => {
        req.reply((res) => {
          res.delay(2000); // Delay response
          res.send({ statusCode: 200 });
        });
      }).as('slowRegister');
      
      cy.get('input[name="firstName"]').type('Test');
      cy.get('input[name="lastName"]').type('User');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('Test123!');
      cy.get('input[name="confirmPassword"]').type('Test123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('.spinner').should('be.visible');
      
      cy.wait('@slowRegister');
      cy.get('button[type="submit"]').should('not.be.disabled');
    });
  });

  describe('Responsive Design', () => {
    const devices = ['iphone-x', 'ipad-2', 'macbook-15'];
    
    devices.forEach(device => {
      it(`should display correctly on ${device}`, () => {
        cy.viewport(device);
        
        cy.get('form').should('be.visible');
        cy.get('input[name="firstName"]').should('be.visible');
        cy.get('input[name="lastName"]').should('be.visible');
        cy.get('input[name="email"]').should('be.visible');
        cy.get('input[name="password"]').should('be.visible');
        cy.get('input[name="confirmPassword"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');
      });
    });
  });

  describe('Performance', () => {
    it('should load page within acceptable time', () => {
      cy.window().then((win) => {
        const performance = win.performance;
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        
        expect(navigationTiming.loadEventEnd - navigationTiming.fetchStart).to.be.lessThan(3000);
      });
    });

    it('should not have memory leaks on form interactions', () => {
      cy.window().then((win) => {
        const initialMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
        
        // Perform multiple form interactions
        for (let i = 0; i < 10; i++) {
          cy.get('input[name="firstName"]').clear().type(`User${i}`);
          cy.get('input[name="lastName"]').clear().type(`Test${i}`);
        }
        
        cy.window().then((win) => {
          const finalMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
          const memoryIncrease = finalMemory - initialMemory;
          
          // Memory increase should be reasonable
          expect(memoryIncrease).to.be.lessThan(5000000); // Less than 5MB
        });
      });
    });
  });
});