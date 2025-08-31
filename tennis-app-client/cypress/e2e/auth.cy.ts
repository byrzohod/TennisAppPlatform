describe('Authentication Flow', () => {
  const API_URL = 'http://localhost:5221/api/v1'
  
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('User Registration', () => {
    it('should successfully register a new user', () => {
      // Visit the registration page
      cy.visit('/register')
      
      // Fill out the registration form
      const timestamp = Date.now()
      const testEmail = `test${timestamp}@example.com`
      
      cy.get('[data-cy=firstName]').type('Test')
      cy.get('[data-cy=lastName]').type('User')
      cy.get('[data-cy=email]').type(testEmail)
      cy.get('[data-cy=password]').type('TestPassword123!')
      
      // Intercept the registration API call to verify it's working
      cy.intercept('POST', `${API_URL}/auth/register`).as('registerRequest')
      
      // Submit the form
      cy.get('[data-cy=register-button]').click()
      
      // Wait for the API call and verify it succeeds
      cy.wait('@registerRequest').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200)
        expect(interception.response?.body).to.have.property('token')
        expect(interception.response?.body).to.have.property('user')
      })
      
      // Should redirect to dashboard after successful registration
      cy.url().should('include', '/dashboard')
      
      // Should display user's name in the navigation
      cy.get('[data-cy=user-name]').should('contain', 'Test User')
    })

    it('should show validation errors for invalid input', () => {
      cy.visit('/register')
      
      // Try to submit empty form
      cy.get('[data-cy=register-button]').click()
      
      // Should show validation errors
      cy.get('[data-cy=firstName-error]').should('be.visible')
      cy.get('[data-cy=lastName-error]').should('be.visible')
      cy.get('[data-cy=email-error]').should('be.visible')
      cy.get('[data-cy=password-error]').should('be.visible')
    })

    it('should handle registration failure gracefully', () => {
      cy.visit('/register')
      
      // Fill form with duplicate email (assuming test@example.com already exists)
      cy.get('[data-cy=firstName]').type('Test')
      cy.get('[data-cy=lastName]').type('User')
      cy.get('[data-cy=email]').type('duplicate@example.com')
      cy.get('[data-cy=password]').type('TestPassword123!')
      
      // Intercept and mock a 400 error response
      cy.intercept('POST', `${API_URL}/auth/register`, {
        statusCode: 400,
        body: { message: 'Registration failed. Email may already be in use.' }
      }).as('registerFailure')
      
      cy.get('[data-cy=register-button]').click()
      
      cy.wait('@registerFailure')
      
      // Should display error message
      cy.get('[data-cy=error-message]').should('contain', 'Registration failed')
      
      // Should remain on registration page
      cy.url().should('include', '/register')
    })
  })

  describe('User Login', () => {
    it('should successfully login an existing user', () => {
      cy.visit('/login')
      
      cy.get('[data-cy=email]').type('test@example.com')
      cy.get('[data-cy=password]').type('TestPassword123!')
      
      cy.intercept('POST', `${API_URL}/auth/login`).as('loginRequest')
      
      cy.get('[data-cy=login-button]').click()
      
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200)
      })
      
      cy.url().should('include', '/dashboard')
    })

    it('should handle invalid credentials', () => {
      cy.visit('/login')
      
      cy.get('[data-cy=email]').type('invalid@example.com')
      cy.get('[data-cy=password]').type('wrongpassword')
      
      cy.intercept('POST', `${API_URL}/auth/login`, {
        statusCode: 401,
        body: { message: 'Invalid email or password' }
      }).as('loginFailure')
      
      cy.get('[data-cy=login-button]').click()
      
      cy.wait('@loginFailure')
      
      cy.get('[data-cy=error-message]').should('contain', 'Invalid email or password')
      cy.url().should('include', '/login')
    })
  })

  describe('Authentication State', () => {
    it('should redirect to login when accessing protected routes while unauthenticated', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/login')
    })

    it('should maintain authentication state after page refresh', () => {
      // Login first
      cy.visit('/login')
      cy.get('[data-cy=email]').type('test@example.com')
      cy.get('[data-cy=password]').type('TestPassword123!')
      
      cy.intercept('POST', `${API_URL}/auth/login`, {
        statusCode: 200,
        body: { 
          token: 'fake-jwt-token',
          user: { email: 'test@example.com', firstName: 'Test', lastName: 'User' }
        }
      }).as('loginSuccess')
      
      cy.get('[data-cy=login-button]').click()
      cy.wait('@loginSuccess')
      
      // Refresh the page
      cy.reload()
      
      // Should still be authenticated and on dashboard
      cy.url().should('include', '/dashboard')
    })

    it('should logout successfully', () => {
      // Assume we're already logged in
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'fake-jwt-token')
        win.localStorage.setItem('user_data', JSON.stringify({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }))
      })
      
      cy.visit('/dashboard')
      
      // Click logout
      cy.get('[data-cy=logout-button]').click()
      
      // Should redirect to login
      cy.url().should('include', '/login')
      
      // Auth state should be cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('auth_token')).to.be.null
        expect(win.localStorage.getItem('user_data')).to.be.null
      })
    })
  })

  describe('Network Connectivity', () => {
    it('should handle API server being unreachable', () => {
      cy.visit('/register')
      
      // Fill the form
      cy.get('[data-cy=firstName]').type('Test')
      cy.get('[data-cy=lastName]').type('User')
      cy.get('[data-cy=email]').type('test@example.com')
      cy.get('[data-cy=password]').type('TestPassword123!')
      
      // Simulate network error
      cy.intercept('POST', `${API_URL}/auth/register`, { forceNetworkError: true }).as('networkError')
      
      cy.get('[data-cy=register-button]').click()
      
      cy.wait('@networkError')
      
      // Should show network error message
      cy.get('[data-cy=error-message]').should('contain', 'network')
        .or('contain', 'connection')
        .or('contain', 'server')
    })
  })
})