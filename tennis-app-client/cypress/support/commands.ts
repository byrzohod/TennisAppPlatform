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
      // Store real token from API (use authToken to match app)
      window.localStorage.setItem('authToken', response.body.token);
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

// Login via UI with real authentication - NO MOCKING
Cypress.Commands.add('login', (email = 'test@example.com', password = 'Test123!') => {
  cy.visit('/login');
  
  // Wait for login page to load
  cy.contains('Sign in to your account').should('be.visible');
  
  // Clear and fill in login form using app-input components
  cy.get('app-input[formControlName="email"] input, input[formControlName="email"]').clear().type(email);
  cy.get('app-input[formControlName="password"] input, input[formControlName="password"]').clear().type(password);
  
  // Submit form using app-button component
  cy.get('app-button[type="submit"] button, button[type="submit"]').click();
  
  // Wait for redirect away from login (should go to dashboard)
  cy.url({ timeout: 10000 }).should('not.include', '/login');
  cy.url().should('include', '/dashboard');
  
  // Verify auth token was stored
  cy.window().then((win) => {
    const token = win.localStorage.getItem('authToken');
    expect(token).to.exist;
  });
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

  // Try to register the user (with longer timeout for slow backend)
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: testUser,
    failOnStatusCode: false,
    timeout: 30000
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
        failOnStatusCode: false,
        timeout: 30000
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

  // First try to login (with longer timeout for slow backend)
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email: testUser.email,
      password: testUser.password
    },
    failOnStatusCode: false,
    timeout: 30000
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
        failOnStatusCode: false,
        timeout: 30000
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
    const token = win.localStorage.getItem('authToken');
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