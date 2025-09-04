// ***********************************************************
// This file is processed and loaded automatically before test files.
//
// You can change the location of this file or turn off processing it by setting
// the "supportFile" config option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Import cypress-axe for accessibility testing
import 'cypress-axe';

// Import cypress-real-events for more realistic user interactions
import 'cypress-real-events/support';

// Import Testing Library commands
import '@testing-library/cypress/add-commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom TypeScript types
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login via API
       * @example cy.loginByAPI('user@example.com', 'password')
       */
      loginByAPI(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to seed test data
       * @example cy.seedDatabase()
       */
      seedDatabase(): Chainable<void>;
      
      /**
       * Custom command to clean up test data
       * @example cy.cleanupTestData()
       */
      cleanupTestData(): Chainable<void>;
      
      /**
       * Custom command to wait for API to be ready
       * @example cy.waitForApi()
       */
      waitForApi(): Chainable<void>;
      
      /**
       * Custom command to check accessibility
       * @example cy.checkA11y()
       */
      checkA11y(context?: any, options?: any): Chainable<void>;
    }
  }
}

// Prevent TypeScript from reading file as legacy script
export {};

// Global beforeEach/afterEach hooks
beforeEach(() => {
  // Log test start
  cy.task('log', `Starting test: ${Cypress.currentTest.title}`);
});

afterEach(() => {
  // Log test completion
  cy.task('log', `Completed test: ${Cypress.currentTest.title}`);
});