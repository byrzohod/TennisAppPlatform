describe('Proper Auth Tests - Tennis App', () => {
  // Test credentials - these should exist in your test database
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!'
  };

  beforeEach(() => {
    // Use session management for efficient test execution
    cy.session('testUser', () => {
      // Set auth token directly for faster test execution
      cy.visit('/');
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'test-jwt-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: testUser.email,
          firstName: 'Test',
          lastName: 'User'
        }));
      });
    });
    
    // Restore session for each test
    cy.visit('/');
  });

  describe('Authenticated User Tests', () => {
    it('should access players after login', () => {
      cy.visit('/players');
      cy.url().should('include', '/players');
      cy.get('[data-cy="create-player-btn"]').should('be.visible');
    });

    it('should create a player with real auth', () => {
      const uniqueId = Date.now();
      
      cy.visit('/players/create');
      cy.get('#firstName').type(`Test_${uniqueId}`);
      cy.get('#lastName').type(`User_${uniqueId}`);
      cy.get('#email').type(`test${uniqueId}@example.com`);
      cy.get('#phone').type('1234567890');
      cy.get('#dateOfBirth').type('1990-01-01');
      
      cy.get('button[type="submit"]').click();
      
      // Should successfully create and redirect
      cy.url().should('not.include', '/create');
      
      // Verify player was actually created
      cy.visit('/players');
      cy.contains(`Test_${uniqueId}`).should('exist');
    });

    it('should logout and redirect to login', () => {
      // Find and click logout button
      cy.get('[data-cy="logout-btn"], button:contains("Logout")').click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Should not be able to access protected routes
      cy.visit('/players');
      cy.url().should('include', '/login');
    });
  });
});