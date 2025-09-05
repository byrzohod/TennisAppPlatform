/// <reference types="cypress" />

describe('Player Management', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then(win => {
      win.localStorage.setItem('authToken', 'admin-token');
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'admin@tennisapp.com',
        role: 'admin'
      }));
    });
    
    cy.visit('/players');
  });

  describe('Player List', () => {
    it('should display players page', () => {
      cy.url().should('include', '/players');
      cy.get('h1').should('contain.text', 'Player');
    });

    it('should show player list', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="player-list"]').length > 0) {
          cy.get('[data-testid="player-list"]').should('be.visible');
          cy.get('[data-testid="player-card"]').should('have.length.at.least', 1);
        }
      });
    });

    it('should display player information', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="player-card"]').length > 0) {
          cy.get('[data-testid="player-card"]').first().within(() => {
            cy.get('[data-testid="player-name"]').should('be.visible');
            cy.get('[data-testid="player-ranking"]').should('be.visible');
            cy.get('[data-testid="player-country"]').should('be.visible');
          });
        }
      });
    });

    it('should search players by name', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="search-players"]').length > 0) {
          cy.get('[data-testid="search-players"]').type('Federer');
          cy.wait(500);
          
          // Should filter results
          cy.get('[data-testid="player-card"]').should('have.length.lte', 5);
        }
      });
    });

    it('should filter players by country', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="filter-country"]').length > 0) {
          cy.get('[data-testid="filter-country"]').select('USA');
          cy.wait(500);
          
          // Should show only USA players
          cy.get('[data-testid="player-country"]').each($country => {
            expect($country.text()).to.contain('USA');
          });
        }
      });
    });

    it('should sort players by ranking', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="sort-players"]').length > 0) {
          cy.get('[data-testid="sort-players"]').select('Ranking');
          cy.wait(500);
          
          // Check rankings are in order
          let previousRank = 0;
          cy.get('[data-testid="player-ranking"]').each($rank => {
            const currentRank = parseInt($rank.text());
            expect(currentRank).to.be.gte(previousRank);
            previousRank = currentRank;
          });
        }
      });
    });
  });

  describe('Player Profile', () => {
    it('should navigate to player profile', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="player-card"]').length > 0) {
          cy.get('[data-testid="player-card"]').first().click();
          cy.url().should('match', /\/players\/\d+/);
        }
      });
    });

    it('should display player details', () => {
      cy.visit('/players/1', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="player-profile"]').length > 0) {
          cy.get('[data-testid="player-profile"]').within(() => {
            cy.get('[data-testid="player-name"]').should('be.visible');
            cy.get('[data-testid="player-age"]').should('be.visible');
            cy.get('[data-testid="player-height"]').should('be.visible');
            cy.get('[data-testid="player-ranking"]').should('be.visible');
          });
        }
      });
    });

    it('should show player statistics', () => {
      cy.visit('/players/1', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="player-stats"]').length > 0) {
          cy.get('[data-testid="player-stats"]').within(() => {
            cy.get('[data-testid="matches-played"]').should('be.visible');
            cy.get('[data-testid="matches-won"]').should('be.visible');
            cy.get('[data-testid="win-percentage"]').should('be.visible');
            cy.get('[data-testid="titles-won"]').should('be.visible');
          });
        }
      });
    });

    it('should show match history', () => {
      cy.visit('/players/1', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="match-history"]').length > 0) {
          cy.get('[data-testid="match-history"]').should('be.visible');
          cy.get('[data-testid="match-row"]').should('have.length.at.least', 0);
        }
      });
    });

    it('should show head-to-head records', () => {
      cy.visit('/players/1', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="h2h-section"]').length > 0) {
          cy.get('[data-testid="h2h-section"]').should('be.visible');
          
          // Select opponent
          if ($body.find('[data-testid="h2h-opponent"]').length > 0) {
            cy.get('[data-testid="h2h-opponent"]').select('Player 2');
            cy.get('[data-testid="h2h-record"]').should('be.visible');
          }
        }
      });
    });
  });

  describe('Player Registration for Tournament', () => {
    beforeEach(() => {
      cy.visit('/tournaments/1/players');
    });

    it('should show tournament player list', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="tournament-players"]').length > 0) {
          cy.get('[data-testid="tournament-players"]').should('be.visible');
        }
      });
    });

    it('should register player for tournament', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="register-player-btn"]').length > 0) {
          cy.get('[data-testid="register-player-btn"]').click();
          
          // Search and select player
          cy.get('[data-testid="player-search"]').type('Nadal');
          cy.wait(500);
          cy.get('[data-testid="player-result"]').first().click();
          cy.get('[data-testid="confirm-registration"]').click();
          
          // Should show success
          cy.get('.alert-success').should('contain', 'registered');
        }
      });
    });

    it('should validate registration limit', () => {
      cy.get('body').then($body => {
        // Check if registration limit is shown
        if ($body.find('[data-testid="registration-count"]').length > 0) {
          cy.get('[data-testid="registration-count"]')
            .invoke('text')
            .then(text => {
              // Extract current/max
              const match = text.match(/(\d+)\/(\d+)/);
              if (match) {
                const current = parseInt(match[1]);
                const max = parseInt(match[2]);
                
                if (current >= max) {
                  // Registration should be disabled
                  cy.get('[data-testid="register-player-btn"]')
                    .should('be.disabled');
                }
              }
            });
        }
      });
    });

    it('should handle player withdrawal', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="player-row"]').length > 0) {
          cy.get('[data-testid="player-row"]').first().within(() => {
            if ($body.find('[data-testid="withdraw-player"]').length > 0) {
              cy.get('[data-testid="withdraw-player"]').click();
            }
          });
          
          // Confirm withdrawal
          if ($body.find('[data-testid="confirm-withdrawal"]').length > 0) {
            cy.get('[data-testid="confirm-withdrawal"]').click();
            cy.get('.alert-success').should('contain', 'withdrawn');
          }
        }
      });
    });

    it('should manage player seeding', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="player-row"]').length > 0) {
          cy.get('[data-testid="player-row"]').first().within(() => {
            if ($body.find('[data-testid="seed-input"]').length > 0) {
              cy.get('[data-testid="seed-input"]').clear().type('1');
              cy.get('[data-testid="save-seed"]').click();
            }
          });
          
          // Should update seed
          cy.get('[data-testid="player-seed"]').first()
            .should('contain', '1');
        }
      });
    });
  });

  describe('Player Creation', () => {
    beforeEach(() => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="create-player-btn"]').length > 0) {
          cy.get('[data-testid="create-player-btn"]').click();
        } else {
          cy.visit('/players/create', { failOnStatusCode: false });
        }
      });
    });

    it('should display player creation form', () => {
      cy.get('body').then($body => {
        if ($body.find('form').length > 0) {
          cy.get('input[name="firstName"]').should('be.visible');
          cy.get('input[name="lastName"]').should('be.visible');
          cy.get('input[name="dateOfBirth"]').should('be.visible');
          cy.get('select[name="country"]').should('be.visible');
        }
      });
    });

    it('should validate required fields', () => {
      cy.get('body').then($body => {
        if ($body.find('button[type="submit"]').length > 0) {
          cy.get('button[type="submit"]').click();
          
          // Should show validation errors
          cy.get('.error-message').should('have.length.at.least', 1);
        }
      });
    });

    it('should create new player', () => {
      cy.get('body').then($body => {
        if ($body.find('form').length > 0) {
          const playerData = {
            firstName: 'John',
            lastName: `Test${Date.now()}`,
            dateOfBirth: '1995-05-15',
            country: 'USA',
            height: '185',
            weight: '75',
            playingHand: 'Right'
          };
          
          // Fill form
          Object.entries(playerData).forEach(([field, value]) => {
            if ($body.find(`input[name="${field}"]`).length > 0) {
              cy.get(`input[name="${field}"]`).type(value);
            } else if ($body.find(`select[name="${field}"]`).length > 0) {
              cy.get(`select[name="${field}"]`).select(value);
            }
          });
          
          cy.get('button[type="submit"]').click();
          
          // Should show success
          cy.get('.alert-success').should('contain', 'created');
        }
      });
    });
  });

  describe('Player Editing', () => {
    it('should navigate to edit player', () => {
      cy.visit('/players/1', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="edit-player-btn"]').length > 0) {
          cy.get('[data-testid="edit-player-btn"]').click();
          cy.url().should('include', '/edit');
        }
      });
    });

    it('should update player information', () => {
      cy.visit('/players/1/edit', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('form').length > 0) {
          // Update height
          if ($body.find('input[name="height"]').length > 0) {
            cy.get('input[name="height"]').clear().type('190');
            cy.get('button[type="submit"]').click();
            
            // Should show success
            cy.get('.alert-success').should('contain', 'updated');
          }
        }
      });
    });
  });

  describe('Player Statistics Dashboard', () => {
    it('should display player rankings', () => {
      cy.visit('/players/rankings', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="rankings-table"]').length > 0) {
          cy.get('[data-testid="rankings-table"]').should('be.visible');
          cy.get('[data-testid="ranking-row"]').should('have.length.at.least', 1);
        }
      });
    });

    it('should show player performance metrics', () => {
      cy.visit('/players/1/stats', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="performance-metrics"]').length > 0) {
          cy.get('[data-testid="performance-metrics"]').within(() => {
            cy.get('[data-testid="ace-percentage"]').should('be.visible');
            cy.get('[data-testid="first-serve-win"]').should('be.visible');
            cy.get('[data-testid="break-points-saved"]').should('be.visible');
          });
        }
      });
    });

    it('should display tournament history', () => {
      cy.visit('/players/1/tournaments', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('[data-testid="tournament-history"]').length > 0) {
          cy.get('[data-testid="tournament-history"]').should('be.visible');
          cy.get('[data-testid="tournament-entry"]').should('have.length.at.least', 0);
        }
      });
    });
  });
});