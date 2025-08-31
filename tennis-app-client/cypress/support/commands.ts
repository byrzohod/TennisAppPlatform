/// <reference types="cypress" />

// Custom commands for the Tennis App E2E tests

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsUser(email: string, password: string): Chainable<void>
      registerUser(firstName: string, lastName: string, email: string, password: string): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('loginAsUser', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-cy=email]').type(email)
  cy.get('[data-cy=password]').type(password)
  cy.get('[data-cy=login-button]').click()
  cy.url().should('include', '/dashboard')
})

// Register command
Cypress.Commands.add('registerUser', (firstName: string, lastName: string, email: string, password: string) => {
  cy.visit('/register')
  cy.get('[data-cy=firstName]').type(firstName)
  cy.get('[data-cy=lastName]').type(lastName)
  cy.get('[data-cy=email]').type(email)
  cy.get('[data-cy=password]').type(password)
  cy.get('[data-cy=register-button]').click()
  cy.url().should('include', '/dashboard')
})