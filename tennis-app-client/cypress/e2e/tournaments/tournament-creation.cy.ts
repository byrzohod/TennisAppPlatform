describe('Tournament Creation', () => {
  beforeEach(() => {
    cy.visit('/tournaments/create');
  });

  it('should display the tournament creation form', () => {
    cy.contains('Create Tournament').should('be.visible');
    cy.get('#name').should('be.visible');
    cy.get('#location').should('be.visible');
    cy.get('#startDate').should('be.visible');
    cy.get('#endDate').should('be.visible');
    cy.get('#type').should('be.visible');
    cy.get('#surface').should('be.visible');
  });

  it('should show validation errors for required fields', () => {
    // Click submit without filling any fields
    cy.get('button[type="submit"]').click();
    
    // Check that validation errors are shown
    cy.contains('Name is required').should('be.visible');
    cy.contains('Location is required').should('be.visible');
    cy.contains('Start date is required').should('be.visible');
    cy.contains('End date is required').should('be.visible');
  });

  it('should successfully create a tournament with valid data', () => {
    // Fill out the form
    cy.get('#name').type('Test Tournament E2E');
    cy.get('#location').type('Test City E2E');
    
    // Set dates (future dates)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    cy.get('#startDate').type(tomorrow.toISOString().split('T')[0]);
    cy.get('#endDate').type(nextWeek.toISOString().split('T')[0]);
    
    // Select tournament type and surface
    cy.get('#type').select('0'); // ATP250
    cy.get('#surface').select('0'); // HardCourt
    
    // Set draw size
    cy.get('#drawSize').select('32');
    
    // Set prize money and entry fee
    cy.get('#prizeMoneyUSD').clear().type('50000');
    cy.get('#entryFee').clear().type('25');
    
    // Add description
    cy.get('#description').type('This is a test tournament created by E2E test');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for navigation or success indication
    // The form should either redirect to tournament detail page or show success message
    cy.url().should('not.include', '/create');
    
    // If redirected to tournament detail, check that it shows tournament info
    cy.contains('Test Tournament E2E').should('be.visible');
  });

  it('should display server validation errors if any occur', () => {
    // Fill form with potentially problematic data
    cy.get('#name').type('T'); // Very short name that might cause server error
    cy.get('#location').type('Test Location');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    cy.get('#startDate').type(yesterday.toISOString().split('T')[0]); // Past date
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    cy.get('#endDate').type(tomorrow.toISOString().split('T')[0]);
    
    cy.get('#type').select('0');
    cy.get('#surface').select('0');
    
    cy.get('button[type="submit"]').click();
    
    // Should show server validation error
    cy.get('.alert-error').should('be.visible');
  });

  it('should have proper dropdown options for tournament type', () => {
    cy.get('#type').should('contain', 'ATP 250');
    cy.get('#type').should('contain', 'ATP 500');
    cy.get('#type').should('contain', 'Grand Slam');
  });

  it('should have proper dropdown options for surface', () => {
    cy.get('#surface').should('contain', 'Hard Court');
    cy.get('#surface').should('contain', 'Clay');
    cy.get('#surface').should('contain', 'Grass');
  });
});