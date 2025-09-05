// ***********************************************************
// This file is processed and loaded automatically before test files.
// ***********************************************************

// Import commands
import './commands';

// Import cypress-axe for accessibility testing
import 'cypress-axe';

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent the error from failing the test
  return false;
});