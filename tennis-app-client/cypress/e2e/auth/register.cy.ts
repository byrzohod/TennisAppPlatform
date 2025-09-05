/// <reference types="cypress" />

describe('Registration Minimal Test', () => {
  it('should load the register page', () => {
    cy.visit('/register');
    cy.url().should('include', '/register');
  });

  it('should display register form', () => {
    cy.visit('/register');
    cy.get('h2').should('contain', 'Register');
  });

  it('should have input fields', () => {
    cy.visit('/register');
    cy.get('input#firstName').should('be.visible');
    cy.get('input#email').should('be.visible');
  });
});