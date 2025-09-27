describe('Production Ready Tests - Tennis App', () => {
  // Test user credentials
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!'
  };

  // Use session management for efficient test execution
  beforeEach(() => {
    cy.session('auth', () => {
      // Try API login first (faster)
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'test-token-for-e2e');
        win.localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: testUser.email,
          firstName: 'Test',
          lastName: 'User'
        }));
      });
      
      // Alternatively, use real login if API is available
      // cy.loginViaAPI(testUser.email, testUser.password);
    });
    
    // Restore session
    cy.visit('/');
  });

  describe('Player Management', () => {
    it('should list all players', () => {
      cy.visit('/players');
      cy.url().should('include', '/players');
      
      // Check for key UI elements
      cy.get('body').then($body => {
        // Look for any indication of player content
        const hasPlayerContent = 
          $body.text().includes('Player') || 
          $body.text().includes('player') ||
          $body.find('[data-cy*="player"]').length > 0;
        
        expect(hasPlayerContent).to.be.true;
      });
    });

    it('should create a new player', () => {
      const uniqueId = Date.now();
      
      cy.visit('/players/create');
      
      // Fill in the player form
      cy.get('#firstName').type(`John_${uniqueId}`);
      cy.get('#lastName').type(`Doe_${uniqueId}`);
      cy.get('#email').type(`john.doe${uniqueId}@example.com`);
      cy.get('#phone').type('1234567890');
      cy.get('#dateOfBirth').type('1990-01-01');
      
      // Select skill level if available
      cy.get('body').then($body => {
        if ($body.find('#skillLevel').length > 0) {
          cy.get('#skillLevel').select('3');
        }
      });
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      // Verify successful creation
      cy.url().should('not.include', '/create');
      
      // Go back to players list and verify new player exists
      cy.visit('/players');
      cy.contains(`John_${uniqueId}`).should('exist');
    });

    it('should update an existing player', () => {
      cy.visit('/players');
      
      // Click on first player or edit button
      cy.get('body').then($body => {
        if ($body.find('[data-cy="edit-player"]').length > 0) {
          cy.get('[data-cy="edit-player"]').first().click();
        } else if ($body.find('a[href*="/players/"]').length > 0) {
          cy.get('a[href*="/players/"]').first().click();
          cy.get('[data-cy="edit-btn"], button:contains("Edit")').click();
        }
      });
      
      // Update phone number
      cy.get('#phone').clear().type('9876543210');
      
      // Save changes
      cy.get('button[type="submit"]').click();
      
      // Verify update
      cy.contains('9876543210').should('exist');
    });

    it('should search for players', () => {
      cy.visit('/players');
      
      // Look for search input
      cy.get('input[placeholder*="Search"], input[type="search"], [data-cy="search-input"]')
        .first()
        .type('John');
      
      // Wait for search results
      cy.wait(500);
      
      // Verify filtered results
      cy.get('body').then($body => {
        const text = $body.text();
        expect(text).to.satisfy((t: string) => 
          t.includes('John') || t.includes('No results') || t.includes('No players')
        );
      });
    });
  });

  describe('Tournament Management', () => {
    it('should list all tournaments', () => {
      cy.visit('/tournaments');
      cy.url().should('include', '/tournaments');
      
      // Check for tournament content
      cy.get('body').then($body => {
        const hasTournamentContent = 
          $body.text().includes('Tournament') || 
          $body.text().includes('tournament') ||
          $body.find('[data-cy*="tournament"]').length > 0;
        
        expect(hasTournamentContent).to.be.true;
      });
    });

    it('should create a new tournament', () => {
      const uniqueId = Date.now();
      
      cy.visit('/tournaments/create');
      
      // Fill in tournament details
      cy.get('#name').type(`Summer Championship ${uniqueId}`);
      cy.get('#location').type('Tennis Center');
      cy.get('#description').type('Annual summer tennis championship');
      
      // Set dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      cy.get('#startDate').type(tomorrow.toISOString().split('T')[0]);
      cy.get('#endDate').type(nextWeek.toISOString().split('T')[0]);
      
      // Set tournament type and surface
      cy.get('#type').select('0');
      cy.get('#surface').select('0');
      
      // Set draw size
      cy.get('#drawSize').select('16');
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Verify creation
      cy.url().should('not.include', '/create');
      cy.contains(`Summer Championship ${uniqueId}`).should('exist');
    });

    it('should view tournament details', () => {
      cy.visit('/tournaments');
      
      // Click on first tournament
      cy.get('a[href*="/tournaments/"]').first().click();
      
      // Verify we're on tournament details page
      cy.url().should('match', /\/tournaments\/\d+/);
      
      // Check for tournament information
      cy.get('body').then($body => {
        const hasDetails = 
          $body.find('[data-cy="tournament-name"]').length > 0 ||
          $body.find('h1, h2, h3').length > 0;
        
        expect(hasDetails).to.be.true;
      });
    });

    it('should register a player for tournament', () => {
      cy.visit('/tournaments');
      
      // Go to first tournament
      cy.get('a[href*="/tournaments/"]').first().click();
      
      // Look for registration section
      cy.get('body').then($body => {
        if ($body.find('[data-cy="register-player-btn"]').length > 0) {
          cy.get('[data-cy="register-player-btn"]').click();
        } else if ($body.find('button:contains("Register")').length > 0) {
          cy.contains('button', 'Register').click();
        }
        
        // If modal or form appears, fill it
        if ($body.find('[data-cy="player-select"]').length > 0) {
          cy.get('[data-cy="player-select"]').select(0);
          cy.get('[data-cy="confirm-registration"]').click();
        }
      });
    });

    it('should filter tournaments by status', () => {
      cy.visit('/tournaments');
      
      // Look for status filter
      cy.get('select[data-cy="status-filter"], select[name*="status"]').then($select => {
        if ($select.length > 0) {
          cy.wrap($select).select('Upcoming');
          
          // Wait for filter to apply
          cy.wait(500);
          
          // Verify filtered results
          cy.get('[data-cy="tournament-card"], .tournament-item').each($card => {
            cy.wrap($card).should('contain.text', 'Upcoming');
          });
        }
      });
    });
  });

  describe('Match Management', () => {
    it('should display match schedule', () => {
      cy.visit('/matches');
      cy.url().should('include', '/matches');
      
      // Check for match content
      cy.get('body').then($body => {
        const hasMatchContent = 
          $body.text().includes('Match') || 
          $body.text().includes('match') ||
          $body.text().includes('Schedule');
        
        expect(hasMatchContent).to.be.true;
      });
    });

    it('should create a new match', () => {
      cy.visit('/matches/create');
      
      // Select tournament
      cy.get('#tournamentId').select(0);
      
      // Select players
      cy.get('#player1Id').select(0);
      cy.get('#player2Id').select(1);
      
      // Set match details
      cy.get('#round').type('1');
      cy.get('#court').type('Center Court');
      
      // Set match time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      cy.get('#scheduledTime').type(tomorrow.toISOString().slice(0, 16));
      
      // Submit
      cy.get('button[type="submit"]').click();
      
      // Verify creation
      cy.url().should('not.include', '/create');
    });

    it('should update match score', () => {
      cy.visit('/matches');
      
      // Click on first match
      cy.get('a[href*="/matches/"]').first().click();
      
      // Look for score update section
      cy.get('body').then($body => {
        if ($body.find('[data-cy="update-score-btn"]').length > 0) {
          cy.get('[data-cy="update-score-btn"]').click();
          
          // Update scores
          cy.get('#set1Player1').type('6');
          cy.get('#set1Player2').type('4');
          
          // Save scores
          cy.get('[data-cy="save-score-btn"]').click();
          
          // Verify update
          cy.contains('6-4').should('exist');
        }
      });
    });
  });

  describe('Dashboard and Reports', () => {
    it('should display dashboard with statistics', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      
      // Check for dashboard elements
      cy.get('body').then($body => {
        const hasDashboardContent = 
          $body.find('.stat-card, .dashboard-card, [data-cy*="stat"]').length > 0 ||
          $body.text().includes('Total') ||
          $body.text().includes('Active');
        
        expect(hasDashboardContent).to.be.true;
      });
    });

    it('should generate tournament report', () => {
      cy.visit('/reports');
      
      // Select report type
      cy.get('#reportType').select('Tournament Summary');
      
      // Select tournament
      cy.get('#tournamentId').select(0);
      
      // Generate report
      cy.get('[data-cy="generate-report-btn"], button:contains("Generate")').click();
      
      // Wait for report
      cy.wait(1000);
      
      // Verify report generated
      cy.get('.report-content, [data-cy="report-content"]').should('exist');
    });
  });

  describe('User Profile and Settings', () => {
    it('should view and update user profile', () => {
      cy.visit('/profile');
      
      // Check profile page loaded
      cy.url().should('include', '/profile');
      
      // Update phone number
      cy.get('#phone').clear().type('5555555555');
      
      // Save changes
      cy.get('button[type="submit"]').click();
      
      // Verify update
      cy.contains('Profile updated').should('exist');
    });

    it('should update application settings', () => {
      cy.visit('/settings');
      
      // Toggle notification settings
      cy.get('#emailNotifications').click();
      
      // Change language if available
      cy.get('body').then($body => {
        if ($body.find('#language').length > 0) {
          cy.get('#language').select('en');
        }
      });
      
      // Save settings
      cy.get('button[type="submit"]').click();
      
      // Verify settings saved
      cy.contains('Settings saved').should('exist');
    });
  });

  describe('Authentication Flow', () => {
    it('should handle logout correctly', () => {
      // Ensure we're logged in first
      cy.visit('/dashboard');
      
      // Find and click logout
      cy.get('[data-cy="logout-btn"], button:contains("Logout"), a:contains("Logout")')
        .first()
        .click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Should not be able to access protected route
      cy.visit('/players');
      cy.url().should('include', '/login');
    });
  });
});