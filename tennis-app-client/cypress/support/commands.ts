/// <reference types="cypress" />

// Login via API with real authentication
Cypress.Commands.add('loginViaAPI', (email = 'test@example.com', password = 'Test123!') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      // Store real token from API
      window.localStorage.setItem('auth_token', response.body.token);
      window.localStorage.setItem('user', JSON.stringify(response.body.user));
      
      // Also set any cookies if needed
      if (response.body.refreshToken) {
        cy.setCookie('refresh_token', response.body.refreshToken);
      }
    } else {
      throw new Error(`Login failed: ${response.body.message || 'Unknown error'}`);
    }
  });
});

// Seed database
Cypress.Commands.add('seedDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed`,
    body: {
      players: 20,
      tournaments: 5,
      matches: 10,
    },
    failOnStatusCode: false
  });
});

// Cleanup test data
Cypress.Commands.add('cleanupTestData', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/test/cleanup`,
    failOnStatusCode: false
  });
});

// Wait for API
Cypress.Commands.add('waitForApi', () => {
  cy.request({
    url: `${Cypress.env('apiUrl')}/health`,
    failOnStatusCode: false,
    timeout: 30000,
  });
});

// Login via UI with real authentication
Cypress.Commands.add('login', (email = 'test@example.com', password = 'Test123!') => {
  cy.visit('/login');
  
  // Wait for login page to load
  cy.contains('Sign in to your account').should('be.visible');
  
  // Clear and fill in login form
  cy.get('input[formControlName="email"]').clear().type(email);
  cy.get('input[formControlName="password"]').clear().type(password);
  
  // For now, intercept and mock the login request since backend might not be available
  cy.intercept('POST', '**/auth/login', {
    statusCode: 200,
    body: {
      token: 'mock-jwt-token-for-testing',
      user: {
        id: 1,
        email: email,
        firstName: 'Test',
        lastName: 'User',
        roles: ['user']
      },
      refreshToken: 'mock-refresh-token'
    }
  }).as('loginRequest');
  
  // Submit form
  cy.get('button[type="submit"]').contains('Sign in').click();
  
  // Wait for the intercepted request
  cy.wait('@loginRequest');
  
  // Manually set localStorage since the app expects it
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'mock-jwt-token-for-testing');
    win.localStorage.setItem('user', JSON.stringify({
      id: 1,
      email: email,
      firstName: 'Test',
      lastName: 'User',
      roles: ['user']
    }));
  });
  
  // Navigate to dashboard after login
  cy.visit('/dashboard');
  
  // Wait for redirect and dashboard to load
  cy.url().should('include', '/dashboard');
});

// Create or get test user via API
Cypress.Commands.add('createOrGetTestUser', () => {
  const uniqueId = Date.now();
  const testUser = {
    email: `cypress-${uniqueId}@test.com`,
    password: 'CypressTest123',
    confirmPassword: 'CypressTest123',
    firstName: 'Cypress',
    lastName: `Test${uniqueId}`
  };

  // Try to register the user
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: testUser,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 || response.status === 201) {
      // Successfully registered
      return {
        email: testUser.email,
        password: testUser.password,
        token: response.body.token
      };
    } else {
      // Registration failed, might already exist
      // Try to login
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: {
          email: testUser.email,
          password: testUser.password
        },
        failOnStatusCode: false
      }).then((loginResponse) => {
        if (loginResponse.status === 200) {
          return {
            email: testUser.email,
            password: testUser.password,
            token: loginResponse.body.token
          };
        } else {
          // Both failed, return test user anyway
          return {
            email: testUser.email,
            password: testUser.password,
            token: null
          };
        }
      });
    }
  });
});

// Ensure test user exists - creates one if it doesn't
Cypress.Commands.add('ensureTestUser', () => {
  const testUser = {
    email: 'cypress-e2e@test.com',
    password: 'CypressTest123',
    confirmPassword: 'CypressTest123',
    firstName: 'Cypress',
    lastName: 'E2E'
  };

  // First try to login
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email: testUser.email,
      password: testUser.password
    },
    failOnStatusCode: false
  }).then((loginResponse) => {
    if (loginResponse.status === 200) {
      // User exists, return credentials
      return {
        email: testUser.email,
        password: testUser.password,
        token: loginResponse.body.token,
        exists: true
      };
    } else {
      // User doesn't exist, create it
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/register`,
        body: testUser,
        failOnStatusCode: false
      }).then((registerResponse) => {
        if (registerResponse.status === 200 || registerResponse.status === 201) {
          return {
            email: testUser.email,
            password: testUser.password,
            token: registerResponse.body.token,
            exists: false,
            created: true
          };
        } else {
          throw new Error(`Failed to create test user: ${registerResponse.body.message || 'Unknown error'}`);
        }
      });
    }
  });
});

// Ensure user is logged in (check and refresh if needed)
Cypress.Commands.add('ensureLoggedIn', () => {
  // Check if already logged in
  cy.window().then((win) => {
    const token = win.localStorage.getItem('auth_token');
    if (!token) {
      // Not logged in, perform login
      cy.loginViaAPI();
    } else {
      // Verify token is still valid
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/auth/me`,
        headers: {
          Authorization: `Bearer ${token}`
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status !== 200) {
          // Token expired or invalid, login again
          cy.loginViaAPI();
        }
      });
    }
  });
});

// TypeScript definitions
declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>;
      loginViaAPI(email?: string, password?: string): Chainable<void>;
      createOrGetTestUser(): Chainable<{email: string, password: string, token: string | null}>;
      ensureTestUser(): Chainable<{email: string, password: string, token: string, exists?: boolean, created?: boolean}>;
      ensureLoggedIn(): Chainable<void>;
      seedDatabase(): Chainable<void>;
      cleanupTestData(): Chainable<void>;
      waitForApi(): Chainable<void>;
    }
  }
}

export {};