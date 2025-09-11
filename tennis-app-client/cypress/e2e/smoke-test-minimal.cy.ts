describe('Minimal Smoke Test', () => {
  it('should load the application', () => {
    // Just visit the app and verify it loads
    cy.visit('/', { failOnStatusCode: false });
    
    // The app should either show login page or dashboard
    cy.url().should('satisfy', (url) => {
      return url.includes('/login') || url.includes('/dashboard') || url.endsWith('/');
    });
    
    // Page should have some content
    cy.get('body').should('exist');
    cy.get('body').should('not.be.empty');
  });

  it('should have navigation structure', () => {
    cy.visit('/', { failOnStatusCode: false });
    
    // Should have some kind of navigation or header
    cy.get('nav, header, [role="navigation"], .navbar, .header').should('exist');
  });

  it('should navigate to login page', () => {
    cy.visit('/login', { failOnStatusCode: false });
    
    // Should see login-related elements
    cy.get('input[type="email"], input[type="text"], input[name*="email"], input[name*="user"]', { timeout: 10000 }).should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"], button').should('exist');
  });
});