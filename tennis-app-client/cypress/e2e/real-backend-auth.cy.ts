describe('Tennis App E2E Tests with Real Backend Authentication', () => {
  // Test user that we've registered in the backend
  const testUser = {
    email: 'cypress@test.com',
    password: 'CypressTest123',
    firstName: 'Cypress',
    lastName: 'Test'
  };

  // Helper to perform real login through UI
  const loginViaUI = (email: string, password: string) => {
    cy.visit('/login');
    
    // Wait for login page to load
    cy.contains('Sign in to your account').should('be.visible');
    
    // Fill in credentials - using the app-input components
    cy.get('app-input[formControlName="email"] input').clear().type(email);
    cy.get('app-input[formControlName="password"] input').clear().type(password);
    
    // Submit the form
    cy.get('app-button[type="submit"] button').click();
    
    // Wait for successful redirect to dashboard
    cy.url().should('not.include', '/login', { timeout: 10000 });
    cy.url().should('include', '/dashboard');
    
    // Verify auth token exists (using correct key 'authToken')
    cy.window().then((win) => {
      const token = win.localStorage.getItem('authToken');
      expect(token).to.exist;
      expect(token).to.include('eyJ'); // JWT tokens start with this
    });
  };

  describe('Authentication', () => {
    beforeEach(() => {
      // Clear any existing auth before each test
      cy.visit('/');
      cy.window().then((win) => {
        win.localStorage.clear();
      });
    });

    it('should login with real backend credentials', () => {
      loginViaUI(testUser.email, testUser.password);
      
      // Verify we're on dashboard
      cy.url().should('include', '/dashboard');
      
      // Verify user info is stored
      cy.window().then((win) => {
        const user = JSON.parse(win.localStorage.getItem('user') || '{}');
        expect(user.email).to.equal(testUser.email);
        expect(user.firstName).to.equal(testUser.firstName);
      });
    });

    it('should maintain session across page navigations', () => {
      // Login first
      loginViaUI(testUser.email, testUser.password);
      
      // Navigate to different pages - should not redirect to login
      cy.visit('/players');
      cy.url().should('include', '/players');
      cy.url().should('not.include', '/login');
      
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      cy.url().should('not.include', '/login');
      
      cy.visit('/matches');
      cy.url().should('include', '/matches');
      cy.url().should('not.include', '/login');
      
      // Token should still exist
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        expect(token).to.exist;
      });
    });

    it('should redirect to login when accessing protected routes without auth', () => {
      // Try to access protected route without login
      cy.visit('/players');
      cy.url().should('include', '/login');
      
      cy.visit('/tournaments');
      cy.url().should('include', '/login');
    });

    it('should handle logout correctly', () => {
      // Login first
      loginViaUI(testUser.email, testUser.password);
      
      // Find and click logout
      cy.get('button, a').contains(/logout|sign out/i).first().click({ force: true });
      
      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Token should be cleared
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        expect(token).to.not.exist;
      });
      
      // Should not be able to access protected routes
      cy.visit('/players');
      cy.url().should('include', '/login');
    });
  });

  describe('Authenticated User Flows', () => {
    // Use session to maintain login across tests
    beforeEach(() => {
      cy.session('authenticated-user', () => {
        loginViaUI(testUser.email, testUser.password);
      });
      
      // Restore session
      cy.visit('/dashboard');
    });

    describe('Players Management', () => {
      it('should navigate to players list', () => {
        cy.visit('/players');
        cy.url().should('include', '/players');
        cy.contains(/player/i).should('exist');
      });

      it('should create a new player', () => {
        const uniqueId = Date.now();
        
        cy.visit('/players/create');
        cy.url().should('include', '/create');
        
        // Fill player form
        cy.get('#firstName').type(`Player_${uniqueId}`);
        cy.get('#lastName').type('TestLast');
        cy.get('#email').type(`player${uniqueId}@test.com`);
        cy.get('#phone').type('1234567890');
        cy.get('#dateOfBirth').type('1990-01-01');
        
        // Submit
        cy.get('button[type="submit"]').click();
        
        // Should redirect after creation
        cy.url().should('not.include', '/create');
        
        // Verify player was created
        cy.visit('/players');
        cy.contains(`Player_${uniqueId}`).should('exist');
      });

      it('should search for players', () => {
        cy.visit('/players');
        
        // Find search input
        cy.get('input[type="search"], input[placeholder*="Search"]').first().type('Player');
        
        // Wait for results
        cy.wait(500);
        
        // Should filter results
        cy.get('body').should('contain.text', /player/i);
      });
    });

    describe('Tournament Management', () => {
      it('should navigate to tournaments list', () => {
        cy.visit('/tournaments');
        cy.url().should('include', '/tournaments');
        cy.contains(/tournament/i).should('exist');
      });

      it('should create a new tournament', () => {
        const uniqueId = Date.now();
        
        cy.visit('/tournaments/create');
        cy.url().should('include', '/create');
        
        // Fill tournament form
        cy.get('#name').type(`Tournament_${uniqueId}`);
        cy.get('#location').type('Test Location');
        cy.get('#description').type('Test tournament description');
        
        // Set dates
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        cy.get('#startDate').type(tomorrow.toISOString().split('T')[0]);
        cy.get('#endDate').type(nextWeek.toISOString().split('T')[0]);
        
        // Select options
        cy.get('#type').select('0');
        cy.get('#surface').select('0');
        cy.get('#drawSize').select('16');
        
        // Submit
        cy.get('button[type="submit"]').click();
        
        // Should redirect after creation
        cy.url().should('not.include', '/create');
        
        // Verify tournament was created
        cy.contains(`Tournament_${uniqueId}`).should('exist');
      });

      it('should view tournament details', () => {
        cy.visit('/tournaments');
        
        // Click on first tournament
        cy.get('a[href*="/tournaments/"]').first().click();
        
        // Should show tournament details
        cy.url().should('match', /\/tournaments\/\d+/);
        cy.get('h1, h2, h3').should('exist');
      });
    });

    describe('Dashboard', () => {
      it('should display dashboard with user info', () => {
        cy.visit('/dashboard');
        cy.url().should('include', '/dashboard');
        
        // Should show user name
        cy.contains(testUser.firstName).should('exist');
        
        // Should show statistics cards
        cy.get('.card, .stat-card, [class*="card"]').should('exist');
      });

      it('should show recent activity', () => {
        cy.visit('/dashboard');
        
        // Look for activity section
        cy.contains(/recent|activity|latest/i).should('exist');
      });
    });

    describe('Match Management', () => {
      it('should navigate to matches', () => {
        cy.visit('/matches');
        cy.url().should('include', '/matches');
        cy.contains(/match|schedule/i).should('exist');
      });

      it('should create a new match', () => {
        cy.visit('/matches/create');
        cy.url().should('include', '/create');
        
        // Fill match form
        cy.get('#tournamentId').select(0);
        cy.get('#player1Id').select(0);
        cy.get('#player2Id').select(1);
        cy.get('#round').type('1');
        cy.get('#court').type('Court 1');
        
        // Set date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        cy.get('#scheduledTime').type(tomorrow.toISOString().slice(0, 16));
        
        // Submit
        cy.get('button[type="submit"]').click();
        
        // Should redirect after creation
        cy.url().should('not.include', '/create');
      });
    });

    describe('Profile Management', () => {
      it('should view user profile', () => {
        cy.visit('/profile');
        cy.url().should('include', '/profile');
        
        // Should show user email
        cy.get('input[type="email"]').should('have.value', testUser.email);
      });

      it('should update profile', () => {
        cy.visit('/profile');
        
        // Update phone
        cy.get('#phone').clear().type('9876543210');
        
        // Save
        cy.get('button[type="submit"]').click();
        
        // Should show success
        cy.contains(/saved|updated|success/i).should('exist');
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.session('authenticated-user-errors', () => {
        loginViaUI(testUser.email, testUser.password);
      });
    });

    it('should handle 404 pages gracefully', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false });
      cy.contains(/not found|404/i).should('exist');
    });

    it('should handle API errors', () => {
      // Intercept API call to simulate error
      cy.intercept('GET', '**/api/v1/players', {
        statusCode: 500,
        body: { message: 'Server error' }
      });
      
      cy.visit('/players');
      
      // Should show error message
      cy.contains(/error|problem|try again/i).should('exist');
    });
  });
});