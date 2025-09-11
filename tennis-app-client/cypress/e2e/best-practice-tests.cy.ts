describe('Best Practice E2E Tests', () => {
  // Setup test data before all tests
  before(() => {
    // Reset database to known state
    cy.task('db:seed');
    
    // Create test user if doesn't exist
    cy.task('db:createUser', {
      email: 'e2e@test.com',
      password: 'E2ETest123!',
      firstName: 'E2E',
      lastName: 'Tester'
    });
  });

  // Clean up after tests
  after(() => {
    cy.task('db:cleanup');
  });

  beforeEach(() => {
    // Use session to maintain login across tests
    cy.session('auth', () => {
      // Set auth token in localStorage for quick auth bypass
      cy.visit('/');
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'e2e-test-token');
        win.localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: 'e2e@test.com',
          firstName: 'E2E',
          lastName: 'Tester'
        }));
      });
    });
    
    // Restore session for each test
    cy.visit('/');
  });

  describe('Player Management', () => {
    it('should perform complete player CRUD operations', () => {
      const playerId = Date.now();
      
      // CREATE
      cy.visit('/players/create');
      cy.get('#firstName').type(`Player_${playerId}`);
      cy.get('#lastName').type('TestLast');
      cy.get('#email').type(`player${playerId}@test.com`);
      cy.get('#phone').type('1234567890');
      cy.get('#dateOfBirth').type('1990-01-01');
      cy.get('button[type="submit"]').click();
      
      // READ - Verify creation
      cy.url().should('match', /\/players\/\d+$/);
      cy.contains(`Player_${playerId}`).should('be.visible');
      
      // UPDATE
      cy.get('[data-cy="edit-player-btn"]').click();
      cy.get('#phone').clear().type('9876543210');
      cy.get('button[type="submit"]').click();
      
      // Verify update
      cy.contains('9876543210').should('be.visible');
      
      // DELETE
      cy.get('[data-cy="delete-player-btn"]').click();
      cy.on('window:confirm', () => true);
      
      // Verify deletion
      cy.url().should('include', '/players');
      cy.contains(`Player_${playerId}`).should('not.exist');
    });
  });

  describe('Tournament Management', () => {
    it('should create tournament and register players', () => {
      const tournamentId = Date.now();
      
      // Create tournament
      cy.visit('/tournaments/create');
      cy.get('#name').type(`Tournament_${tournamentId}`);
      cy.get('#location').type('Test Location');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      cy.get('#startDate').type(tomorrow.toISOString().split('T')[0]);
      cy.get('#endDate').type(nextWeek.toISOString().split('T')[0]);
      cy.get('#type').select('0');
      cy.get('#surface').select('0');
      cy.get('#drawSize').select('32');
      
      cy.get('button[type="submit"]').click();
      
      // Verify tournament created
      cy.url().should('match', /\/tournaments\/\d+$/);
      cy.contains(`Tournament_${tournamentId}`).should('be.visible');
      
      // Register a player
      cy.get('[data-cy="players-tab"]').click();
      cy.get('[data-cy="register-player-btn"]').click();
      
      // Select first available player
      cy.get('[data-cy="player-search"]').type('E2E');
      cy.get('[data-cy="player-option"]').first().click();
      cy.get('[data-cy="confirm-registration"]').click();
      
      // Verify player registered
      cy.contains('E2E').should('be.visible');
      cy.contains('Registered').should('be.visible');
    });
  });

  describe('Search and Filter', () => {
    it('should search and filter tournaments', () => {
      cy.visit('/tournaments');
      
      // Search
      cy.get('[data-cy="search-input"]').type('Tournament');
      cy.get('[data-cy="tournament-card"]').should('have.length.greaterThan', 0);
      
      // Filter by status
      cy.get('[data-cy="status-filter"]').select('Upcoming');
      cy.get('[data-cy="tournament-card"]').each($card => {
        cy.wrap($card).should('contain', 'Upcoming');
      });
    });
  });
});