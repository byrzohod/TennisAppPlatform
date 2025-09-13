// Extend Cypress commands with proper auth
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

Cypress.Commands.add('createTestUser', () => {
  const uniqueId = Date.now();
  const testUser = {
    email: `test${uniqueId}@example.com`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: `User${uniqueId}`
  };

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: testUser,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200 || response.status === 201) {
      return testUser;
    } else {
      // User might already exist, try to login
      return testUser;
    }
  });
});

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

// TypeScript declarations
declare global {
  namespace Cypress {
    interface Chainable {
      loginViaAPI(email?: string, password?: string): Chainable<void>;
      createTestUser(): Chainable<any>;
      ensureLoggedIn(): Chainable<void>;
    }
  }
}

export {};