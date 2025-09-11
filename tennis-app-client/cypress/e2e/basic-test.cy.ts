describe('Basic Test', () => {
  it('should visit home page', () => {
    cy.visit('/');
    cy.url().should('include', 'localhost');
  });
  
  it('should navigate to players page', () => {
    cy.visit('/players');
    cy.url().should('include', '/players');
  });
  
  it('should navigate to tournaments page', () => {
    cy.visit('/tournaments');
    cy.url().should('include', '/tournaments');
  });
});