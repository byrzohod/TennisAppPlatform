/// <reference types="cypress" />

describe('Tournament Management', () => {
  beforeEach(() => {
    // Login as admin/organizer
    cy.loginByAPI('admin@tennisapp.com', 'Admin123!');
    cy.visit('/tournaments');
  });

  describe('Tournament List', () => {
    it('should display list of tournaments', () => {
      cy.get('[data-testid="tournament-list"]').should('be.visible');
      cy.get('[data-testid="tournament-card"]').should('have.length.at.least', 1);
    });

    it('should display tournament details in cards', () => {
      cy.get('[data-testid="tournament-card"]').first().within(() => {
        cy.get('.tournament-name').should('be.visible');
        cy.get('.tournament-dates').should('be.visible');
        cy.get('.tournament-location').should('be.visible');
        cy.get('.tournament-status').should('be.visible');
        cy.get('.tournament-draw-size').should('be.visible');
      });
    });

    it('should filter tournaments by status', () => {
      cy.get('[data-testid="status-filter"]').select('Upcoming');
      cy.get('[data-testid="tournament-card"]').each(($card) => {
        cy.wrap($card).find('.tournament-status').should('contain', 'Upcoming');
      });

      cy.get('[data-testid="status-filter"]').select('In Progress');
      cy.get('[data-testid="tournament-card"]').each(($card) => {
        cy.wrap($card).find('.tournament-status').should('contain', 'In Progress');
      });
    });

    it('should search tournaments by name', () => {
      cy.get('[data-testid="search-input"]').type('Wimbledon');
      cy.get('[data-testid="tournament-card"]').should('have.length', 1);
      cy.get('.tournament-name').should('contain', 'Wimbledon');
    });

    it('should sort tournaments', () => {
      cy.get('[data-testid="sort-select"]').select('Date (Newest First)');
      let previousDate = new Date().getTime() + 999999999;
      
      cy.get('.tournament-dates').each(($date) => {
        const dateText = $date.text();
        const currentDate = new Date(dateText.split(' - ')[0]).getTime();
        expect(currentDate).to.be.at.most(previousDate);
        previousDate = currentDate;
      });
    });

    it('should paginate tournament list', () => {
      // Assuming more than 10 tournaments
      cy.get('[data-testid="pagination"]').should('be.visible');
      cy.get('[data-testid="page-2"]').click();
      cy.url().should('include', 'page=2');
    });
  });

  describe('Create Tournament', () => {
    beforeEach(() => {
      cy.get('[data-testid="create-tournament-btn"]').click();
    });

    it('should display create tournament form', () => {
      cy.url().should('include', '/tournaments/create');
      cy.get('h1').should('contain', 'Create Tournament');
      
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[name="location"]').should('be.visible');
      cy.get('input[name="startDate"]').should('be.visible');
      cy.get('input[name="endDate"]').should('be.visible');
      cy.get('select[name="type"]').should('be.visible');
      cy.get('select[name="surface"]').should('be.visible');
      cy.get('select[name="drawSize"]').should('be.visible');
    });

    it('should create tournament with valid data', () => {
      const tournamentData = {
        name: `Test Tournament ${Date.now()}`,
        location: 'New York, USA',
        startDate: '2024-06-01',
        endDate: '2024-06-14',
        type: 'ATP500',
        surface: 'HardCourt',
        drawSize: '32',
        prizeMoneyUSD: '500000',
        entryFee: '100'
      };

      cy.get('input[name="name"]').type(tournamentData.name);
      cy.get('input[name="location"]').type(tournamentData.location);
      cy.get('input[name="startDate"]').type(tournamentData.startDate);
      cy.get('input[name="endDate"]').type(tournamentData.endDate);
      cy.get('select[name="type"]').select(tournamentData.type);
      cy.get('select[name="surface"]').select(tournamentData.surface);
      cy.get('select[name="drawSize"]').select(tournamentData.drawSize);
      cy.get('input[name="prizeMoneyUSD"]').type(tournamentData.prizeMoneyUSD);
      cy.get('input[name="entryFee"]').type(tournamentData.entryFee);
      
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-success').should('contain', 'Tournament created successfully');
      cy.url().should('match', /\/tournaments\/\d+/);
    });

    it('should validate required fields', () => {
      cy.get('button[type="submit"]').click();
      
      cy.get('input[name="name"]').should('have.class', 'ng-invalid');
      cy.get('input[name="location"]').should('have.class', 'ng-invalid');
      cy.get('input[name="startDate"]').should('have.class', 'ng-invalid');
      cy.get('input[name="endDate"]').should('have.class', 'ng-invalid');
      cy.get('.error-message').should('be.visible');
    });

    it('should validate date range', () => {
      cy.get('input[name="startDate"]').type('2024-06-14');
      cy.get('input[name="endDate"]').type('2024-06-01');
      cy.get('button[type="submit"]').click();
      
      cy.get('.error-message').should('contain', 'End date must be after start date');
    });

    it('should validate draw size options', () => {
      cy.get('select[name="drawSize"]').within(() => {
        cy.get('option').should('have.length', 5); // 16, 32, 64, 128, 256
        cy.get('option[value="16"]').should('exist');
        cy.get('option[value="32"]').should('exist');
        cy.get('option[value="64"]').should('exist');
        cy.get('option[value="128"]').should('exist');
      });
    });
  });

  describe('Edit Tournament', () => {
    it('should edit tournament details', () => {
      cy.get('[data-testid="tournament-card"]').first().click();
      cy.get('[data-testid="edit-tournament-btn"]').click();
      
      cy.url().should('match', /\/tournaments\/\d+\/edit/);
      
      cy.get('input[name="location"]').clear().type('Updated Location');
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-success').should('contain', 'Tournament updated successfully');
      cy.get('.tournament-location').should('contain', 'Updated Location');
    });

    it('should not allow editing in-progress tournaments', () => {
      // Find an in-progress tournament
      cy.get('[data-testid="status-filter"]').select('In Progress');
      cy.get('[data-testid="tournament-card"]').first().click();
      
      cy.get('[data-testid="edit-tournament-btn"]').should('be.disabled');
      cy.get('.info-message').should('contain', 'Cannot edit tournament in progress');
    });
  });

  describe('Delete Tournament', () => {
    it('should delete tournament with confirmation', () => {
      cy.get('[data-testid="tournament-card"]').first().click();
      const tournamentName = cy.get('.tournament-name').invoke('text');
      
      cy.get('[data-testid="delete-tournament-btn"]').click();
      
      // Confirmation modal
      cy.get('.modal').should('be.visible');
      cy.get('.modal-body').should('contain', 'Are you sure');
      cy.get('[data-testid="confirm-delete"]').click();
      
      cy.get('.alert-success').should('contain', 'Tournament deleted successfully');
      cy.url().should('include', '/tournaments');
      
      // Verify tournament is removed from list
      cy.get('.tournament-name').should('not.contain', tournamentName);
    });

    it('should cancel delete operation', () => {
      cy.get('[data-testid="tournament-card"]').first().click();
      cy.get('[data-testid="delete-tournament-btn"]').click();
      
      cy.get('[data-testid="cancel-delete"]').click();
      cy.get('.modal').should('not.exist');
      cy.url().should('match', /\/tournaments\/\d+/);
    });
  });

  describe('Tournament Details', () => {
    beforeEach(() => {
      cy.get('[data-testid="tournament-card"]').first().click();
    });

    it('should display tournament information', () => {
      cy.get('.tournament-header').should('be.visible');
      cy.get('.tournament-info').within(() => {
        cy.get('.info-item').should('have.length.at.least', 6);
        cy.contains('Location').should('be.visible');
        cy.contains('Dates').should('be.visible');
        cy.contains('Surface').should('be.visible');
        cy.contains('Draw Size').should('be.visible');
        cy.contains('Status').should('be.visible');
      });
    });

    it('should display tournament tabs', () => {
      cy.get('.tournament-tabs').within(() => {
        cy.get('[data-testid="tab-overview"]').should('be.visible');
        cy.get('[data-testid="tab-players"]').should('be.visible');
        cy.get('[data-testid="tab-bracket"]').should('be.visible');
        cy.get('[data-testid="tab-matches"]').should('be.visible');
        cy.get('[data-testid="tab-results"]').should('be.visible');
      });
    });

    it('should navigate between tabs', () => {
      cy.get('[data-testid="tab-players"]').click();
      cy.get('.player-list').should('be.visible');
      
      cy.get('[data-testid="tab-bracket"]').click();
      cy.get('.bracket-container').should('be.visible');
      
      cy.get('[data-testid="tab-matches"]').click();
      cy.get('.matches-list').should('be.visible');
    });
  });

  describe('Player Registration', () => {
    beforeEach(() => {
      cy.get('[data-testid="tournament-card"]').first().click();
      cy.get('[data-testid="tab-players"]').click();
    });

    it('should display registered players list', () => {
      cy.get('.player-list').should('be.visible');
      cy.get('[data-testid="player-row"]').should('have.length.at.least', 0);
    });

    it('should register a player', () => {
      cy.get('[data-testid="register-player-btn"]').click();
      
      cy.get('.modal').should('be.visible');
      cy.get('[data-testid="player-search"]').type('Novak');
      cy.get('[data-testid="player-option"]').first().click();
      cy.get('[data-testid="confirm-registration"]').click();
      
      cy.get('.alert-success').should('contain', 'Player registered successfully');
      cy.get('.player-list').should('contain', 'Novak');
    });

    it('should set player seed', () => {
      cy.get('[data-testid="player-row"]').first().within(() => {
        cy.get('[data-testid="seed-input"]').clear().type('1');
        cy.get('[data-testid="save-seed"]').click();
      });
      
      cy.get('.alert-success').should('contain', 'Seed updated');
      cy.get('[data-testid="player-row"]').first().should('contain', 'Seed: 1');
    });

    it('should withdraw a player', () => {
      cy.get('[data-testid="player-row"]').first().within(() => {
        cy.get('[data-testid="withdraw-player"]').click();
      });
      
      cy.get('.modal').should('contain', 'Confirm withdrawal');
      cy.get('[data-testid="confirm-withdrawal"]').click();
      
      cy.get('.alert-success').should('contain', 'Player withdrawn');
      cy.get('[data-testid="player-row"]').first().should('contain', 'Withdrawn');
    });
  });

  describe('Permissions', () => {
    it('should not show admin actions for regular users', () => {
      // Logout and login as regular user
      cy.get('[data-testid="logout-button"]').click();
      cy.loginByAPI('user@example.com', 'User123!');
      cy.visit('/tournaments');
      
      cy.get('[data-testid="create-tournament-btn"]').should('not.exist');
      cy.get('[data-testid="tournament-card"]').first().click();
      cy.get('[data-testid="edit-tournament-btn"]').should('not.exist');
      cy.get('[data-testid="delete-tournament-btn"]').should('not.exist');
    });
  });

  describe('Performance', () => {
    it('should load tournament list quickly', () => {
      cy.window().then((win) => {
        const start = win.performance.now();
        
        cy.get('[data-testid="tournament-list"]').should('be.visible');
        
        cy.window().then((win) => {
          const end = win.performance.now();
          expect(end - start).to.be.lessThan(2000);
        });
      });
    });

    it('should handle large tournament lists efficiently', () => {
      // Simulate large dataset
      cy.intercept('GET', '**/tournaments', {
        fixture: 'large-tournament-list.json' // 100+ tournaments
      }).as('largeTournamentList');
      
      cy.visit('/tournaments');
      cy.wait('@largeTournamentList');
      
      // Should implement virtual scrolling or pagination
      cy.get('[data-testid="tournament-card"]').should('have.length.at.most', 20);
      cy.get('[data-testid="pagination"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'search-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'status-filter');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'create-tournament-btn');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="tournament-list"]').should('have.attr', 'role', 'list');
      cy.get('[data-testid="tournament-card"]').should('have.attr', 'role', 'listitem');
      cy.get('[data-testid="create-tournament-btn"]').should('have.attr', 'aria-label');
    });

    it('should pass accessibility audit', () => {
      cy.injectAxe();
      cy.checkA11y();
    });
  });
});