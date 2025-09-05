/// <reference types="cypress" />

// Login via API
Cypress.Commands.add('loginByAPI', (email: string, password: string) => {
  // Mock login - don't actually call API
  window.localStorage.setItem('authToken', 'mock-token');
  window.localStorage.setItem('user', JSON.stringify({ email, id: 1 }));
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

// TypeScript definitions
declare global {
  namespace Cypress {
    interface Chainable {
      loginByAPI(email: string, password: string): Chainable<void>;
      seedDatabase(): Chainable<void>;
      cleanupTestData(): Chainable<void>;
      waitForApi(): Chainable<void>;
    }
  }
}

export {};