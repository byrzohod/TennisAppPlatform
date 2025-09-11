/// <reference types="cypress" />

describe('Tournament Basic Tests', () => {
  it('should load the tournaments page', () => {
    cy.visit('/tournaments');
    cy.url().should('include', '/tournaments');
  });

  it('should have proper page structure', () => {
    cy.visit('/tournaments');
    cy.get('app-root').should('exist');
  });

  it('should be accessible', () => {
    cy.visit('/tournaments');
    cy.get('body').should('be.visible');
  });
});