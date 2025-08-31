describe('API Connectivity Debug', () => {
  const API_URL = 'http://localhost:5221/api/v1'
  
  it('should be able to reach the API health endpoint', () => {
    // First, let's test if we can reach the API at all
    cy.request({
      method: 'GET',
      url: `${API_URL}/../swagger/index.html`,
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`API Health Check Status: ${response.status}`)
      // We expect swagger to be available in development
      expect([200, 404]).to.include(response.status)
    })
  })
  
  it('should be able to make a simple OPTIONS request (CORS preflight)', () => {
    cy.request({
      method: 'OPTIONS',
      url: `${API_URL}/auth/register`,
      failOnStatusCode: false,
      headers: {
        'Origin': 'http://localhost:4200',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    }).then((response) => {
      cy.log(`CORS Preflight Status: ${response.status}`)
      cy.log(`CORS Headers:`, response.headers)
      
      // Should return 200/204 for successful CORS preflight
      expect([200, 204]).to.include(response.status)
      
      // Should have CORS headers
      expect(response.headers).to.have.property('access-control-allow-origin')
      expect(response.headers).to.have.property('access-control-allow-methods')
    })
  })
  
  it('should be able to make a register request directly', () => {
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    }
    
    cy.request({
      method: 'POST',
      url: `${API_URL}/auth/register`,
      body: testData,
      failOnStatusCode: false,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:4200'
      }
    }).then((response) => {
      cy.log(`Register Status: ${response.status}`)
      cy.log(`Register Response:`, response.body)
      
      if (response.status >= 400) {
        cy.log(`Error Response:`, response)
      }
      
      // Should return 200 for successful registration
      // or 400 if email already exists (which is also fine for testing)
      expect([200, 400]).to.include(response.status)
    })
  })
  
  it('should test actual frontend form submission', () => {
    // Visit the register page and check if it loads
    cy.visit('/register', { failOnStatusCode: false })
    
    cy.get('form').should('exist')
    
    // Check if the form fields exist (using basic selectors since data-cy attrs aren't added yet)
    cy.get('input[formControlName="firstName"]').should('exist').type('Test')
    cy.get('input[formControlName="lastName"]').should('exist').type('User')
    cy.get('input[formControlName="email"]').should('exist').type(`test-${Date.now()}@example.com`)
    cy.get('input[formControlName="password"]').should('exist').type('TestPassword123!')
    
    // Intercept the network request to see what happens
    cy.intercept('POST', `${API_URL}/auth/register`).as('registerAttempt')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Wait for the request and check what happened
    cy.wait('@registerAttempt', { timeout: 30000 }).then((interception) => {
      cy.log('Network Request Details:', interception)
      cy.log('Request URL:', interception.request.url)
      cy.log('Request Headers:', interception.request.headers)
      cy.log('Request Body:', interception.request.body)
      
      if (interception.response) {
        cy.log('Response Status:', interception.response.statusCode)
        cy.log('Response Headers:', interception.response.headers)
        cy.log('Response Body:', interception.response.body)
      } else {
        cy.log('NO RESPONSE RECEIVED - This indicates the request is hanging!')
      }
    })
  })
})