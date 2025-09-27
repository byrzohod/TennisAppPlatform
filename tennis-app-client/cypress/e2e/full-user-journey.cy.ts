describe('Full User Journey - Tennis App', () => {
  before(() => {
    // Login once before all tests
    cy.login();
  });

  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/**').as('apiCall');
    // Preserve auth cookies/storage between tests
    cy.window().then((win) => {
      win.sessionStorage.setItem('authenticated', 'true');
    });
  });
  
  const uniqueId = Date.now();
  const playerData = {
    firstName: `John_${uniqueId}`,
    lastName: `Doe_${uniqueId}`,
    email: `john${uniqueId}@example.com`,
    phone: '1234567890',
    dateOfBirth: '1990-01-01'
  };

  const tournamentData = {
    name: `Test Tournament ${uniqueId}`,
    location: `Test City ${uniqueId}`,
    description: `E2E Test Tournament created at ${new Date().toISOString()}`
  };

  describe('Player Management Journey', () => {
    beforeEach(() => {
      // Make sure we're logged in
      cy.window().then((win) => {
        if (!win.sessionStorage.getItem('authenticated')) {
          cy.login();
        }
      });
      cy.visit('/players');
      cy.wait(1000); // Wait for page to load
    });

    it('should create a new player', () => {
      // Navigate to player creation - button should be visible after login
      cy.get('[data-cy="create-player-btn"]').should('exist').click();
      
      // Fill player form
      cy.get('#firstName').should('be.visible').type(playerData.firstName);
      cy.get('#lastName').type(playerData.lastName);
      cy.get('#email').type(playerData.email);
      cy.get('#phone').type(playerData.phone);
      cy.get('#dateOfBirth').type(playerData.dateOfBirth);
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Verify navigation to player detail or list
      cy.url().should('not.include', '/create');
      cy.wait(1000);
      
      // Verify player appears in list
      cy.visit('/players');
      cy.contains(playerData.firstName).should('be.visible');
      cy.contains(playerData.lastName).should('be.visible');
    });

    it('should display created player in player list', () => {
      cy.visit('/players');
      
      // Search for the created player
      cy.wait(1000);
      cy.get('input[placeholder*="Search"]').should('be.visible').type(playerData.lastName);
      
      // Verify player is visible
      cy.contains(playerData.firstName).should('be.visible');
      cy.contains(playerData.lastName).should('be.visible');
    });

    it('should edit player details', () => {
      cy.visit('/players');
      
      // Find and click on the created player
      cy.wait(1000);
      cy.contains(playerData.lastName).should('be.visible').click();
      
      // Click edit button
      cy.wait(1000);
      cy.get('[data-cy="edit-player-btn"]').should('be.visible').click();
      
      // Update player details
      const updatedPhone = '9876543210';
      cy.wait(1000);
      cy.get('#phone').should('be.visible').clear().type(updatedPhone);
      
      // Save changes
      cy.get('button[type="submit"]').click();
      
      // Verify update was successful
      cy.url().should('not.include', '/edit');
    });
  });

  describe('Tournament Management Journey', () => {
    let createdTournamentId: number;

    beforeEach(() => {
      // Make sure we're logged in
      cy.window().then((win) => {
        if (!win.sessionStorage.getItem('authenticated')) {
          cy.login();
        }
      });
    });

    it('should create a new tournament', () => {
      cy.visit('/tournaments/create');
      cy.wait(1000);
      
      // Fill tournament form
      cy.get('#name').type(tournamentData.name);
      cy.get('#location').type(tournamentData.location);
      
      // Set dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      cy.get('#startDate').type(tomorrow.toISOString().split('T')[0]);
      cy.get('#endDate').type(nextWeek.toISOString().split('T')[0]);
      
      // Select tournament type and surface using enum values
      cy.get('#type').select('0'); // ATP250
      cy.get('#surface').select('0'); // HardCourt
      
      // Set draw size
      cy.get('#drawSize').select('32');
      
      // Set optional fields
      cy.get('#prizeMoneyUSD').clear().type('100000');
      cy.get('#entryFee').clear().type('50');
      cy.get('#description').type(tournamentData.description);
      
      // Submit form
      cy.get('button[type="submit"]').click();
      
      // Verify navigation to tournament detail
      cy.url().should('match', /\/tournaments\/\d+$/);
      
      // Extract tournament ID from URL
      cy.url().then((url) => {
        const match = url.match(/\/tournaments\/(\d+)$/);
        if (match) {
          createdTournamentId = parseInt(match[1]);
        }
      });
      
      // Verify tournament details are displayed
      cy.contains(tournamentData.name).should('be.visible');
      cy.contains(tournamentData.location).should('be.visible');
    });

    it('should display created tournament in tournament list', () => {
      cy.visit('/tournaments');
      
      // Verify tournament appears in list with correct details
      cy.contains(tournamentData.name).should('be.visible');
      cy.contains(tournamentData.location).should('be.visible');
      
      // Verify tournament type and surface are displayed correctly
      cy.contains('ATP 250').should('be.visible');
      cy.contains('Hard Court').should('be.visible');
    });

    it('should edit tournament details', () => {
      cy.visit('/tournaments');
      
      // Click on the created tournament
      cy.contains(tournamentData.name).click();
      
      // Click edit button
      cy.get('[data-cy="edit-tournament-btn"], button:contains("Edit")').first().click();
      
      // Verify dates are populated correctly
      cy.get('#startDate').should('not.have.value', '');
      cy.get('#endDate').should('not.have.value', '');
      
      // Update tournament details
      const updatedLocation = `Updated ${tournamentData.location}`;
      cy.get('#location').clear().type(updatedLocation);
      
      // Save changes
      cy.get('button[type="submit"]').click();
      
      // Verify update was successful
      cy.url().should('not.include', '/edit');
      cy.contains(updatedLocation).should('be.visible');
    });
  });

  describe('Player-Tournament Enrollment Journey', () => {
    beforeEach(() => {
      // Make sure we're logged in
      cy.window().then((win) => {
        if (!win.sessionStorage.getItem('authenticated')) {
          cy.login();
        }
      });
    });

    it('should register a player for a tournament', () => {
      // Navigate to tournament detail
      cy.visit('/tournaments');
      cy.wait(1000);
      cy.contains(tournamentData.name).click();
      
      // Go to players tab
      cy.get('[data-cy="players-tab"], button:contains("Players")').first().click();
      
      // Open registration modal
      cy.get('[data-cy="register-player-btn"], button:contains("Register Player")').first().click();
      
      // Search for the created player
      cy.get('[data-cy="player-search"], input[placeholder*="Search"]').type(playerData.lastName);
      
      // Select the player
      cy.contains(`${playerData.firstName} ${playerData.lastName}`).click();
      
      // Confirm registration
      cy.get('[data-cy="confirm-registration"], button:contains("Confirm")').click();
      
      // Verify player is registered
      cy.contains(`${playerData.firstName} ${playerData.lastName}`).should('be.visible');
      cy.contains('Registered').should('be.visible');
    });

    it('should update player seed in tournament', () => {
      // Navigate to tournament detail
      cy.visit('/tournaments');
      cy.contains(tournamentData.name).click();
      
      // Go to players tab
      cy.get('[data-cy="players-tab"], button:contains("Players")').first().click();
      
      // Find the registered player and update seed
      cy.contains(playerData.lastName)
        .parent()
        .within(() => {
          cy.get('input[type="number"], [data-cy="seed-input"]').clear().type('1');
          cy.get('button:contains("Save")').click();
        });
      
      // Verify seed was saved
      cy.contains('Seed updated').should('be.visible');
    });

    it('should withdraw a player from tournament', () => {
      // Navigate to tournament detail
      cy.visit('/tournaments');
      cy.contains(tournamentData.name).click();
      
      // Go to players tab
      cy.get('[data-cy="players-tab"], button:contains("Players")').first().click();
      
      // Find the registered player and withdraw
      cy.contains(playerData.lastName)
        .parent()
        .within(() => {
          cy.get('[data-cy="withdraw-btn"], button:contains("Withdraw")').click();
        });
      
      // Confirm withdrawal
      cy.on('window:confirm', () => true);
      
      // Verify player is withdrawn or removed from list
      cy.contains('Withdrawn').should('be.visible')
        .or(cy.contains(playerData.lastName).should('not.exist'));
    });
  });

  describe('Data Validation Journey', () => {
    beforeEach(() => {
      // Make sure we're logged in
      cy.window().then((win) => {
        if (!win.sessionStorage.getItem('authenticated')) {
          cy.login();
        }
      });
    });

    it('should validate all tournament fields are displayed correctly', () => {
      cy.visit('/tournaments');
      cy.wait(1000);
      
      // Find the created tournament and verify all fields
      cy.contains(tournamentData.name)
        .parent()
        .within(() => {
          // Verify tournament type
          cy.contains('ATP 250').should('be.visible');
          
          // Verify surface
          cy.contains('Hard Court').should('be.visible');
          
          // Verify draw size
          cy.contains('32').should('be.visible');
          
          // Verify prize money
          cy.contains('$100K').should('be.visible')
            .or(cy.contains('$100,000').should('be.visible'));
          
          // Verify location
          cy.contains(tournamentData.location).should('be.visible');
        });
    });

    it('should handle concurrent operations correctly', () => {
      // Create multiple tournaments quickly
      const tournaments = [];
      for (let i = 0; i < 3; i++) {
        tournaments.push({
          name: `Concurrent Test ${uniqueId}_${i}`,
          location: `Location ${i}`
        });
      }
      
      tournaments.forEach((tournament) => {
        cy.visit('/tournaments/create');
        
        cy.get('#name').type(tournament.name);
        cy.get('#location').type(tournament.location);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        cy.get('#startDate').type(tomorrow.toISOString().split('T')[0]);
        cy.get('#endDate').type(nextWeek.toISOString().split('T')[0]);
        cy.get('#type').select('0');
        cy.get('#surface').select('0');
        
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/create');
      });
      
      // Verify all tournaments were created
      cy.visit('/tournaments');
      tournaments.forEach((tournament) => {
        cy.contains(tournament.name).should('be.visible');
      });
    });
  });

  describe('Search and Filter Journey', () => {
    beforeEach(() => {
      // Make sure we're logged in
      cy.window().then((win) => {
        if (!win.sessionStorage.getItem('authenticated')) {
          cy.login();
        }
      });
    });

    it('should search for tournaments', () => {
      cy.visit('/tournaments');
      cy.wait(1000);
      
      // Search for the created tournament
      cy.get('[data-cy="search-input"], input[placeholder*="Search"]').type(tournamentData.name);
      
      // Verify only matching tournament is shown
      cy.contains(tournamentData.name).should('be.visible');
      
      // Clear search
      cy.get('[data-cy="search-input"], input[placeholder*="Search"]').clear();
    });

    it('should filter tournaments by status', () => {
      cy.visit('/tournaments');
      
      // Apply status filter if available
      cy.get('select[data-cy="status-filter"], select:contains("Status")').then(($select) => {
        if ($select.length > 0) {
          cy.wrap($select).select('Upcoming');
          
          // Verify filtered results
          cy.get('[data-cy="tournament-card"]').each(($card) => {
            cy.wrap($card).should('contain', 'Upcoming');
          });
        }
      });
    });

    it('should paginate through results', () => {
      cy.visit('/tournaments');
      
      // Check if pagination exists
      cy.get('[data-cy="pagination"], .pagination').then(($pagination) => {
        if ($pagination.length > 0) {
          // Go to next page
          cy.get('[data-cy="next-page"], button:contains("Next")').click();
          
          // Verify URL or page indicator changed
          cy.url().should('include', 'page=2')
            .or(cy.contains('Page 2').should('be.visible'));
          
          // Go back to first page
          cy.get('[data-cy="prev-page"], button:contains("Previous")').click();
        }
      });
    });
  });

  describe('Error Handling Journey', () => {
    beforeEach(() => {
      // Make sure we're logged in
      cy.window().then((win) => {
        if (!win.sessionStorage.getItem('authenticated')) {
          cy.login();
        }
      });
    });

    it('should handle network errors gracefully', () => {
      // Intercept API calls and force errors
      cy.intercept('GET', '**/api/v1/tournaments*', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('getTournamentsError');
      
      cy.visit('/tournaments');
      cy.wait('@getTournamentsError');
      
      // Should show error message
      cy.contains('Failed to load tournaments').should('be.visible')
        .or(cy.contains('Error').should('be.visible'));
    });

    it('should validate form inputs', () => {
      cy.visit('/tournaments/create');
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click();
      
      // Should show validation errors
      cy.contains('Name is required').should('be.visible');
      cy.contains('Location is required').should('be.visible');
      cy.contains('Start date is required').should('be.visible');
      cy.contains('End date is required').should('be.visible');
      
      // Test date range validation
      cy.get('#name').type('Test');
      cy.get('#location').type('Test');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      cy.get('#startDate').type(yesterday.toISOString().split('T')[0]);
      cy.get('#endDate').type(twoDaysAgo.toISOString().split('T')[0]);
      
      cy.get('button[type="submit"]').click();
      
      // Should show date validation error
      cy.contains('End date must be after start date').should('be.visible');
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      // Make sure we're logged in
      cy.window().then((win) => {
        if (!win.sessionStorage.getItem('authenticated')) {
          cy.login();
        }
      });
    });

    it('should delete created test data', () => {
      // Delete tournament
      cy.visit('/tournaments');
      cy.wait(1000);
      cy.contains(tournamentData.name).click();
      
      cy.get('[data-cy="delete-tournament-btn"], button:contains("Delete")').click();
      cy.on('window:confirm', () => true);
      
      // Verify tournament is deleted
      cy.url().should('include', '/tournaments');
      cy.contains(tournamentData.name).should('not.exist');
      
      // Delete player (if delete functionality exists)
      cy.visit('/players');
      cy.contains(playerData.lastName).then(($player) => {
        if ($player.length > 0) {
          cy.wrap($player).click();
          cy.get('[data-cy="delete-player-btn"], button:contains("Delete")').then(($btn) => {
            if ($btn.length > 0) {
              cy.wrap($btn).click();
              cy.on('window:confirm', () => true);
            }
          });
        }
      });
    });
  });
});