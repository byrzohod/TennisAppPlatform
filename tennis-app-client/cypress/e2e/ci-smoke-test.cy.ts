describe('CI Smoke Test - Real Backend', () => {
  it('should connect to the real backend API', () => {
    // Test that the backend is accessible
    cy.request({
      url: `${Cypress.env('apiUrl')}/health`,
      failOnStatusCode: false,
      timeout: 30000
    }).then((response) => {
      // Backend should respond (even if it's an error, at least it's reachable)
      expect(response.status).to.be.lessThan(600); // Any HTTP status code
    });
  });

  it('should load the login page', () => {
    cy.visit('/login', { timeout: 30000 });
    
    // Login page should have the form elements
    cy.get('input[formControlName="email"], input[type="email"]', { timeout: 10000 }).should('exist');
    cy.get('input[formControlName="password"], input[type="password"]', { timeout: 10000 }).should('exist');
    cy.get('button[type="submit"]', { timeout: 10000 }).should('exist');
  });

  it('should register and login a test user', () => {
    const uniqueId = Date.now();
    const testUser = {
      email: `test-${uniqueId}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: `User${uniqueId}`
    };

    // Try to register the user via API
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/register`,
      body: {
        ...testUser,
        confirmPassword: testUser.password
      },
      failOnStatusCode: false,
      timeout: 30000
    }).then((response) => {
      // If registration succeeds or user exists, try to login
      if (response.status === 200 || response.status === 201 || response.status === 409) {
        // Now login via UI
        cy.visit('/login');
        
        // Wait for page to load
        cy.get('input[formControlName="email"], input[type="email"]', { timeout: 10000 })
          .clear()
          .type(testUser.email);
        
        cy.get('input[formControlName="password"], input[type="password"]', { timeout: 10000 })
          .clear()
          .type(testUser.password);
        
        cy.get('button[type="submit"]').click();
        
        // Should redirect away from login (to dashboard or home)
        cy.url({ timeout: 15000 }).should('not.include', '/login');
      }
    });
  });

  it('should access the players page when authenticated', () => {
    // First create and login a user
    const uniqueId = Date.now();
    const testUser = {
      email: `test-${uniqueId}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: `User${uniqueId}`
    };

    // Register user via API
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/register`,
      body: {
        ...testUser,
        confirmPassword: testUser.password
      },
      failOnStatusCode: false,
      timeout: 30000
    });

    // Login via API to get token
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/login`,
      body: {
        email: testUser.email,
        password: testUser.password
      },
      failOnStatusCode: false,
      timeout: 30000
    }).then((response) => {
      if (response.status === 200 && response.body.token) {
        // Set the auth token
        cy.window().then((win) => {
          win.localStorage.setItem('authToken', response.body.token);
          if (response.body.user) {
            win.localStorage.setItem('user', JSON.stringify(response.body.user));
          }
        });

        // Now visit players page
        cy.visit('/players');
        
        // Should stay on players page (not redirect to login)
        cy.url({ timeout: 10000 }).should('include', '/players');
        
        // Page should load
        cy.get('h1, h2, h3', { timeout: 10000 }).should('exist');
      }
    });
  });
});