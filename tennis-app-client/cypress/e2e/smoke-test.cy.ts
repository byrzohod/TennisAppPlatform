/// <reference types="cypress" />

describe('Smoke Tests - Verify E2E Setup', () => {
  it('should load the home page', () => {
    cy.visit('/');
    cy.contains('Tennis App').should('be.visible');
  });

  it('should navigate to login page', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('h2').should('be.visible');
  });

  it('should navigate to register page', () => {
    cy.visit('/register');
    cy.url().should('include', '/register');
    cy.get('h2').should('be.visible');
  });

  it('should have working form inputs on login page', () => {
    cy.visit('/login');
    
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    
    // Test with new app-input components
    cy.get('app-input[formControlName="email"] input').type(testEmail).should('have.value', testEmail);
    cy.get('app-input[formControlName="password"] input').type(testPassword).should('have.value', testPassword);
  });

  it('should display validation errors on login', () => {
    cy.visit('/login');
    
    // Submit empty form
    cy.get('app-button[type="submit"] button').click();
    
    // Check that validation errors appear in the new UI structure
    cy.get('app-input[formControlName="email"]').should('contain.text', 'Email is required');
  });

  it('should connect to API health endpoint', () => {
    cy.request({
      url: `${Cypress.env('apiUrl')}/health`,
      failOnStatusCode: false
    }).then((response) => {
      // API should respond (even if with 404 since we might not have health endpoint)
      expect(response.status).to.be.oneOf([200, 404]);
    });
  });
});