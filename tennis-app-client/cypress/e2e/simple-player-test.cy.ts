describe('Simple Player Test', () => {
  it('should create a player', () => {
    const uniqueId = Date.now();
    
    // Visit players page
    cy.visit('/players');
    
    // Click create button - try multiple selectors
    cy.get('[data-cy="create-player-btn"], button:contains("Add New Player"), a[href*="/players/create"]').first().click();
    
    // Fill form
    cy.get('#firstName').type(`Test_${uniqueId}`);
    cy.get('#lastName').type(`User_${uniqueId}`);
    cy.get('#email').type(`test${uniqueId}@example.com`);
    cy.get('#phone').type('1234567890');
    cy.get('#dateOfBirth').type('1990-01-01');
    
    // Submit
    cy.get('button[type="submit"]').click();
    
    // Verify we're redirected
    cy.url().should('not.include', '/create');
  });
});