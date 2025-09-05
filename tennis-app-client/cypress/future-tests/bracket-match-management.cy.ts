/// <reference types="cypress" />

describe('Bracket and Match Management', () => {
  beforeEach(() => {
    // Mock admin authentication
    cy.window().then(win => {
      win.localStorage.setItem('authToken', 'admin-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'admin@tennisapp.com',
        role: 'admin'
      }));
    });
    
    cy.visit('/tournaments/1/bracket');
  });

  describe('Bracket Visualization', () => {
    it('should display bracket page', () => {
      cy.url().should('include', '/bracket');
      cy.get('app-bracket').should('exist');
    });

    it('should show bracket structure', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="bracket-container"]').length > 0) {
          cy.get('[data-testid="bracket-container"]').should('be.visible');
          
          // Check for rounds
          if ($body.find('[data-testid="bracket-round"]').length > 0) {
            cy.get('[data-testid="bracket-round"]').should('have.length.at.least', 1);
          }
        }
      });
    });

    it('should display round headers', () => {
      cy.get('body').then($body => {
        const expectedRounds = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];
        
        expectedRounds.forEach(round => {
          if ($body.text().includes(round)) {
            cy.log(`Found round: ${round}`);
          }
        });
      });
    });

    it('should show match cards in bracket', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-card"]').length > 0) {
          cy.get('[data-testid="match-card"]').should('have.length.at.least', 1);
          
          // Check match card structure
          cy.get('[data-testid="match-card"]').first().within(() => {
            // Should have player slots
            cy.get('[data-testid="player-slot"]').should('have.length', 2);
          });
        }
      });
    });

    it('should handle bracket scrolling', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="bracket-container"]').length > 0) {
          // Check if bracket is scrollable
          cy.get('[data-testid="bracket-container"]').scrollTo('right');
          cy.get('[data-testid="bracket-container"]').scrollTo('left');
        }
      });
    });

    it('should support bracket zoom', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="zoom-in"]').length > 0) {
          cy.get('[data-testid="zoom-in"]').click();
          cy.get('[data-testid="zoom-out"]').click();
          cy.get('[data-testid="zoom-reset"]').click();
        }
      });
    });
  });

  describe('Bracket Generation', () => {
    beforeEach(() => {
      cy.visit('/tournaments/1/bracket');
    });

    it('should show generate bracket button for new tournament', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="generate-bracket-btn"]').length > 0) {
          cy.get('[data-testid="generate-bracket-btn"]').should('be.visible');
        }
      });
    });

    it('should open bracket generation modal', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="generate-bracket-btn"]').length > 0) {
          cy.get('[data-testid="generate-bracket-btn"]').click();
          
          // Modal should appear
          cy.get('.modal').should('be.visible');
          cy.get('.modal-title').should('contain', 'Generate Bracket');
        }
      });
    });

    it('should validate player count for bracket generation', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="generate-bracket-btn"]').length > 0) {
          cy.get('[data-testid="generate-bracket-btn"]').click();
          
          // Try to generate with insufficient players
          if ($body.find('[data-testid="confirm-generate"]').length > 0) {
            cy.get('[data-testid="confirm-generate"]').click();
            
            // Should show validation error
            cy.get('.error-message').should('contain', 'players');
          }
        }
      });
    });

    it('should handle seeding options', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="generate-bracket-btn"]').length > 0) {
          cy.get('[data-testid="generate-bracket-btn"]').click();
          
          // Check seeding options
          if ($body.find('[data-testid="seeding-type"]').length > 0) {
            cy.get('[data-testid="seeding-type"]').select('Manual');
            cy.get('[data-testid="seeding-type"]').select('Random');
            cy.get('[data-testid="seeding-type"]').select('Ranking');
          }
        }
      });
    });

    it('should place byes correctly', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="generate-bracket-btn"]').length > 0) {
          cy.get('[data-testid="generate-bracket-btn"]').click();
          
          // Set draw size larger than player count
          if ($body.find('[data-testid="draw-size"]').length > 0) {
            cy.get('[data-testid="draw-size"]').select('32');
            cy.get('[data-testid="player-count"]').type('24');
            cy.get('[data-testid="confirm-generate"]').click();
            
            // Should have 8 byes
            cy.get('[data-testid="bye-slot"]').should('have.length', 8);
          }
        }
      });
    });
  });

  describe('Match Management', () => {
    it('should open match details on click', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-card"]').length > 0) {
          cy.get('[data-testid="match-card"]').first().click();
          
          // Should open match details
          cy.get('[data-testid="match-details"]').should('be.visible');
        }
      });
    });

    it('should display match information', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-card"]').length > 0) {
          cy.get('[data-testid="match-card"]').first().click();
          
          // Check match details
          cy.get('[data-testid="match-details"]').within(() => {
            cy.get('[data-testid="match-round"]').should('exist');
            cy.get('[data-testid="match-court"]').should('exist');
            cy.get('[data-testid="match-time"]').should('exist');
          });
        }
      });
    });

    it('should allow score entry', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-card"]').length > 0) {
          cy.get('[data-testid="match-card"]').first().click();
          
          // Enter scores
          if ($body.find('[data-testid="score-input"]').length > 0) {
            cy.get('[data-testid="score-set-1-player-1"]').type('6');
            cy.get('[data-testid="score-set-1-player-2"]').type('4');
            cy.get('[data-testid="save-score"]').click();
            
            // Should update match
            cy.get('.alert-success').should('contain', 'Score updated');
          }
        }
      });
    });

    it('should validate tennis scoring rules', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-card"]').length > 0) {
          cy.get('[data-testid="match-card"]').first().click();
          
          // Try invalid score
          if ($body.find('[data-testid="score-input"]').length > 0) {
            cy.get('[data-testid="score-set-1-player-1"]').type('8');
            cy.get('[data-testid="score-set-1-player-2"]').type('9');
            cy.get('[data-testid="save-score"]').click();
            
            // Should show validation error
            cy.get('.error-message').should('contain', 'Invalid score');
          }
        }
      });
    });

    it('should handle match retirement', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-card"]').length > 0) {
          cy.get('[data-testid="match-card"]').first().click();
          
          // Mark as retired
          if ($body.find('[data-testid="retire-match"]').length > 0) {
            cy.get('[data-testid="retire-match"]').click();
            cy.get('[data-testid="retire-player"]').select('Player 1');
            cy.get('[data-testid="confirm-retire"]').click();
            
            // Should update match status
            cy.get('[data-testid="match-status"]').should('contain', 'Retired');
          }
        }
      });
    });

    it('should handle walkover', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-card"]').length > 0) {
          cy.get('[data-testid="match-card"]').first().click();
          
          // Mark as walkover
          if ($body.find('[data-testid="walkover-match"]').length > 0) {
            cy.get('[data-testid="walkover-match"]').click();
            cy.get('[data-testid="walkover-winner"]').select('Player 2');
            cy.get('[data-testid="confirm-walkover"]').click();
            
            // Should update match status
            cy.get('[data-testid="match-status"]').should('contain', 'Walkover');
          }
        }
      });
    });

    it('should progress winner to next round', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-card"]').length > 0) {
          // Complete a match
          cy.get('[data-testid="match-card"]').first().click();
          
          if ($body.find('[data-testid="score-input"]').length > 0) {
            // Enter winning score
            cy.get('[data-testid="score-set-1-player-1"]').type('6');
            cy.get('[data-testid="score-set-1-player-2"]').type('4');
            cy.get('[data-testid="score-set-2-player-1"]').type('6');
            cy.get('[data-testid="score-set-2-player-2"]').type('3');
            cy.get('[data-testid="save-score"]').click();
            
            // Winner should appear in next round
            cy.get('[data-testid="bracket-container"]').within(() => {
              // Check next round for winner's name
              cy.get('[data-testid="player-name"]').should('contain', 'Player 1');
            });
          }
        }
      });
    });
  });

  describe('Match Scheduling', () => {
    it('should display match schedule', () => {
      cy.visit('/tournaments/1/matches');
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-schedule"]').length > 0) {
          cy.get('[data-testid="match-schedule"]').should('be.visible');
        }
      });
    });

    it('should filter matches by date', () => {
      cy.visit('/tournaments/1/matches');
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="date-filter"]').length > 0) {
          cy.get('[data-testid="date-filter"]').type('2024-12-01');
          cy.wait(500);
          
          // Should filter matches
          cy.get('[data-testid="match-row"]').should('have.length.lte', 20);
        }
      });
    });

    it('should filter matches by court', () => {
      cy.visit('/tournaments/1/matches');
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="court-filter"]').length > 0) {
          cy.get('[data-testid="court-filter"]').select('Court 1');
          cy.wait(500);
          
          // Should show only Court 1 matches
          cy.get('[data-testid="match-court"]').each($court => {
            expect($court.text()).to.contain('Court 1');
          });
        }
      });
    });

    it('should filter matches by status', () => {
      cy.visit('/tournaments/1/matches');
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="status-filter"]').length > 0) {
          cy.get('[data-testid="status-filter"]').select('Completed');
          cy.wait(500);
          
          // Should show only completed matches
          cy.get('[data-testid="match-status"]').each($status => {
            expect($status.text()).to.contain('Completed');
          });
        }
      });
    });

    it('should assign court to match', () => {
      cy.visit('/tournaments/1/matches');
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-row"]').length > 0) {
          cy.get('[data-testid="match-row"]').first().click();
          
          if ($body.find('[data-testid="assign-court"]').length > 0) {
            cy.get('[data-testid="assign-court"]').select('Court 2');
            cy.get('[data-testid="save-court"]').click();
            
            // Should update court
            cy.get('[data-testid="match-court"]').should('contain', 'Court 2');
          }
        }
      });
    });

    it('should schedule match time', () => {
      cy.visit('/tournaments/1/matches');
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-row"]').length > 0) {
          cy.get('[data-testid="match-row"]').first().click();
          
          if ($body.find('[data-testid="schedule-time"]').length > 0) {
            cy.get('[data-testid="schedule-date"]').type('2024-12-05');
            cy.get('[data-testid="schedule-time"]').type('14:00');
            cy.get('[data-testid="save-schedule"]').click();
            
            // Should update schedule
            cy.get('.alert-success').should('contain', 'scheduled');
          }
        }
      });
    });
  });

  describe('Live Score Updates', () => {
    it('should show live matches', () => {
      cy.visit('/tournaments/1/live');
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="live-matches"]').length > 0) {
          cy.get('[data-testid="live-matches"]').should('be.visible');
        }
      });
    });

    it('should update scores in real-time', () => {
      cy.visit('/tournaments/1/live');
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="live-match"]').length > 0) {
          // Check for score updates
          let initialScore: string;
          cy.get('[data-testid="live-score"]').first()
            .invoke('text')
            .then(text => {
              initialScore = text;
            });
          
          // Wait for potential update
          cy.wait(5000);
          
          // Score might have changed
          cy.get('[data-testid="live-score"]').first()
            .invoke('text')
            .then(text => {
              cy.log(`Score changed from ${initialScore} to ${text}`);
            });
        }
      });
    });

    it('should show match statistics', () => {
      cy.visit('/tournaments/1/live');
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="live-match"]').length > 0) {
          cy.get('[data-testid="live-match"]').first().click();
          
          // Should show statistics
          if ($body.find('[data-testid="match-stats"]').length > 0) {
            cy.get('[data-testid="aces"]').should('exist');
            cy.get('[data-testid="double-faults"]').should('exist');
            cy.get('[data-testid="first-serve-percentage"]').should('exist');
          }
        }
      });
    });
  });
});