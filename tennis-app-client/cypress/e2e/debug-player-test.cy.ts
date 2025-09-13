describe('Debug Player Test', () => {
  it('should debug player creation flow', () => {
    const uniqueId = Date.now();
    
    // Step 1: Visit players page
    cy.visit('/players');
    cy.url().should('include', '/players');
    cy.log('Successfully visited players page');
    
    // Step 2: Look for create button
    cy.log('Looking for create player button');
    
    // Try to find the button with multiple strategies
    cy.get('body').then($body => {
      // Log what buttons exist
      const buttons = $body.find('button, a').length;
      cy.log(`Found ${buttons} buttons/links on page`);
      
      // Check if data-cy attribute exists
      if ($body.find('[data-cy="create-player-btn"]').length > 0) {
        cy.log('Found button with data-cy="create-player-btn"');
        cy.get('[data-cy="create-player-btn"]').click();
      } else if ($body.find('button:contains("Add New Player")').length > 0) {
        cy.log('Found button with text "Add New Player"');
        cy.get('button:contains("Add New Player")').click();
      } else if ($body.find('a[href*="/players/create"]').length > 0) {
        cy.log('Found link to /players/create');
        cy.get('a[href*="/players/create"]').first().click();
      } else {
        // Log the actual HTML to see what's there
        cy.log('Could not find create button. Page HTML:');
        cy.log($body.find('.page-header').html());
        throw new Error('Create button not found');
      }
    });
    
    // Step 3: Verify we're on the create page
    cy.url().should('include', '/create');
    cy.log('Successfully navigated to create page');
    
    // Step 4: Check if form fields exist
    cy.get('body').then($body => {
      const hasFirstName = $body.find('#firstName').length > 0;
      const hasLastName = $body.find('#lastName').length > 0;
      cy.log(`Form fields - firstName: ${hasFirstName}, lastName: ${hasLastName}`);
    });
    
    // Step 5: Fill the form
    cy.get('#firstName').should('be.visible').type(`Test_${uniqueId}`);
    cy.get('#lastName').should('be.visible').type(`User_${uniqueId}`);
    cy.get('#email').should('be.visible').type(`test${uniqueId}@example.com`);
    cy.get('#phone').should('be.visible').type('1234567890');
    cy.get('#dateOfBirth').should('be.visible').type('1990-01-01');
    
    cy.log('Successfully filled form');
    
    // Step 6: Submit
    cy.get('button[type="submit"]').should('be.visible').click();
    
    // Step 7: Verify redirect
    cy.url().should('not.include', '/create');
    cy.log('Successfully created player and redirected');
  });
});