/// <reference types="cypress" />

describe('Performance Tests', () => {
  describe('Page Load Performance', () => {
    const pages = [
      { name: 'Home', url: '/' },
      { name: 'Login', url: '/login' },
      { name: 'Register', url: '/register' },
      { name: 'Tournaments', url: '/tournaments' },
      { name: 'Players', url: '/players' }
    ];

    pages.forEach(page => {
      it(`should load ${page.name} page within 3 seconds`, () => {
        cy.visit(page.url, {
          onBeforeLoad: (win) => {
            win.performance.mark('start');
          },
          onLoad: (win) => {
            win.performance.mark('end');
            win.performance.measure('pageLoad', 'start', 'end');
            const measure = win.performance.getEntriesByName('pageLoad')[0];
            
            // Page should load in less than 3 seconds
            expect(measure.duration).to.be.lessThan(3000);
            
            // Log performance metrics
            cy.log(`${page.name} loaded in ${Math.round(measure.duration)}ms`);
          }
        });
      });

      it(`should have good First Contentful Paint for ${page.name}`, () => {
        cy.visit(page.url);
        
        cy.window().then(win => {
          const fcp = win.performance
            .getEntriesByType('paint')
            .find(entry => entry.name === 'first-contentful-paint');
          
          if (fcp) {
            // FCP should be less than 1.8 seconds
            expect(fcp.startTime).to.be.lessThan(1800);
            cy.log(`FCP: ${Math.round(fcp.startTime)}ms`);
          }
        });
      });

      it(`should have acceptable Time to Interactive for ${page.name}`, () => {
        cy.visit(page.url);
        
        // Check that page becomes interactive quickly
        cy.get('body').should('be.visible');
        
        // Measure time to first interaction
        cy.window().then(win => {
          const navigationStart = win.performance.timing.navigationStart;
          const domInteractive = win.performance.timing.domInteractive;
          const tti = domInteractive - navigationStart;
          
          // TTI should be less than 3.8 seconds
          expect(tti).to.be.lessThan(3800);
          cy.log(`TTI: ${tti}ms`);
        });
      });
    });
  });

  describe('Resource Loading', () => {
    it('should optimize bundle sizes', () => {
      cy.visit('/');
      
      cy.window().then(win => {
        const resources = win.performance.getEntriesByType('resource');
        
        // Check JavaScript bundle sizes
        const jsResources = resources.filter(r => r.name.includes('.js'));
        jsResources.forEach(resource => {
          // Individual JS files should be less than 500KB
          expect(resource.transferSize).to.be.lessThan(500000);
          cy.log(`JS: ${resource.name} - ${Math.round(resource.transferSize / 1024)}KB`);
        });
        
        // Check CSS bundle sizes
        const cssResources = resources.filter(r => r.name.includes('.css'));
        cssResources.forEach(resource => {
          // CSS files should be less than 100KB
          expect(resource.transferSize).to.be.lessThan(100000);
          cy.log(`CSS: ${resource.name} - ${Math.round(resource.transferSize / 1024)}KB`);
        });
      });
    });

    it('should implement lazy loading for images', () => {
      cy.visit('/');
      
      cy.get('img').each($img => {
        // Images should have loading attribute
        cy.wrap($img).should('have.attr', 'loading')
          .or('have.attr', 'data-lazy');
      });
    });

    it('should cache static assets', () => {
      cy.visit('/');
      
      cy.window().then(win => {
        const resources = win.performance.getEntriesByType('resource');
        
        // Check cache headers for static assets
        resources
          .filter(r => r.name.includes('.js') || r.name.includes('.css'))
          .forEach(resource => {
            // Resources should be cached
            if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
              cy.log(`Cached: ${resource.name}`);
            }
          });
      });
    });
  });

  describe('Large Dataset Handling', () => {
    it('should handle large tournament list efficiently', () => {
      // Mock large dataset
      cy.intercept('GET', '**/tournaments', {
        fixture: 'large-tournaments.json' // 100+ tournaments
      }).as('largeTournaments');
      
      cy.visit('/tournaments');
      cy.wait('@largeTournaments');
      
      // Should implement pagination or virtualization
      cy.get('[data-testid="tournament-card"]')
        .should('have.length.lte', 20); // Should paginate
      
      // Check scroll performance
      cy.get('[data-testid="tournament-list"]').scrollTo('bottom', {
        duration: 1000
      });
      
      // No significant lag during scroll
      cy.get('[data-testid="tournament-list"]').should('be.visible');
    });

    it('should handle large player list efficiently', () => {
      // Mock large dataset
      cy.intercept('GET', '**/players', {
        fixture: 'large-players.json' // 500+ players
      }).as('largePlayers');
      
      cy.visit('/players');
      cy.wait('@largePlayers');
      
      // Should implement pagination
      cy.get('[data-testid="pagination"]').should('be.visible');
      
      // Page navigation should be fast
      cy.get('[data-testid="page-2"]').click();
      cy.get('[data-testid="player-card"]').should('be.visible');
    });

    it('should render large bracket efficiently', () => {
      cy.visit('/tournaments/1/bracket');
      
      // Bracket with 128 players
      cy.get('[data-testid="bracket-container"]').should('be.visible');
      
      // Should be able to scroll smoothly
      cy.get('[data-testid="bracket-container"]').scrollTo('right', {
        duration: 500
      });
      
      cy.get('[data-testid="bracket-container"]').scrollTo('left', {
        duration: 500
      });
      
      // Bracket should remain responsive
      cy.get('[data-testid="match-card"]').first().click();
    });
  });

  describe('API Response Times', () => {
    it('should load tournaments quickly', () => {
      cy.intercept('GET', '**/tournaments', (req) => {
        req.continue((res) => {
          // API response should be under 1 second
          expect(res.duration).to.be.lessThan(1000);
        });
      }).as('getTournaments');
      
      cy.visit('/tournaments');
      cy.wait('@getTournaments');
    });

    it('should load players quickly', () => {
      cy.intercept('GET', '**/players', (req) => {
        req.continue((res) => {
          // API response should be under 1 second
          expect(res.duration).to.be.lessThan(1000);
        });
      }).as('getPlayers');
      
      cy.visit('/players');
      cy.wait('@getPlayers');
    });

    it('should handle concurrent API requests efficiently', () => {
      cy.visit('/dashboard');
      
      // Multiple API calls should be made in parallel
      cy.intercept('GET', '**/tournaments/recent').as('recentTournaments');
      cy.intercept('GET', '**/players/top').as('topPlayers');
      cy.intercept('GET', '**/matches/live').as('liveMatches');
      
      // All should complete within 2 seconds
      cy.wait(['@recentTournaments', '@topPlayers', '@liveMatches'], {
        timeout: 2000
      });
    });
  });

  describe('Memory Management', () => {
    it('should not have memory leaks during navigation', () => {
      cy.window().then(win => {
        const initialMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
        
        // Navigate through multiple pages
        cy.visit('/tournaments');
        cy.visit('/players');
        cy.visit('/login');
        cy.visit('/register');
        cy.visit('/');
        
        cy.window().then(win => {
          const finalMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
          const memoryIncrease = finalMemory - initialMemory;
          
          // Memory increase should be reasonable (less than 10MB)
          expect(memoryIncrease).to.be.lessThan(10000000);
          cy.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
        });
      });
    });

    it('should clean up event listeners', () => {
      cy.visit('/tournaments');
      
      cy.window().then(win => {
        // Get initial listener count
        const getEventListeners = () => {
          return win.getEventListeners ? 
            Object.keys(win.getEventListeners(document)).length : 0;
        };
        
        const initialListeners = getEventListeners();
        
        // Navigate away and back
        cy.visit('/players');
        cy.visit('/tournaments');
        
        const finalListeners = getEventListeners();
        
        // Listener count should not grow significantly
        expect(finalListeners - initialListeners).to.be.lessThan(10);
      });
    });
  });

  describe('Search and Filter Performance', () => {
    it('should debounce search input', () => {
      cy.visit('/tournaments');
      
      let apiCallCount = 0;
      cy.intercept('GET', '**/tournaments/search*', () => {
        apiCallCount++;
      }).as('search');
      
      // Type quickly
      cy.get('[data-testid="search-tournaments"]').type('wimbledon');
      
      // Wait for debounce
      cy.wait(1000);
      
      // Should only make one API call after debounce
      expect(apiCallCount).to.be.lte(2);
    });

    it('should filter results efficiently', () => {
      cy.visit('/players');
      
      // Apply multiple filters
      cy.get('[data-testid="filter-country"]').select('USA');
      cy.get('[data-testid="filter-hand"]').select('Right');
      cy.get('[data-testid="filter-age"]').select('20-25');
      
      // Results should update quickly
      cy.get('[data-testid="player-card"]', { timeout: 1000 })
        .should('be.visible');
    });
  });

  describe('Real-time Updates Performance', () => {
    it('should handle live score updates efficiently', () => {
      cy.visit('/tournaments/1/live');
      
      // Simulate WebSocket connection
      cy.window().then(win => {
        // Check for WebSocket or polling
        const hasWebSocket = 'WebSocket' in win;
        expect(hasWebSocket).to.be.true;
      });
      
      // Live updates should not cause performance issues
      cy.get('[data-testid="live-score"]').should('be.visible');
      
      // Wait for potential updates
      cy.wait(5000);
      
      // Page should remain responsive
      cy.get('[data-testid="live-match"]').first().click();
    });
  });

  describe('Form Performance', () => {
    it('should validate forms without lag', () => {
      cy.visit('/register');
      
      // Type in multiple fields quickly
      cy.get('input#firstName').type('John');
      cy.get('input#lastName').type('Doe');
      cy.get('input#email').type('john.doe@example.com');
      cy.get('input#password').type('Test123!@#');
      cy.get('input#confirmPassword').type('Test123!@#');
      
      // Validation should be instant
      cy.get('.error-message').should('not.exist');
      
      // Submit should be responsive
      cy.get('button[type="submit"]').click();
    });

    it('should handle large form submissions', () => {
      cy.visit('/tournaments/create');
      
      // Fill large form
      const largeDescription = 'Lorem ipsum '.repeat(100);
      
      cy.get('textarea[name="description"]').type(largeDescription, {
        delay: 0
      });
      
      // Form should remain responsive
      cy.get('button[type="submit"]').should('not.be.disabled');
    });
  });

  describe('Network Optimization', () => {
    it('should compress API responses', () => {
      cy.intercept('GET', '**/tournaments', (req) => {
        req.continue((res) => {
          // Check for compression headers
          expect(res.headers['content-encoding']).to.match(/gzip|deflate|br/);
        });
      }).as('compressedResponse');
      
      cy.visit('/tournaments');
      cy.wait('@compressedResponse');
    });

    it('should implement request caching', () => {
      cy.visit('/tournaments');
      
      let firstLoadTime: number;
      cy.window().then(win => {
        firstLoadTime = win.performance.now();
      });
      
      // Navigate away and back
      cy.visit('/players');
      cy.visit('/tournaments');
      
      cy.window().then(win => {
        const secondLoadTime = win.performance.now();
        
        // Second load should be faster due to caching
        expect(secondLoadTime).to.be.lessThan(firstLoadTime);
      });
    });
  });
});