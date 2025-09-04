# E2E Test Fix Plan

## Priority: Make All E2E Tests Pass for CI/CD Pipeline ✅

### Current Status
- **Backend Tests**: 154/154 passing ✅
- **Frontend Unit Tests**: 65/65 passing ✅
- **E2E Smoke Tests**: 6/6 passing ✅
- **E2E Feature Tests**: Many failing ❌

### Root Causes of E2E Test Failures
1. Missing UI components (tournament list, bracket visualization)
2. Incomplete navigation flows (dashboard redirect)
3. Missing data attributes and test IDs
4. API endpoint mismatches
5. Missing error message displays
6. Accessibility issues (missing ARIA labels)

## Implementation Plan (Priority Order)

### Phase 1: Fix Authentication Flow E2E Tests
**Target: 20 tests passing**

#### 1.1 Login Component Fixes
- [ ] Add missing test IDs to elements
- [ ] Fix error message display (alert-error class)
- [ ] Implement dashboard redirect after successful login
- [ ] Add loading spinner during login
- [ ] Add "Forgot Password" link
- [ ] Store auth token in localStorage
- [ ] Add logout button with data-testid

#### 1.2 Register Component Fixes
- [ ] Add password strength indicator
- [ ] Add show/hide password toggle with data-testid
- [ ] Fix error message displays for validation
- [ ] Add loading spinner during registration
- [ ] Implement success message display
- [ ] Fix duplicate email error handling

#### 1.3 Dashboard Component
- [ ] Create basic dashboard layout
- [ ] Add welcome message with user's name
- [ ] Add navigation menu
- [ ] Add logout functionality
- [ ] Add route guard for authentication

### Phase 2: Tournament Management UI
**Target: 30 tests passing**

#### 2.1 Tournament List Component
- [ ] Create tournament-list component
- [ ] Add tournament cards with data-testid
- [ ] Implement status filter dropdown
- [ ] Add search functionality
- [ ] Implement sorting options
- [ ] Add pagination
- [ ] Add "Create Tournament" button (admin only)

#### 2.2 Tournament Detail Component
- [ ] Create tournament-detail component
- [ ] Add tournament information display
- [ ] Create tabs (Overview, Players, Bracket, Matches, Results)
- [ ] Add edit/delete buttons (admin only)
- [ ] Implement player registration list
- [ ] Add seed management functionality

#### 2.3 Tournament Form Component
- [ ] Create tournament-form component
- [ ] Add all required form fields
- [ ] Implement date validation
- [ ] Add draw size dropdown (16, 32, 64, 128)
- [ ] Add surface type selection
- [ ] Implement form submission

### Phase 3: Bracket Generation UI
**Target: 40 tests passing**

#### 3.1 Bracket Display Component
- [ ] Create bracket-tree component
- [ ] Implement bracket visualization (SVG or Canvas)
- [ ] Add round headers
- [ ] Display player names and seeds
- [ ] Show match connectors
- [ ] Add zoom/pan functionality
- [ ] Implement mobile responsive view

#### 3.2 Bracket Generation Modal
- [ ] Create generation modal
- [ ] Add draw size selection
- [ ] Implement auto-seed toggle
- [ ] Add manual seeding interface
- [ ] Show validation messages
- [ ] Add confirmation dialog

#### 3.3 Bracket Editing
- [ ] Implement drag-and-drop for players
- [ ] Add player swap functionality
- [ ] Show bracket integrity validation
- [ ] Add regenerate bracket option
- [ ] Implement export to PDF
- [ ] Add share bracket link feature

### Phase 4: Supporting Features
**Target: All tests passing**

#### 4.1 API Endpoints
- [ ] Add /api/v1/health endpoint
- [ ] Add test data seeder endpoint (/api/v1/test/seed)
- [ ] Add cleanup endpoint (/api/v1/test/cleanup)
- [ ] Fix CORS configuration for E2E tests

#### 4.2 Accessibility Fixes
- [ ] Add ARIA labels to all interactive elements
- [ ] Implement keyboard navigation
- [ ] Add role attributes to lists and items
- [ ] Fix color contrast issues
- [ ] Add screen reader support

#### 4.3 Error Handling
- [ ] Implement global error interceptor
- [ ] Add network error handling
- [ ] Show user-friendly error messages
- [ ] Add retry mechanisms
- [ ] Implement timeout handling

## File Structure to Create

```
tennis-app-client/src/app/features/
├── dashboard/
│   └── dashboard.component.ts/html/css
├── tournaments/
│   ├── tournament-list/
│   │   └── tournament-list.component.ts/html/css
│   ├── tournament-detail/
│   │   └── tournament-detail.component.ts/html/css
│   ├── tournament-form/
│   │   └── tournament-form.component.ts/html/css
│   └── tournament.service.ts
├── bracket/
│   ├── bracket-display/
│   │   └── bracket-display.component.ts/html/css
│   ├── bracket-generation/
│   │   └── bracket-generation.component.ts/html/css
│   └── bracket.service.ts
└── shared/
    ├── components/
    │   ├── loading-spinner/
    │   ├── error-message/
    │   └── pagination/
    └── directives/
        └── test-id.directive.ts

TennisApp/TennisApp.API/Controllers/
└── TestController.cs (for E2E test support)
```

## Implementation Order

1. **Day 1: Authentication Flow (8 hours)**
   - Fix login component issues
   - Fix register component issues
   - Create basic dashboard
   - Add auth token handling

2. **Day 2: Tournament List & Detail (8 hours)**
   - Create tournament list component
   - Implement filtering and search
   - Create tournament detail component
   - Add tournament form

3. **Day 3: Bracket Visualization (8 hours)**
   - Create bracket display component
   - Implement bracket generation UI
   - Add bracket editing features
   - Mobile responsive design

4. **Day 4: Integration & Testing (8 hours)**
   - Add test data seeders
   - Fix remaining test failures
   - Add accessibility features
   - Run full E2E test suite

## Success Criteria
- [ ] All E2E login tests pass (12 tests)
- [ ] All E2E register tests pass (15 tests)
- [ ] All E2E tournament management tests pass (25 tests)
- [ ] All E2E bracket generation tests pass (30 tests)
- [ ] GitHub Actions CI/CD pipeline passes
- [ ] No accessibility violations
- [ ] All forms have proper validation
- [ ] Mobile responsive on all pages

## Commands to Run Tests

```bash
# Run all E2E tests
npm run e2e:headless

# Run specific test suites
npx cypress run --spec "cypress/e2e/auth/*.cy.ts"
npx cypress run --spec "cypress/e2e/tournament/*.cy.ts"

# Run with specific browser
npm run e2e:chrome
npm run e2e:firefox

# Run in interactive mode for debugging
npm run e2e
```

## Notes
- Focus on making tests pass, not perfect UI
- Use Angular Material or simple CSS for quick implementation
- Reuse existing DTOs and services from backend
- Add data-testid attributes to all interactive elements
- Keep components simple and functional