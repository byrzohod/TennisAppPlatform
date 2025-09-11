describe('Main Functionality Tests', () => {
  // Mock authentication to avoid backend dependency
  beforeEach(() => {
    // Mock the auth token to bypass login
    cy.window().then((win) => {
      win.localStorage.setItem('authToken', 'mock-jwt-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user']
      }));
    });

    // Intercept API calls to avoid backend dependency
    cy.intercept('GET', '**/api/v1/auth/me', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    });
  });

  describe('Navigation and Core Pages', () => {
    it('should navigate to main pages', () => {
      // Dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      cy.get('h1, h2, h3').should('exist');

      // Players
      cy.visit('/players');
      cy.url().should('include', '/players');
      
      // Tournaments
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      
      // Matches
      cy.visit('/matches');
      cy.url().should('include', '/matches');
    });
  });

  describe('Players Page', () => {
    beforeEach(() => {
      // Mock players API
      cy.intercept('GET', '**/api/v1/players*', {
        statusCode: 200,
        body: {
          items: [
            {
              id: '1',
              firstName: 'Roger',
              lastName: 'Federer',
              email: 'roger@tennis.com',
              rankingPoints: 5000,
              country: 'Switzerland'
            },
            {
              id: '2',
              firstName: 'Rafael',
              lastName: 'Nadal',
              email: 'rafa@tennis.com',
              rankingPoints: 4500,
              country: 'Spain'
            }
          ],
          totalCount: 2,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1
        }
      }).as('getPlayers');
    });

    it('should display players list', () => {
      cy.visit('/players');
      cy.wait('@getPlayers');
      
      // Check for player data
      cy.contains('Federer').should('exist');
      cy.contains('Nadal').should('exist');
    });

    it('should have create player button', () => {
      cy.visit('/players');
      cy.get('button, a').contains(/add|create|new/i).should('exist');
    });

    it('should have search functionality', () => {
      cy.visit('/players');
      cy.get('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').should('exist');
    });
  });

  describe('Tournaments Page', () => {
    beforeEach(() => {
      // Mock tournaments API
      cy.intercept('GET', '**/api/v1/tournaments*', {
        statusCode: 200,
        body: [
          {
            id: 1,
            name: 'Wimbledon',
            location: 'London, UK',
            startDate: '2024-07-01',
            endDate: '2024-07-14',
            type: 3,
            surface: 2,
            drawSize: 128,
            status: 'Upcoming',
            prizeMoneyUSD: 50000000
          },
          {
            id: 2,
            name: 'US Open',
            location: 'New York, USA',
            startDate: '2024-08-26',
            endDate: '2024-09-08',
            type: 3,
            surface: 0,
            drawSize: 128,
            status: 'Upcoming',
            prizeMoneyUSD: 60000000
          }
        ]
      }).as('getTournaments');
    });

    it('should display tournaments list', () => {
      cy.visit('/tournaments');
      cy.wait('@getTournaments');
      
      // Check for tournament data
      cy.contains('Wimbledon').should('exist');
      cy.contains('US Open').should('exist');
    });

    it('should have create tournament button', () => {
      cy.visit('/tournaments');
      cy.get('button, a').contains(/add|create|new/i).should('exist');
    });

    it('should display tournament cards with details', () => {
      cy.visit('/tournaments');
      cy.wait('@getTournaments');
      
      // Check for tournament details
      cy.contains('London').should('exist');
      cy.contains('New York').should('exist');
    });
  });

  describe('Dashboard Page', () => {
    beforeEach(() => {
      // Mock dashboard stats
      cy.intercept('GET', '**/api/v1/dashboard/stats', {
        statusCode: 200,
        body: {
          totalPlayers: 156,
          totalTournaments: 12,
          upcomingMatches: 5,
          completedMatches: 89
        }
      });
    });

    it('should display dashboard with statistics', () => {
      cy.visit('/dashboard');
      
      // Should have cards or stats sections
      cy.get('.card, [class*="card"], .stat').should('exist');
      
      // Should display user info
      cy.contains('Test User').should('exist');
    });
  });

  describe('Authentication Flow', () => {
    it('should redirect to login when not authenticated', () => {
      // Clear auth
      cy.window().then((win) => {
        win.localStorage.clear();
      });
      
      cy.visit('/players');
      cy.url().should('include', '/login');
    });

    it('should show login form elements', () => {
      cy.window().then((win) => {
        win.localStorage.clear();
      });
      
      cy.visit('/login');
      
      // Check for form elements
      cy.get('input[type="email"], input[formControlName="email"], input[name="email"]').should('exist');
      cy.get('input[type="password"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/dashboard');
      
      // Navigation should still be accessible
      cy.get('nav, header, [role="navigation"], button[aria-label*="menu"]').should('exist');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/tournaments');
      
      // Content should be visible
      cy.get('body').should('be.visible');
    });
  });
});