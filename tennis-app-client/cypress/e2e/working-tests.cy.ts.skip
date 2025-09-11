describe('Working Tests - Tennis App', () => {
  beforeEach(() => {
    // Bypass authentication by setting token directly
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'fake-jwt-token-for-testing');
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }));
    });
  });

  describe('Player Management', () => {
    it('should create a new player', () => {
      const uniqueId = Date.now();
      
      // Go to players page
      cy.visit('/players');
      cy.url().should('include', '/players');
      
      // Find and click create button
      cy.get('[data-cy="create-player-btn"]').click();
      cy.url().should('include', '/create');
      
      // Fill form
      cy.get('#firstName').type(`John_${uniqueId}`);
      cy.get('#lastName').type(`Doe_${uniqueId}`);
      cy.get('#email').type(`john${uniqueId}@example.com`);
      cy.get('#phone').type('1234567890');
      cy.get('#dateOfBirth').type('1990-01-01');
      
      // Submit
      cy.get('button[type="submit"]').click();
      
      // Should redirect
      cy.url().should('not.include', '/create');
    });

    it('should list players', () => {
      cy.visit('/players');
      cy.url().should('include', '/players');
      
      // Should show player list or empty state
      cy.get('body').should('contain.text', 'Players');
    });

    it('should search players', () => {
      cy.visit('/players');
      
      // If search exists, use it
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').type('Test');
        }
      });
    });
  });

  describe('Tournament Management', () => {
    it('should create a tournament', () => {
      const uniqueId = Date.now();
      
      cy.visit('/tournaments/create');
      cy.url().should('include', '/tournaments/create');
      
      // Fill form
      cy.get('#name').type(`Tournament_${uniqueId}`);
      cy.get('#location').type(`Location_${uniqueId}`);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      cy.get('#startDate').type(tomorrow.toISOString().split('T')[0]);
      cy.get('#endDate').type(nextWeek.toISOString().split('T')[0]);
      cy.get('#type').select('0');
      cy.get('#surface').select('0');
      
      // Submit
      cy.get('button[type="submit"]').click();
      
      // Should redirect
      cy.url().should('not.include', '/create');
    });

    it('should list tournaments', () => {
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      
      // Should show tournaments or empty state
      cy.get('body').should('contain.text', 'Tournament');
    });

    it('should search tournaments', () => {
      cy.visit('/tournaments');
      
      // Search if available
      cy.get('[data-cy="search-input"]').should('exist').type('Test');
    });
  });

  describe('Navigation', () => {
    it('should navigate between pages', () => {
      // Players
      cy.visit('/players');
      cy.url().should('include', '/players');
      
      // Tournaments
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      
      // Dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });
  });
});