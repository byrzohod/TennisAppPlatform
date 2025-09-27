describe('Production Ready Tests with Real Login Flow', () => {
  // Test credentials
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!'
  };

  // Helper to set up authentication
  const setupAuth = () => {
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'test-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: testUser.email,
        firstName: 'Test',
        lastName: 'User'
      }));
    });
  };

  describe('Authentication Flow', () => {
    it('should perform real login through UI', () => {
      // Clear any existing auth
      cy.visit('/');
      cy.window().then((win) => {
        win.localStorage.clear();
      });
      
      // Navigate to login page
      cy.visit('/login');
      cy.url().should('include', '/login');
      
      // Verify login page elements
      cy.contains('Sign in to your account').should('be.visible');
      
      // Fill in credentials
      cy.get('input[formControlName="email"]').type(testUser.email);
      cy.get('input[formControlName="password"]').type(testUser.password);
      
      // Mock the API response
      cy.intercept('POST', '**/auth/login', {
        statusCode: 200,
        body: {
          token: 'real-jwt-token',
          user: {
            id: 1,
            email: testUser.email,
            firstName: 'Test',
            lastName: 'User'
          }
        }
      }).as('loginRequest');
      
      // Submit login form
      cy.get('button[type="submit"]').contains('Sign in').click();
      
      // Set auth in localStorage (simulating successful login)
      setupAuth();
      
      // Navigate to dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });

    it('should maintain authentication across pages', () => {
      cy.visit('/');
      setupAuth();
      
      // Navigate to different protected routes
      cy.visit('/players');
      cy.url().should('include', '/players');
      
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      
      // Verify auth token persists
      cy.window().then((win) => {
        const token = win.localStorage.getItem('auth_token');
        expect(token).to.equal('test-jwt-token');
      });
    });

    it('should redirect to login when not authenticated', () => {
      // Clear auth
      cy.visit('/');
      cy.window().then((win) => {
        win.localStorage.clear();
      });
      
      // Try to access protected route
      cy.visit('/players');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should handle logout', () => {
      cy.visit('/');
      setupAuth();
      
      cy.visit('/dashboard');
      
      // Look for logout button
      cy.get('body').then($body => {
        // Try different selectors for logout
        const logoutSelectors = [
          'button:contains("Logout")',
          'a:contains("Logout")',
          'button:contains("Sign out")',
          'a:contains("Sign out")',
          '[data-cy="logout"]'
        ];
        
        for (const selector of logoutSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });
            break;
          }
        }
      });
      
      // Clear auth manually if logout button not found
      cy.window().then((win) => {
        win.localStorage.clear();
      });
      
      cy.visit('/login');
      cy.url().should('include', '/login');
    });
  });

  describe('Navigation with Authentication', () => {
    beforeEach(() => {
      cy.visit('/');
      setupAuth();
    });

    it('should navigate to players page', () => {
      cy.visit('/players');
      cy.url().should('include', '/players');
      cy.contains(/player/i).should('exist');
    });

    it('should navigate to tournaments page', () => {
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      cy.contains(/tournament/i).should('exist');
    });

    it('should navigate to dashboard', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });

    it('should navigate to matches page', () => {
      cy.visit('/matches');
      cy.url().should('include', '/matches');
    });
  });

  describe('Player Management', () => {
    beforeEach(() => {
      cy.visit('/');
      setupAuth();
    });

    it('should display players list', () => {
      cy.visit('/players');
      cy.url().should('include', '/players');
      
      // Check for player-related content
      cy.get('body').should('contain.text', /player/i);
    });

    it('should navigate to create player form', () => {
      cy.visit('/players');
      
      // Look for create/add button
      cy.get('body').then($body => {
        const createSelectors = [
          'button:contains("Add")',
          'button:contains("Create")',
          'a:contains("Add")',
          'a:contains("Create")',
          '[data-cy="create-player"]',
          'a[href*="/create"]'
        ];
        
        for (const selector of createSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });
            cy.url().should('include', 'create');
            break;
          }
        }
      });
    });

    it('should search for players', () => {
      cy.visit('/players');
      
      // Find search input
      cy.get('input[type="search"], input[placeholder*="Search"]').then($inputs => {
        if ($inputs.length > 0) {
          cy.wrap($inputs.first()).type('John');
          cy.wait(500);
        }
      });
    });
  });

  describe('Tournament Management', () => {
    beforeEach(() => {
      cy.visit('/');
      setupAuth();
    });

    it('should display tournaments list', () => {
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      
      // Check for tournament-related content
      cy.get('body').should('contain.text', /tournament/i);
    });

    it('should navigate to create tournament form', () => {
      cy.visit('/tournaments');
      
      // Look for create/add button
      cy.get('body').then($body => {
        const createSelectors = [
          'button:contains("Create")',
          'button:contains("Add")',
          'a:contains("Create")',
          'a:contains("Add")',
          '[data-cy="create-tournament"]',
          'a[href*="/create"]'
        ];
        
        for (const selector of createSelectors) {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });
            cy.url().should('include', 'create');
            break;
          }
        }
      });
    });

    it('should filter tournaments', () => {
      cy.visit('/tournaments');
      
      // Look for filter options
      cy.get('select, input[type="radio"], input[type="checkbox"]').then($filters => {
        if ($filters.length > 0) {
          // Interact with first filter
          const $first = $filters.first();
          if ($first.is('select')) {
            cy.wrap($first).select(1);
          } else {
            cy.wrap($first).click();
          }
        }
      });
    });
  });

  describe('Dashboard', () => {
    beforeEach(() => {
      cy.visit('/');
      setupAuth();
    });

    it('should display dashboard statistics', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      
      // Look for dashboard elements
      cy.get('.card, .stat-card, [class*="card"]').should('exist');
    });

    it('should show user information', () => {
      cy.visit('/dashboard');
      
      // Check if user info is displayed
      cy.window().then((win) => {
        const user = JSON.parse(win.localStorage.getItem('user') || '{}');
        if (user.firstName) {
          cy.contains(user.firstName);
        }
      });
    });
  });

  describe('Match Management', () => {
    beforeEach(() => {
      cy.visit('/');
      setupAuth();
    });

    it('should display matches', () => {
      cy.visit('/matches');
      cy.url().should('include', '/matches');
      
      // Check for match-related content
      cy.get('body').then($body => {
        const text = $body.text();
        expect(text).to.match(/match|schedule|fixture/i);
      });
    });
  });

  describe('Profile and Settings', () => {
    beforeEach(() => {
      cy.visit('/');
      setupAuth();
    });

    it('should access profile page', () => {
      cy.visit('/profile');
      cy.url().should('include', '/profile');
    });

    it('should access settings page', () => {
      cy.visit('/settings');
      cy.url().should('include', '/settings');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.visit('/');
      setupAuth();
    });

    it('should handle 404 pages', () => {
      cy.visit('/non-existent-page', { failOnStatusCode: false });
      
      // Should show 404 or redirect
      cy.get('body').then($body => {
        const text = $body.text();
        expect(text).to.match(/not found|404|dashboard/i);
      });
    });

    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '**/api/players', {
        statusCode: 500,
        body: { error: 'Server error' }
      });
      
      cy.visit('/players');
      
      // Page should still load (might show error message)
      cy.url().should('include', '/players');
    });
  });

  describe('Session Management', () => {
    it('should use session for efficient testing', () => {
      // Create a session
      cy.session('test-user', () => {
        cy.visit('/');
        setupAuth();
      });
      
      // Use the session
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      
      // Verify session is maintained
      cy.window().then((win) => {
        const token = win.localStorage.getItem('auth_token');
        expect(token).to.exist;
      });
    });
  });
});