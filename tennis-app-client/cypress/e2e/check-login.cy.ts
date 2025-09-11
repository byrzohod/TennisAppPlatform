describe('Check Login', () => {
  it('should check login page', () => {
    cy.visit('/login');
    
    // Check what's on the page
    cy.get('body').then($body => {
      // Log any visible text about login
      cy.log('Page title: ' + $body.find('h2').first().text());
      
      // Check for email field
      const hasEmail = $body.find('input[type="email"]').length > 0;
      const hasEmailForm = $body.find('input[formControlName="email"]').length > 0;
      cy.log(`Email field exists: ${hasEmail}, FormControl email: ${hasEmailForm}`);
      
      // Check for password field
      const hasPassword = $body.find('input[type="password"]').length > 0;
      cy.log(`Password field exists: ${hasPassword}`);
      
      // Check for submit button
      const submitBtn = $body.find('button[type="submit"]');
      if (submitBtn.length > 0) {
        cy.log(`Submit button text: ${submitBtn.text()}`);
      }
      
      // Check for any error messages
      if ($body.find('.error').length > 0) {
        cy.log('Error on page: ' + $body.find('.error').text());
      }
    });
    
    // Try a simple login with test credentials
    cy.get('input[formControlName="email"]').type('test@example.com');
    cy.get('input[formControlName="password"]').type('Test123!');
    cy.get('button[type="submit"]').click();
    
    // Wait a bit to see what happens
    cy.wait(2000);
    
    // Check if we're still on login or redirected
    cy.url().then(url => {
      cy.log(`After login attempt, URL is: ${url}`);
    });
    
    // Check for any error messages after login attempt
    cy.get('body').then($body => {
      if ($body.find('[role="alert"]').length > 0) {
        cy.log('Alert after login: ' + $body.find('[role="alert"]').text());
      }
      if ($body.find('.error').length > 0) {
        cy.log('Error after login: ' + $body.find('.error').text());
      }
    });
  });
  
  it('should try to bypass login', () => {
    // Try to go directly to players
    cy.visit('/players', { failOnStatusCode: false });
    
    // Check where we ended up
    cy.url().then(url => {
      cy.log(`Tried to visit /players, ended up at: ${url}`);
    });
  });
});