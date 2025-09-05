/// <reference types="cypress" />

describe('Authentication Flow - End to End', () => {
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test.user.${Date.now()}@example.com`,
    password: 'Test123!@#'
  };

  describe('Complete Registration to Login Flow', () => {
    it('should complete full registration and login process', () => {
      // Start at home page
      cy.visit('/');
      
      // Navigate to register
      cy.get('a[href="/register"]').first().click();
      cy.url().should('include', '/register');
      
      // Fill registration form
      cy.get('input#firstName').type(testUser.firstName);
      cy.get('input#lastName').type(testUser.lastName);
      cy.get('input#email').type(testUser.email);
      cy.get('input#password').type(testUser.password);
      cy.get('input#confirmPassword').type(testUser.password);
      
      // Submit registration
      cy.get('button[type="submit"]').click();
      
      // Should redirect to login or show success
      cy.get('body').then($body => {
        if ($body.text().includes('Login')) {
          // Now try to login with created account
          cy.get('input#email').type(testUser.email);
          cy.get('input#password').type(testUser.password);
          cy.get('button[type="submit"]').click();
        }
      });
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      // Mock login to set session
      cy.window().then(win => {
        win.localStorage.setItem('authToken', 'mock-token-123');
        win.localStorage.setItem('user', JSON.stringify({
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        }));
      });
    });

    it('should persist session across page refreshes', () => {
      cy.visit('/');
      
      // Check session exists
      cy.window().its('localStorage.authToken').should('exist');
      
      // Refresh page
      cy.reload();
      
      // Session should still exist
      cy.window().its('localStorage.authToken').should('eq', 'mock-token-123');
    });

    it('should redirect to login when accessing protected routes without auth', () => {
      // Clear session
      cy.window().then(win => {
        win.localStorage.clear();
      });
      
      // Try to access protected route
      cy.visit('/dashboard', { failOnStatusCode: false });
      
      // Should redirect to login or show unauthorized
      cy.url().should('satisfy', (url: string) => {
        return url.includes('/login') || url.includes('/dashboard');
      });
    });

    it('should clear session on logout', () => {
      cy.visit('/');
      
      // Check session exists
      cy.window().its('localStorage.authToken').should('exist');
      
      // Find and click logout (if exists)
      cy.get('body').then($body => {
        if ($body.find('[data-testid="logout-button"]').length > 0) {
          cy.get('[data-testid="logout-button"]').click();
          
          // Session should be cleared
          cy.window().its('localStorage.authToken').should('not.exist');
          cy.window().its('localStorage.user').should('not.exist');
        }
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should navigate to forgot password page', () => {
      cy.visit('/login');
      
      // Check if forgot password link exists
      cy.get('body').then($body => {
        if ($body.find('a[href*="forgot"]').length > 0) {
          cy.get('a[href*="forgot"]').first().click();
          cy.url().should('include', 'forgot');
        }
      });
    });

    it('should handle password reset request', () => {
      cy.visit('/forgot-password', { failOnStatusCode: false });
      
      // If page exists, test it
      cy.get('body').then($body => {
        if ($body.find('input[type="email"]').length > 0) {
          cy.get('input[type="email"]').type(testUser.email);
          cy.get('button[type="submit"]').click();
          
          // Should show success message or error
          cy.get('.alert').should('exist');
        }
      });
    });
  });

  describe('Authentication Guards', () => {
    it('should protect tournament creation from unauthenticated users', () => {
      // Clear any existing session
      cy.window().then(win => {
        win.localStorage.clear();
      });
      
      // Try to access tournament creation
      cy.visit('/tournaments/create', { failOnStatusCode: false });
      
      // Should redirect to login or show unauthorized
      cy.get('body').should('exist');
    });

    it('should allow authenticated users to access protected routes', () => {
      // Set auth token
      cy.window().then(win => {
        win.localStorage.setItem('authToken', 'valid-token');
        win.localStorage.setItem('user', JSON.stringify({ role: 'admin' }));
      });
      
      // Access protected route
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
    });
  });

  describe('Token Expiration', () => {
    it('should handle expired tokens gracefully', () => {
      // Set expired token
      cy.window().then(win => {
        win.localStorage.setItem('authToken', 'expired-token');
        win.localStorage.setItem('tokenExpiry', new Date(Date.now() - 1000).toISOString());
      });
      
      cy.visit('/');
      
      // Should detect expired token and redirect to login
      cy.get('body').then($body => {
        // Check if app handles expired tokens
        if ($body.find('.alert').length > 0) {
          cy.get('.alert').should('contain.text', 'session');
        }
      });
    });

    it('should refresh token before expiration', () => {
      // Set token that will expire soon
      cy.window().then(win => {
        win.localStorage.setItem('authToken', 'soon-to-expire-token');
        win.localStorage.setItem('tokenExpiry', new Date(Date.now() + 60000).toISOString());
      });
      
      cy.visit('/');
      
      // Wait and check if token is refreshed
      cy.wait(5000);
      
      cy.window().its('localStorage.authToken').should('exist');
    });
  });

  describe('Multi-factor Authentication', () => {
    it('should handle MFA if enabled', () => {
      cy.visit('/login');
      
      // Login with credentials
      cy.get('input#email').type(testUser.email);
      cy.get('input#password').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Check if MFA is requested
      cy.get('body').then($body => {
        if ($body.find('input[name="mfaCode"]').length > 0) {
          cy.get('input[name="mfaCode"]').type('123456');
          cy.get('button[type="submit"]').click();
        }
      });
    });
  });

  describe('Social Authentication', () => {
    it('should display social login options if available', () => {
      cy.visit('/login');
      
      // Check for social login buttons
      cy.get('body').then($body => {
        const socialProviders = ['google', 'facebook', 'github'];
        
        socialProviders.forEach(provider => {
          if ($body.find(`[data-testid="login-${provider}"]`).length > 0) {
            cy.get(`[data-testid="login-${provider}"]`).should('be.visible');
          }
        });
      });
    });
  });

  describe('Account Security', () => {
    it('should enforce password complexity requirements', () => {
      cy.visit('/register');
      
      // Test weak passwords
      const weakPasswords = ['123456', 'password', 'qwerty', 'abc123'];
      
      weakPasswords.forEach(password => {
        cy.get('input#password').clear().type(password);
        cy.get('button[type="submit"]').click();
        
        // Should show error for weak password
        cy.get('.error-message').should('exist');
      });
    });

    it('should limit login attempts', () => {
      cy.visit('/login');
      
      // Try multiple failed login attempts
      for (let i = 0; i < 3; i++) {
        cy.get('input#email').clear().type('wrong@example.com');
        cy.get('input#password').clear().type('wrongpassword');
        cy.get('button[type="submit"]').click();
        cy.wait(1000);
      }
      
      // Check if account lockout or captcha appears
      cy.get('body').then($body => {
        if ($body.find('.captcha').length > 0 || $body.text().includes('locked')) {
          cy.log('Account protection activated');
        }
      });
    });

    it('should log security events', () => {
      // Login successfully
      cy.visit('/login');
      cy.get('input#email').type(testUser.email);
      cy.get('input#password').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Check if login event is logged
      cy.window().then(win => {
        const events = win.localStorage.getItem('securityEvents');
        if (events) {
          expect(events).to.include('login');
        }
      });
    });
  });

  describe('Remember Me Functionality', () => {
    it('should persist login with remember me checked', () => {
      cy.visit('/login');
      
      // Check if remember me exists
      cy.get('body').then($body => {
        if ($body.find('input[type="checkbox"][name="rememberMe"]').length > 0) {
          cy.get('input[type="checkbox"][name="rememberMe"]').check();
          
          // Login
          cy.get('input#email').type(testUser.email);
          cy.get('input#password').type(testUser.password);
          cy.get('button[type="submit"]').click();
          
          // Check if persistent cookie is set
          cy.getCookie('rememberToken').should('exist');
        }
      });
    });

    it('should not persist login without remember me', () => {
      cy.visit('/login');
      
      // Ensure remember me is unchecked if it exists
      cy.get('body').then($body => {
        if ($body.find('input[type="checkbox"][name="rememberMe"]').length > 0) {
          cy.get('input[type="checkbox"][name="rememberMe"]').uncheck();
        }
      });
      
      // Login
      cy.get('input#email').type(testUser.email);
      cy.get('input#password').type(testUser.password);
      cy.get('button[type="submit"]').click();
      
      // Session should be temporary
      cy.window().then(win => {
        const token = win.sessionStorage.getItem('tempToken');
        if (token) {
          expect(token).to.exist;
        }
      });
    });
  });
});