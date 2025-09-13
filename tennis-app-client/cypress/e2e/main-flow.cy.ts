/// <reference types="cypress" />

describe('Main Application Flow - Real Backend', () => {
  let testUser: { email: string; password: string; token?: string };

  before(() => {
    // Create unique test user for this test run
    const uniqueId = Date.now();
    testUser = {
      email: `e2e-test-${uniqueId}@example.com`,
      password: 'TestPass123'
    };

    // Register the test user via API
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/register`,
      body: {
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        firstName: 'E2E',
        lastName: `Test${uniqueId}`
      },
      failOnStatusCode: false,
      timeout: 10000
    }).then((response) => {
      if (response.status === 200 || response.status === 201) {
        testUser.token = response.body.token;
      } else if (response.status === 409) {
        // User might exist, try to login
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/auth/login`,
          body: {
            email: testUser.email,
            password: testUser.password
          },
          failOnStatusCode: false,
          timeout: 10000
        }).then((loginResponse) => {
          if (loginResponse.status === 200) {
            testUser.token = loginResponse.body.token;
          }
        });
      }
    });
  });

  beforeEach(() => {
    // Clear local storage before each test
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  describe('Authentication Flow', () => {
    it('should redirect to login when not authenticated', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should login successfully via UI', () => {
      cy.visit('/login');
      
      // Wait for login form to be visible
      cy.get('input[formControlName="email"], input[type="email"]', { timeout: 10000 }).should('be.visible');
      
      // Fill in login form
      cy.get('input[formControlName="email"], input[type="email"]').clear().type(testUser.email);
      cy.get('input[formControlName="password"], input[type="password"]').clear().type(testUser.password);
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url({ timeout: 15000 }).should('not.include', '/login');
      
      // Verify token is stored
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        expect(token).to.exist;
      });
    });

    it('should maintain session across navigation', () => {
      // Login first
      cy.visit('/login');
      cy.get('input[formControlName="email"], input[type="email"]').clear().type(testUser.email);
      cy.get('input[formControlName="password"], input[type="password"]').clear().type(testUser.password);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 15000 }).should('not.include', '/login');
      
      // Navigate to different pages
      cy.visit('/players');
      cy.url().should('include', '/players');
      
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      
      // Should not redirect to login
      cy.url().should('not.include', '/login');
    });
  });

  describe('Basic Page Access', () => {
    beforeEach(() => {
      // Login before each test in this suite
      cy.visit('/login');
      cy.get('input[formControlName="email"], input[type="email"]').clear().type(testUser.email);
      cy.get('input[formControlName="password"], input[type="password"]').clear().type(testUser.password);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 15000 }).should('not.include', '/login');
    });

    it('should access dashboard', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      cy.contains(/dashboard|welcome|home/i).should('exist');
    });

    it('should access players page', () => {
      cy.visit('/players');
      cy.url().should('include', '/players');
      cy.contains(/player/i).should('exist');
    });

    it('should access tournaments page', () => {
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      cy.contains(/tournament/i).should('exist');
    });

    it('should access matches page', () => {
      cy.visit('/matches');
      cy.url().should('include', '/matches');
      cy.contains(/match/i).should('exist');
    });
  });

  describe('Logout Flow', () => {
    it('should logout successfully', () => {
      // Login first
      cy.visit('/login');
      cy.get('input[formControlName="email"], input[type="email"]').clear().type(testUser.email);
      cy.get('input[formControlName="password"], input[type="password"]').clear().type(testUser.password);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 15000 }).should('not.include', '/login');
      
      // Find and click logout
      cy.get('button, a').contains(/logout|sign out/i).first().click({ force: true });
      
      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Token should be cleared
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        expect(token).to.not.exist;
      });
    });
  });
});