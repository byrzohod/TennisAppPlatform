describe('Test With Login', () => {
  it('should login and navigate to players', () => {
    // Login
    cy.login();
    
    // Now navigate to players
    cy.visit('/players');
    
    // Should see the players page
    cy.url().should('include', '/players');
    
    // Check for create button
    cy.get('[data-cy="create-player-btn"]').should('be.visible');
  });
  
  it('should login and create a player', () => {
    const uniqueId = Date.now();
    
    // Login
    cy.login();
    
    // Navigate to players
    cy.visit('/players');
    
    // Click create button
    cy.get('[data-cy="create-player-btn"]').click();
    
    // Should be on create page
    cy.url().should('include', '/create');
    
    // Fill form
    cy.get('#firstName').type(`Test_${uniqueId}`);
    cy.get('#lastName').type(`User_${uniqueId}`);
    cy.get('#email').type(`test${uniqueId}@example.com`);
    cy.get('#phone').type('1234567890');
    cy.get('#dateOfBirth').type('1990-01-01');
    
    // Submit
    cy.get('button[type="submit"]').click();
    
    // Should redirect
    cy.url().should('not.include', '/create');
  });
  
  it('should login and navigate to tournaments', () => {
    // Login
    cy.login();
    
    // Navigate to tournaments
    cy.visit('/tournaments');
    
    // Should see the tournaments page
    cy.url().should('include', '/tournaments');
    
    // Check for search input
    cy.get('[data-cy="search-input"]').should('be.visible');
  });
});