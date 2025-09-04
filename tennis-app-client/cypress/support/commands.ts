/// <reference types="cypress" />
// ***********************************************
// This file contains custom commands for Cypress
// ***********************************************

// Authentication commands
Cypress.Commands.add('loginByAPI', (email: string, password: string) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
    email,
    password,
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('token');
    
    // Store the token
    window.localStorage.setItem('authToken', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
    
    // Set the token as a default header for future requests
    cy.intercept('**/*', (req) => {
      req.headers['Authorization'] = `Bearer ${response.body.token}`;
    });
  });
});

// Database seeding commands
Cypress.Commands.add('seedDatabase', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/test/seed`, {
    // Add seed data configuration
    players: 20,
    tournaments: 5,
    matches: 10,
  }).then((response) => {
    expect(response.status).to.eq(200);
    cy.task('log', 'Database seeded successfully');
  });
});

// Cleanup commands
Cypress.Commands.add('cleanupTestData', () => {
  cy.request('DELETE', `${Cypress.env('apiUrl')}/test/cleanup`).then((response) => {
    expect(response.status).to.eq(200);
    cy.task('log', 'Test data cleaned up successfully');
  });
});

// API health check
Cypress.Commands.add('waitForApi', () => {
  cy.request({
    url: `${Cypress.env('apiUrl')}/health`,
    retryOnStatusCodeFailure: true,
    retryOnNetworkFailure: true,
    timeout: 30000,
  }).then((response) => {
    expect(response.status).to.eq(200);
  });
});

// Accessibility commands (extends cypress-axe)
Cypress.Commands.add('checkA11y', (context = null, options = null) => {
  cy.injectAxe();
  cy.checkA11y(context, options, (violations) => {
    const violationData = violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
    }));
    
    cy.task('table', violationData);
    
    // Log violations to console with more detail
    violations.forEach((violation) => {
      const nodes = Cypress.$(violation.nodes.map((node) => node.target).join(','));
      
      Cypress.log({
        name: 'A11Y',
        consoleProps: () => violation,
        $el: nodes,
        message: `[${violation.impact}] ${violation.id}`,
      });
    });
  });
});

// Utility commands for common interactions
Cypress.Commands.add('getByTestId', (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`);
});

Cypress.Commands.add('getByRole', (role: string, options?: any) => {
  return cy.findByRole(role, options);
});

Cypress.Commands.add('getByLabel', (label: string) => {
  return cy.findByLabelText(label);
});

// Navigation helpers
Cypress.Commands.add('visitWithAuth', (url: string) => {
  cy.loginByAPI('test@example.com', 'Test123!');
  cy.visit(url);
});

// Form helpers
Cypress.Commands.add('fillForm', (formData: Record<string, any>) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[name="${field}"]`).clear().type(value.toString());
  });
});

// Wait helpers
Cypress.Commands.add('waitForSpinner', () => {
  cy.get('.spinner', { timeout: 10000 }).should('not.exist');
});

Cypress.Commands.add('waitForToast', () => {
  cy.get('.toast-message').should('be.visible');
  cy.get('.toast-message').should('not.exist');
});

// Screenshot helpers for visual testing
Cypress.Commands.add('compareSnapshot', (name: string, threshold = 0.1) => {
  cy.screenshot(name);
  // This would integrate with Percy or another visual testing service
});

// Export to satisfy TypeScript
export {};