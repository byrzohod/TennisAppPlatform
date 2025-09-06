/// <reference types="cypress" />

describe('Registration Tests', () => {
  beforeEach(() => {
    // First visit the page to initialize the window
    cy.visit('/register');
    // Then clear authentication state
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
      win.localStorage.removeItem('access_token');
      win.localStorage.removeItem('refresh_token');
    });
    // Visit again to ensure clean state
    cy.visit('/register');
  });

  it('should load the register page', () => {
    cy.url().should('include', '/register');
    cy.get('h2').should('contain.text', 'Create Account');
  });

  it('should have register page elements', () => {
    // Check that the page loads with the new UI components
    cy.get('app-card').should('exist');
    cy.get('app-input[formControlName="firstName"]').should('exist');
    cy.get('app-input[formControlName="lastName"]').should('exist');
    cy.get('app-input[formControlName="email"]').should('exist');
    cy.get('app-input[formControlName="password"]').should('exist');
    cy.get('app-input[formControlName="confirmPassword"]').should('exist');
    cy.get('app-button[type="submit"]').should('exist');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('app-button[type="submit"]').click();
    
    // Check that error messages are displayed
    cy.contains('First name is required').should('be.visible');
    cy.contains('Last name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should validate email format', () => {
    cy.get('app-input[formControlName="firstName"] input').type('John');
    cy.get('app-input[formControlName="lastName"] input').type('Doe');
    cy.get('app-input[formControlName="email"] input').type('invalid-email');
    cy.get('app-input[formControlName="password"] input').type('Password123!');
    cy.get('app-input[formControlName="confirmPassword"] input').type('Password123!');
    
    cy.get('app-button[type="submit"]').click();
    
    cy.contains('Please enter a valid email address').should('be.visible');
  });

  it('should validate password match', () => {
    cy.get('app-input[formControlName="firstName"] input').type('John');
    cy.get('app-input[formControlName="lastName"] input').type('Doe');
    cy.get('app-input[formControlName="email"] input').type('test@example.com');
    cy.get('app-input[formControlName="password"] input').type('Password123!');
    cy.get('app-input[formControlName="confirmPassword"] input').type('DifferentPassword123!');
    
    cy.get('app-button[type="submit"]').click();
    
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('should show password strength indicator', () => {
    cy.get('app-input[formControlName="password"] input').type('weak');
    cy.contains('Password strength:').should('be.visible');
    cy.contains('weak').should('be.visible');
    
    cy.get('app-input[formControlName="password"] input').clear().type('Password123!');
    cy.contains('strong').should('be.visible');
  });

  it('should toggle password visibility', () => {
    cy.get('app-input[formControlName="password"] input').type('Password123!');
    cy.get('[data-testid="toggle-password"]').click();
    
    // Password should be visible (type changed to text)
    cy.get('app-input[formControlName="password"] input').should('have.attr', 'type', 'text');
    
    // Click again to hide
    cy.get('[data-testid="toggle-password"]').click();
    cy.get('app-input[formControlName="password"] input').should('have.attr', 'type', 'password');
  });

  it('should navigate to login page', () => {
    cy.get('a[routerLink="/login"]').first().click();
    cy.url().should('include', '/login');
  });

  it('should have responsive design elements', () => {
    // Check for responsive header
    cy.get('header').should('exist');
    
    // Check for hero section (desktop only)
    cy.viewport(1200, 800);
    cy.get('.lg\\:flex').should('exist');
    
    // Check mobile layout
    cy.viewport(375, 667);
    cy.get('.lg\\:hidden').should('exist');
  });
});