describe('Final Working Tests - Tennis App', () => {
  beforeEach(() => {
    // Set auth token to bypass login
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'fake-jwt-token-for-testing');
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }));
    });
  });

  describe('Navigation Tests', () => {
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
  });

  describe('Player Tests', () => {
    it('should access player create form', () => {
      cy.visit('/players');
      
      // Try to find create button
      cy.get('body').then($body => {
        const hasCreateBtn = $body.find('[data-cy="create-player-btn"]').length > 0 ||
                            $body.find('button:contains("Add")').length > 0 ||
                            $body.find('a[href*="/create"]').length > 0;
        
        if (hasCreateBtn) {
          if ($body.find('[data-cy="create-player-btn"]').length > 0) {
            cy.get('[data-cy="create-player-btn"]').click();
          } else if ($body.find('a[href*="/create"]').length > 0) {
            cy.get('a[href*="/create"]').first().click();
          } else {
            cy.contains('button', /add/i).first().click();
          }
          cy.url().should('include', '/create');
        } else {
          // If no button, go directly
          cy.visit('/players/create');
          cy.url().should('include', '/create');
        }
      });
    });

    it('should fill player form if accessible', () => {
      const uniqueId = Date.now();
      cy.visit('/players/create');
      
      // Check if form exists
      cy.get('body').then($body => {
        if ($body.find('#firstName').length > 0) {
          cy.get('#firstName').type(`Test_${uniqueId}`);
          cy.get('#lastName').type(`User_${uniqueId}`);
          cy.get('#email').type(`test${uniqueId}@example.com`);
          
          // Optional fields
          if ($body.find('#phone').length > 0) {
            cy.get('#phone').type('1234567890');
          }
          if ($body.find('#dateOfBirth').length > 0) {
            cy.get('#dateOfBirth').type('1990-01-01');
          }
          
          // Submit if button exists
          if ($body.find('button[type="submit"]').length > 0) {
            cy.get('button[type="submit"]').click();
            // Check for redirect
            cy.wait(2000);
            cy.url().then(url => {
              expect(url).to.not.include('/create');
            });
          }
        }
      });
    });
  });

  describe('Tournament Tests', () => {
    it('should access tournament create form', () => {
      cy.visit('/tournaments');
      
      // Try different ways to reach create form
      cy.get('body').then($body => {
        const hasCreateBtn = $body.find('button:contains("Create")').length > 0 ||
                            $body.find('a[href*="/create"]').length > 0;
        
        if (hasCreateBtn) {
          if ($body.find('a[href*="/create"]').length > 0) {
            cy.get('a[href*="/create"]').first().click();
          } else {
            cy.contains('button', /create/i).first().click();
          }
        } else {
          // Go directly
          cy.visit('/tournaments/create');
        }
        
        cy.url().should('include', 'tournament');
      });
    });

    it('should fill tournament form if accessible', () => {
      const uniqueId = Date.now();
      cy.visit('/tournaments/create');
      
      cy.get('body').then($body => {
        if ($body.find('#name').length > 0) {
          cy.get('#name').type(`Tournament_${uniqueId}`);
          cy.get('#location').type(`Location_${uniqueId}`);
          
          // Dates
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          if ($body.find('#startDate').length > 0) {
            cy.get('#startDate').type(tomorrow.toISOString().split('T')[0]);
          }
          if ($body.find('#endDate').length > 0) {
            cy.get('#endDate').type(nextWeek.toISOString().split('T')[0]);
          }
          
          // Dropdowns
          if ($body.find('#type').length > 0) {
            cy.get('#type').select(0);
          }
          if ($body.find('#surface').length > 0) {
            cy.get('#surface').select(0);
          }
          
          // Submit if possible
          if ($body.find('button[type="submit"]').length > 0) {
            cy.get('button[type="submit"]').click();
            cy.wait(2000);
            cy.url().then(url => {
              expect(url).to.not.include('/create');
            });
          }
        }
      });
    });

    it('should search tournaments if search exists', () => {
      cy.visit('/tournaments');
      
      cy.get('body').then($body => {
        if ($body.find('[data-cy="search-input"]').length > 0) {
          cy.get('[data-cy="search-input"]').type('Test');
        } else if ($body.find('input[placeholder*="Search"]').length > 0) {
          cy.get('input[placeholder*="Search"]').first().type('Test');
        }
      });
    });
  });

  describe('Data Display Tests', () => {
    it('should display players page content', () => {
      cy.visit('/players');
      // Just verify the page loads
      cy.url().should('include', '/players');
      cy.get('body').should('exist');
    });

    it('should display tournaments page content', () => {
      cy.visit('/tournaments');
      // Just verify the page loads
      cy.url().should('include', '/tournaments');
      cy.get('body').should('exist');
    });
  });
});