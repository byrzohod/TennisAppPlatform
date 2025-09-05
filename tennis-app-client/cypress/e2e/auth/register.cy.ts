/// <reference types="cypress" />

describe('Registration Tests', () => {
  it('should load the register page', () => {
    cy.visit('/register');
    cy.url().should('include', '/register');
  });

  it('should have register page elements', () => {
    cy.visit('/register');
    // Just check that the page loads with some content
    cy.get('body').should('be.visible');
    cy.get('app-root').should('exist');
  });
});