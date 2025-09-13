describe('Check Page Content', () => {
  it('should check what is on players page', () => {
    cy.visit('/players');
    
    // Wait for page to load
    cy.wait(2000);
    
    // Take a screenshot to see what's on the page
    cy.screenshot('players-page');
    
    // Log all buttons
    cy.get('button').each(($btn, index) => {
      cy.log(`Button ${index}: ${$btn.text()}`);
    });
    
    // Log all links
    cy.get('a').each(($link, index) => {
      cy.log(`Link ${index}: ${$link.text()} - href: ${$link.attr('href')}`);
    });
    
    // Check for any loading states
    cy.get('body').then($body => {
      if ($body.find('.loading-container').length > 0) {
        cy.log('Loading state detected');
      }
      if ($body.find('.error-message').length > 0) {
        cy.log('Error message detected: ' + $body.find('.error-message').text());
      }
      if ($body.find('[data-cy="create-player-btn"]').length > 0) {
        cy.log('Found create player button with data-cy');
      }
      if ($body.find('.btn-primary').length > 0) {
        cy.log('Found primary button: ' + $body.find('.btn-primary').text());
      }
    });
    
    // Wait for any async operations
    cy.wait(1000);
    
    // Try to find any element with "Add" or "Create" text
    cy.contains(/add|create/i).then($el => {
      cy.log(`Found element with Add/Create: ${$el.text()}`);
    });
  });
});