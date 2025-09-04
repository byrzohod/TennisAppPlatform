/// <reference types="cypress" />

describe('Bracket Generation', () => {
  beforeEach(() => {
    // Login as tournament admin
    cy.loginByAPI('admin@tennisapp.com', 'Admin123!');
    
    // Create a test tournament
    cy.request('POST', `${Cypress.env('apiUrl')}/tournaments`, {
      name: `Test Tournament ${Date.now()}`,
      location: 'Test Location',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      type: 'ATP250',
      surface: 'HardCourt',
      drawSize: 32,
      status: 'Upcoming'
    }).then((response) => {
      cy.wrap(response.body.id).as('tournamentId');
      
      // Register players for the tournament
      const playerPromises = [];
      for (let i = 1; i <= 24; i++) {
        playerPromises.push(
          cy.request('POST', `${Cypress.env('apiUrl')}/tournament-registration`, {
            tournamentId: response.body.id,
            playerId: i,
            seed: i <= 8 ? i : null
          })
        );
      }
      
      cy.wrap(Promise.all(playerPromises)).then(() => {
        cy.visit(`/tournaments/${response.body.id}/bracket`);
      });
    });
  });

  describe('Bracket Generation UI', () => {
    it('should display bracket generation options', () => {
      cy.get('[data-testid="generate-bracket-btn"]').should('be.visible');
      cy.get('[data-testid="bracket-status"]').should('contain', 'No bracket generated');
    });

    it('should show generation modal with options', () => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      
      cy.get('.modal').should('be.visible');
      cy.get('.modal-title').should('contain', 'Generate Bracket');
      
      cy.get('[data-testid="bracket-type"]').should('be.visible');
      cy.get('[data-testid="draw-size"]').should('be.visible');
      cy.get('[data-testid="auto-seed-toggle"]').should('be.visible');
      cy.get('[data-testid="manual-seed-option"]').should('be.visible');
    });

    it('should validate draw size against registered players', () => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      
      // Try to generate a 64-player bracket with only 24 players registered
      cy.get('[data-testid="draw-size"]').select('64');
      cy.get('[data-testid="confirm-generate"]').click();
      
      cy.get('.error-message').should('contain', 'Not enough players');
    });
  });

  describe('Automatic Bracket Generation', () => {
    it('should generate bracket with automatic seeding', () => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      
      cy.get('[data-testid="bracket-type"]').select('Main');
      cy.get('[data-testid="draw-size"]').select('32');
      cy.get('[data-testid="auto-seed-toggle"]').check();
      cy.get('[data-testid="confirm-generate"]').click();
      
      cy.get('.alert-success').should('contain', 'Bracket generated successfully');
      cy.get('[data-testid="bracket-container"]').should('be.visible');
    });

    it('should display correct number of rounds', () => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="draw-size"]').select('32');
      cy.get('[data-testid="confirm-generate"]').click();
      
      // 32 players = 5 rounds (R32, R16, QF, SF, F)
      cy.get('[data-testid="round-header"]').should('have.length', 5);
      cy.get('[data-testid="round-header"]').eq(0).should('contain', 'Round of 32');
      cy.get('[data-testid="round-header"]').eq(1).should('contain', 'Round of 16');
      cy.get('[data-testid="round-header"]').eq(2).should('contain', 'Quarterfinals');
      cy.get('[data-testid="round-header"]').eq(3).should('contain', 'Semifinals');
      cy.get('[data-testid="round-header"]').eq(4).should('contain', 'Final');
    });

    it('should properly place seeded players', () => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="auto-seed-toggle"]').check();
      cy.get('[data-testid="confirm-generate"]').click();
      
      // Check seed 1 and 2 are in opposite halves
      cy.get('[data-testid="bracket-node-1"]').should('contain', '[1]');
      cy.get('[data-testid="bracket-node-32"]').should('contain', '[2]');
      
      // Check seeds 3 and 4 are in opposite quarters
      cy.get('[data-testid="bracket-node"]').contains('[3]').should('exist');
      cy.get('[data-testid="bracket-node"]').contains('[4]').should('exist');
    });

    it('should distribute byes correctly for incomplete draws', () => {
      // With 24 players in a 32-draw, there should be 8 byes
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="draw-size"]').select('32');
      cy.get('[data-testid="confirm-generate"]').click();
      
      cy.get('[data-testid="bracket-node"]').contains('BYE').should('have.length', 8);
      
      // Byes should advance the opponent automatically
      cy.get('[data-testid="bracket-node"]').each(($node) => {
        if ($node.text().includes('BYE')) {
          const matchId = $node.attr('data-match-id');
          cy.get(`[data-testid="next-round-${matchId}"]`).should('not.contain', 'BYE');
        }
      });
    });
  });

  describe('Manual Seeding', () => {
    it('should allow manual seed assignment', () => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="manual-seed-option"]').click();
      
      cy.get('[data-testid="seed-assignment-modal"]').should('be.visible');
      cy.get('[data-testid="player-list"]').should('be.visible');
      
      // Manually set seeds
      cy.get('[data-testid="player-row"]').eq(0).within(() => {
        cy.get('[data-testid="seed-input"]').clear().type('1');
      });
      
      cy.get('[data-testid="player-row"]').eq(1).within(() => {
        cy.get('[data-testid="seed-input"]').clear().type('2');
      });
      
      cy.get('[data-testid="apply-seeds"]').click();
      cy.get('[data-testid="confirm-generate"]').click();
      
      cy.get('.alert-success').should('contain', 'Bracket generated');
    });

    it('should validate unique seed numbers', () => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="manual-seed-option"]').click();
      
      // Try to assign the same seed to two players
      cy.get('[data-testid="player-row"]').eq(0).within(() => {
        cy.get('[data-testid="seed-input"]').clear().type('1');
      });
      
      cy.get('[data-testid="player-row"]').eq(1).within(() => {
        cy.get('[data-testid="seed-input"]').clear().type('1');
      });
      
      cy.get('[data-testid="apply-seeds"]').click();
      cy.get('.error-message').should('contain', 'Duplicate seed numbers');
    });
  });

  describe('Bracket Visualization', () => {
    beforeEach(() => {
      // Generate a bracket first
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="confirm-generate"]').click();
    });

    it('should display bracket in tree format', () => {
      cy.get('[data-testid="bracket-container"]').should('be.visible');
      cy.get('[data-testid="bracket-tree"]').should('be.visible');
      
      // Check structure
      cy.get('[data-testid="bracket-round"]').should('have.length', 5); // For 32-draw
      cy.get('[data-testid="bracket-match"]').should('have.length', 31); // Total matches in 32-draw
    });

    it('should show match details on hover', () => {
      cy.get('[data-testid="bracket-match"]').first().trigger('mouseenter');
      
      cy.get('[data-testid="match-tooltip"]').should('be.visible');
      cy.get('[data-testid="match-tooltip"]').within(() => {
        cy.get('.match-number').should('be.visible');
        cy.get('.player-names').should('be.visible');
        cy.get('.match-time').should('be.visible');
        cy.get('.court-assignment').should('be.visible');
      });
    });

    it('should allow zooming and panning', () => {
      cy.get('[data-testid="zoom-in"]').click();
      cy.get('[data-testid="bracket-container"]').should('have.css', 'transform').and('include', 'scale(1.2)');
      
      cy.get('[data-testid="zoom-out"]').click();
      cy.get('[data-testid="bracket-container"]').should('have.css', 'transform').and('include', 'scale(1)');
      
      cy.get('[data-testid="zoom-reset"]').click();
      cy.get('[data-testid="bracket-container"]').should('have.css', 'transform', 'none');
    });

    it('should highlight match paths', () => {
      cy.get('[data-testid="bracket-match"]').first().click();
      
      // Should highlight the path to the final
      cy.get('[data-testid="bracket-match"]').first().should('have.class', 'highlighted');
      cy.get('[data-testid="match-connector"]').should('have.class', 'highlighted-path');
    });
  });

  describe('Bracket Editing', () => {
    beforeEach(() => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="confirm-generate"]').click();
    });

    it('should allow swapping players', () => {
      cy.get('[data-testid="edit-bracket-btn"]').click();
      
      // Drag and drop player from one position to another
      cy.get('[data-testid="player-slot-1"]').drag('[data-testid="player-slot-2"]');
      
      cy.get('[data-testid="confirm-swap"]').should('be.visible');
      cy.get('[data-testid="confirm-swap"]').click();
      
      cy.get('.alert-success').should('contain', 'Players swapped');
    });

    it('should validate bracket integrity when editing', () => {
      cy.get('[data-testid="edit-bracket-btn"]').click();
      
      // Try to create an invalid bracket structure
      cy.get('[data-testid="remove-player-1"]').click();
      cy.get('[data-testid="save-bracket"]').click();
      
      cy.get('.error-message').should('contain', 'Cannot save incomplete bracket');
    });

    it('should not allow editing after matches start', () => {
      // Start a match
      cy.get('[data-testid="bracket-match"]').first().click();
      cy.get('[data-testid="start-match"]').click();
      
      cy.get('[data-testid="edit-bracket-btn"]').should('be.disabled');
      cy.get('.info-message').should('contain', 'Cannot edit bracket after matches have started');
    });
  });

  describe('Bracket Actions', () => {
    beforeEach(() => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="confirm-generate"]').click();
    });

    it('should regenerate bracket with confirmation', () => {
      cy.get('[data-testid="regenerate-bracket-btn"]').click();
      
      cy.get('.modal').should('contain', 'This will delete the current bracket');
      cy.get('[data-testid="confirm-regenerate"]').click();
      
      cy.get('[data-testid="generate-bracket-btn"]').should('be.visible');
      cy.get('[data-testid="bracket-container"]').should('not.exist');
    });

    it('should export bracket to PDF', () => {
      cy.get('[data-testid="export-bracket"]').click();
      cy.get('[data-testid="export-pdf"]').click();
      
      // Check that download was triggered
      cy.readFile('cypress/downloads/bracket.pdf').should('exist');
    });

    it('should print bracket', () => {
      cy.window().then(win => {
        cy.stub(win, 'print').as('print');
      });
      
      cy.get('[data-testid="print-bracket"]').click();
      cy.get('@print').should('be.called');
    });

    it('should share bracket link', () => {
      cy.get('[data-testid="share-bracket"]').click();
      
      cy.get('[data-testid="share-modal"]').should('be.visible');
      cy.get('[data-testid="share-link"]').should('have.value').and('include', '/public/bracket/');
      
      cy.get('[data-testid="copy-link"]').click();
      cy.get('.alert-success').should('contain', 'Link copied');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="confirm-generate"]').click();
    });

    it('should display bracket in mobile view', () => {
      cy.get('[data-testid="bracket-container"]').should('be.visible');
      
      // Should have horizontal scroll for bracket
      cy.get('[data-testid="bracket-scroll-container"]').should('have.css', 'overflow-x', 'auto');
    });

    it('should have touch gestures for navigation', () => {
      // Simulate swipe
      cy.get('[data-testid="bracket-container"]')
        .trigger('touchstart', { touches: [{ clientX: 300, clientY: 100 }] })
        .trigger('touchmove', { touches: [{ clientX: 100, clientY: 100 }] })
        .trigger('touchend');
      
      // Check that bracket scrolled
      cy.get('[data-testid="bracket-scroll-container"]').scrollTo('right');
    });

    it('should show simplified view on mobile', () => {
      cy.get('[data-testid="view-toggle"]').should('be.visible');
      cy.get('[data-testid="view-toggle"]').click();
      cy.get('[data-testid="list-view"]').click();
      
      cy.get('[data-testid="bracket-list"]').should('be.visible');
      cy.get('[data-testid="bracket-tree"]').should('not.be.visible');
    });
  });

  describe('Performance', () => {
    it('should generate large brackets efficiently', () => {
      // Register more players for a 128-draw test
      const playerPromises = [];
      for (let i = 25; i <= 100; i++) {
        playerPromises.push(
          cy.request('POST', `${Cypress.env('apiUrl')}/tournament-registration`, {
            tournamentId: '@tournamentId',
            playerId: i
          })
        );
      }
      
      cy.wrap(Promise.all(playerPromises)).then(() => {
        const start = Date.now();
        
        cy.get('[data-testid="generate-bracket-btn"]').click();
        cy.get('[data-testid="draw-size"]').select('128');
        cy.get('[data-testid="confirm-generate"]').click();
        
        cy.get('[data-testid="bracket-container"]').should('be.visible');
        
        const end = Date.now();
        expect(end - start).to.be.lessThan(5000); // Should generate in less than 5 seconds
      });
    });

    it('should render bracket without lag', () => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="confirm-generate"]').click();
      
      // Measure frame rate during interactions
      cy.window().then((win) => {
        let frameCount = 0;
        const countFrame = () => {
          frameCount++;
          if (frameCount < 60) {
            win.requestAnimationFrame(countFrame);
          }
        };
        
        const startTime = win.performance.now();
        win.requestAnimationFrame(countFrame);
        
        cy.wait(1000).then(() => {
          const fps = frameCount;
          expect(fps).to.be.at.least(30); // Should maintain at least 30 FPS
        });
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.get('[data-testid="generate-bracket-btn"]').click();
      cy.get('[data-testid="confirm-generate"]').click();
    });

    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid').and('include', 'bracket');
      
      // Navigate through matches with arrow keys
      cy.focused().type('{rightarrow}');
      cy.focused().should('have.attr', 'data-testid', 'bracket-match');
    });

    it('should have screen reader support', () => {
      cy.get('[data-testid="bracket-container"]').should('have.attr', 'role', 'tree');
      cy.get('[data-testid="bracket-round"]').should('have.attr', 'role', 'group');
      cy.get('[data-testid="bracket-match"]').should('have.attr', 'role', 'treeitem');
      
      // Check ARIA labels
      cy.get('[data-testid="bracket-match"]').each(($match) => {
        cy.wrap($match).should('have.attr', 'aria-label');
      });
    });

    it('should pass accessibility audit', () => {
      cy.injectAxe();
      cy.checkA11y('[data-testid="bracket-container"]');
    });
  });
});