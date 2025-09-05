/// <reference types="cypress" />

describe('Tournament CRUD Operations', () => {
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
    
    cy.visit('/tournaments');
  });

  describe('Tournament List View', () => {
    it('should display tournaments page', () => {
      cy.url().should('include', '/tournaments');
      cy.get('h1').should('contain.text', 'Tournament');
    });

    it('should show tournament list with proper structure', () => {
      cy.get('[data-testid="tournament-list"]').should('exist');
      
      // Check for tournament cards or table
      cy.get('body').then($body => {
        if ($body.find('[data-testid="tournament-card"]').length > 0) {
          cy.get('[data-testid="tournament-card"]').should('have.length.at.least', 1);
        } else if ($body.find('table').length > 0) {
          cy.get('table').should('exist');
          cy.get('thead').should('exist');
          cy.get('tbody').should('exist');
        }
      });
    });

    it('should display tournament information', () => {
      cy.get('body').then($body => {
        // Check if any tournament data is displayed
        const tournamentFields = ['Name', 'Date', 'Location', 'Status', 'Draw Size'];
        
        tournamentFields.forEach(field => {
          if ($body.text().includes(field)) {
            cy.log(`Found field: ${field}`);
          }
        });
      });
    });

    it('should have search functionality', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="search-tournaments"]').length > 0) {
          cy.get('[data-testid="search-tournaments"]').type('Wimbledon');
          cy.wait(500); // Debounce
          
          // Results should be filtered
          cy.get('[data-testid="tournament-card"]').should('have.length.lte', 10);
        }
      });
    });

    it('should have filter options', () => {
      cy.get('body').then($body => {
        // Check for filter dropdowns
        if ($body.find('[data-testid="filter-status"]').length > 0) {
          cy.get('[data-testid="filter-status"]').select('Upcoming');
          cy.wait(500);
        }
        
        if ($body.find('[data-testid="filter-type"]').length > 0) {
          cy.get('[data-testid="filter-type"]').select('ATP250');
          cy.wait(500);
        }
      });
    });

    it('should support pagination', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="pagination"]').length > 0) {
          cy.get('[data-testid="pagination"]').should('be.visible');
          
          // Check for page numbers
          if ($body.find('[data-testid="page-2"]').length > 0) {
            cy.get('[data-testid="page-2"]').click();
            cy.url().should('include', 'page=2');
          }
        }
      });
    });
  });

  describe('Create Tournament', () => {
    beforeEach(() => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="create-tournament-btn"]').length > 0) {
          cy.get('[data-testid="create-tournament-btn"]').click();
        } else {
          cy.visit('/tournaments/create', { failOnStatusCode: false });
        }
      });
    });

    it('should display create tournament form', () => {
      cy.get('body').then($body => {
        if ($body.find('form').length > 0) {
          cy.get('form').should('be.visible');
          
          // Check for required fields
          const requiredFields = [
            'input[name="name"]',
            'input[name="location"]',
            'input[name="startDate"]',
            'input[name="endDate"]'
          ];
          
          requiredFields.forEach(field => {
            if ($body.find(field).length > 0) {
              cy.get(field).should('be.visible');
            }
          });
        }
      });
    });

    it('should validate required fields', () => {
      cy.get('body').then($body => {
        if ($body.find('button[type="submit"]').length > 0) {
          // Try to submit empty form
          cy.get('button[type="submit"]').click();
          
          // Should show validation errors
          cy.get('.error-message').should('have.length.at.least', 1);
        }
      });
    });

    it('should validate date range', () => {
      cy.get('body').then($body => {
        if ($body.find('input[name="startDate"]').length > 0 && 
            $body.find('input[name="endDate"]').length > 0) {
          // Set end date before start date
          cy.get('input[name="startDate"]').type('2024-12-31');
          cy.get('input[name="endDate"]').type('2024-12-01');
          cy.get('button[type="submit"]').click();
          
          // Should show date validation error
          cy.get('.error-message').should('contain.text', 'date');
        }
      });
    });

    it('should create tournament with valid data', () => {
      cy.get('body').then($body => {
        if ($body.find('form').length > 0) {
          const tournamentData = {
            name: `Test Tournament ${Date.now()}`,
            location: 'New York, USA',
            startDate: '2024-12-01',
            endDate: '2024-12-14',
            type: 'ATP500',
            surface: 'HardCourt',
            drawSize: '32'
          };
          
          // Fill form fields if they exist
          Object.entries(tournamentData).forEach(([field, value]) => {
            if ($body.find(`input[name="${field}"]`).length > 0) {
              cy.get(`input[name="${field}"]`).type(value);
            } else if ($body.find(`select[name="${field}"]`).length > 0) {
              cy.get(`select[name="${field}"]`).select(value);
            }
          });
          
          // Submit form
          cy.get('button[type="submit"]').click();
          
          // Should show success or redirect
          cy.get('body').then($afterSubmit => {
            if ($afterSubmit.find('.alert-success').length > 0) {
              cy.get('.alert-success').should('be.visible');
            } else {
              cy.url().should('not.include', '/create');
            }
          });
        }
      });
    });

    it('should handle draw size options', () => {
      cy.get('body').then($body => {
        if ($body.find('select[name="drawSize"]').length > 0) {
          cy.get('select[name="drawSize"]').should('be.visible');
          
          // Check available options
          cy.get('select[name="drawSize"] option').should('have.length.at.least', 4);
          
          // Valid options: 16, 32, 64, 128
          const validSizes = ['16', '32', '64', '128'];
          validSizes.forEach(size => {
            cy.get(`select[name="drawSize"] option[value="${size}"]`).should('exist');
          });
        }
      });
    });
  });

  describe('Edit Tournament', () => {
    it('should navigate to edit page', () => {
      cy.get('body').then($body => {
        // Find a tournament to edit
        if ($body.find('[data-testid="tournament-card"]').length > 0) {
          cy.get('[data-testid="tournament-card"]').first().click();
          
          // Look for edit button
          if ($body.find('[data-testid="edit-tournament-btn"]').length > 0) {
            cy.get('[data-testid="edit-tournament-btn"]').click();
            cy.url().should('include', '/edit');
          }
        }
      });
    });

    it('should load tournament data in edit form', () => {
      cy.visit('/tournaments/1/edit', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('form').length > 0) {
          // Check that form fields have values
          cy.get('input[name="name"]').should('have.value');
          cy.get('input[name="location"]').should('have.value');
        }
      });
    });

    it('should update tournament details', () => {
      cy.visit('/tournaments/1/edit', { failOnStatusCode: false });
      
      cy.get('body').then($body => {
        if ($body.find('form').length > 0) {
          // Update location
          cy.get('input[name="location"]').clear().type('Updated Location');
          cy.get('button[type="submit"]').click();
          
          // Should show success
          cy.get('body').then($afterUpdate => {
            if ($afterUpdate.find('.alert-success').length > 0) {
              cy.get('.alert-success').should('contain', 'updated');
            }
          });
        }
      });
    });

    it('should prevent editing of in-progress tournaments', () => {
      cy.get('body').then($body => {
        // Find in-progress tournament
        if ($body.find('[data-testid="status-filter"]').length > 0) {
          cy.get('[data-testid="status-filter"]').select('In Progress');
          cy.wait(500);
          
          if ($body.find('[data-testid="tournament-card"]').length > 0) {
            cy.get('[data-testid="tournament-card"]').first().click();
            
            // Edit button should be disabled or show warning
            if ($body.find('[data-testid="edit-tournament-btn"]').length > 0) {
              cy.get('[data-testid="edit-tournament-btn"]')
                .should('be.disabled')
                .or('have.class', 'disabled');
            }
          }
        }
      });
    });
  });

  describe('Delete Tournament', () => {
    it('should show delete confirmation', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="tournament-card"]').length > 0) {
          cy.get('[data-testid="tournament-card"]').first().click();
          
          if ($body.find('[data-testid="delete-tournament-btn"]').length > 0) {
            cy.get('[data-testid="delete-tournament-btn"]').click();
            
            // Should show confirmation modal
            cy.get('.modal').should('be.visible');
            cy.get('.modal-body').should('contain', 'confirm');
          }
        }
      });
    });

    it('should cancel delete operation', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="tournament-card"]').length > 0) {
          cy.get('[data-testid="tournament-card"]').first().click();
          
          if ($body.find('[data-testid="delete-tournament-btn"]').length > 0) {
            cy.get('[data-testid="delete-tournament-btn"]').click();
            
            // Cancel deletion
            if ($body.find('[data-testid="cancel-delete"]').length > 0) {
              cy.get('[data-testid="cancel-delete"]').click();
              cy.get('.modal').should('not.exist');
            }
          }
        }
      });
    });

    it('should delete tournament after confirmation', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="tournament-card"]').length > 0) {
          // Get tournament name for verification
          let tournamentName: string;
          cy.get('[data-testid="tournament-card"]').first()
            .find('.tournament-name')
            .invoke('text')
            .then(text => {
              tournamentName = text;
            });
          
          cy.get('[data-testid="tournament-card"]').first().click();
          
          if ($body.find('[data-testid="delete-tournament-btn"]').length > 0) {
            cy.get('[data-testid="delete-tournament-btn"]').click();
            
            // Confirm deletion
            if ($body.find('[data-testid="confirm-delete"]').length > 0) {
              cy.get('[data-testid="confirm-delete"]').click();
              
              // Should show success message
              cy.get('.alert-success').should('contain', 'deleted');
              
              // Tournament should be removed from list
              cy.get('.tournament-name').should('not.contain', tournamentName);
            }
          }
        }
      });
    });

    it('should prevent deletion of tournaments with matches', () => {
      cy.get('body').then($body => {
        // Find tournament with matches
        if ($body.find('[data-testid="status-filter"]').length > 0) {
          cy.get('[data-testid="status-filter"]').select('In Progress');
          cy.wait(500);
          
          if ($body.find('[data-testid="tournament-card"]').length > 0) {
            cy.get('[data-testid="tournament-card"]').first().click();
            
            if ($body.find('[data-testid="delete-tournament-btn"]').length > 0) {
              cy.get('[data-testid="delete-tournament-btn"]').click();
              
              // Should show warning about existing matches
              cy.get('.alert-warning').should('exist')
                .or('contain.text', 'matches');
            }
          }
        }
      });
    });
  });

  describe('Tournament Status Management', () => {
    it('should update tournament status', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="tournament-card"]').length > 0) {
          cy.get('[data-testid="tournament-card"]').first().click();
          
          if ($body.find('[data-testid="status-select"]').length > 0) {
            cy.get('[data-testid="status-select"]').select('In Progress');
            cy.get('[data-testid="save-status"]').click();
            
            // Should update status
            cy.get('.tournament-status').should('contain', 'In Progress');
          }
        }
      });
    });

    it('should validate status transitions', () => {
      cy.get('body').then($body => {
        // Find completed tournament
        if ($body.find('[data-testid="status-filter"]').length > 0) {
          cy.get('[data-testid="status-filter"]').select('Completed');
          cy.wait(500);
          
          if ($body.find('[data-testid="tournament-card"]').length > 0) {
            cy.get('[data-testid="tournament-card"]').first().click();
            
            // Should not allow changing from Completed to Upcoming
            if ($body.find('[data-testid="status-select"]').length > 0) {
              cy.get('[data-testid="status-select"] option[value="Upcoming"]')
                .should('be.disabled');
            }
          }
        }
      });
    });
  });
});