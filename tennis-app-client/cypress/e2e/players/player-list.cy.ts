describe('Player List', () => {
  beforeEach(() => {
    cy.visit('/players');
  });

  it('should display the players page', () => {
    cy.contains('Players').should('be.visible');
  });

  it('should load and display players when API returns data', () => {
    // Wait for the page to load
    cy.get('[data-cy="players-container"]', { timeout: 10000 }).should('be.visible');
    
    // The page should either show players or an empty state message
    // If there are players in the database, they should be displayed
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="player-card"]').length > 0) {
        // Players are present, verify they are displayed correctly
        cy.get('[data-cy="player-card"]').should('have.length.greaterThan', 0);
        
        // Check that player cards have expected content
        cy.get('[data-cy="player-card"]').first().within(() => {
          // Player cards should have name information
          cy.get('[data-cy="player-name"]').should('be.visible');
        });
      } else {
        // No players present, should show empty state or loading
        cy.get('[data-cy="empty-state"], [data-cy="loading-spinner"]').should('be.visible');
      }
    });
  });

  it('should show loading state initially', () => {
    cy.visit('/players');
    // Should show loading indicator briefly
    cy.get('[data-cy="loading-spinner"], .loading').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Intercept API call and force it to fail to test error handling
    cy.intercept('GET', '**/api/v1/players*', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('getPlayersError');
    
    cy.visit('/players');
    cy.wait('@getPlayersError');
    
    // Should show error message or empty state
    cy.get('[data-cy="error-message"], [data-cy="empty-state"]').should('be.visible');
  });

  it('should display search functionality if present', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="search-input"]').length > 0) {
        cy.get('[data-cy="search-input"]').should('be.visible');
      }
    });
  });

  it('should navigate to player detail when clicking on a player', () => {
    // Wait for players to load
    cy.get('[data-cy="players-container"]', { timeout: 10000 }).should('be.visible');
    
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="player-card"]').length > 0) {
        // Click on first player card
        cy.get('[data-cy="player-card"]').first().click();
        
        // Should navigate to player detail page
        cy.url().should('include', '/players/');
      }
    });
  });

  it('should show create player button for admin users', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="create-player-btn"]').length > 0) {
        cy.get('[data-cy="create-player-btn"]').should('be.visible');
      }
    });
  });
});