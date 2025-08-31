#!/bin/bash

# Tennis App - Complete Build & Test Script
# This script builds and tests both backend and frontend applications
# Exit on any error

set -e

echo "========================================="
echo "Tennis App - Build & Test Pipeline"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 - PASSED${NC}"
    else
        echo -e "${RED}❌ $2 - FAILED${NC}"
        exit 1
    fi
}

# Track overall status
BACKEND_BUILD=false
FRONTEND_BUILD=false
BACKEND_TESTS=false
FRONTEND_TESTS=false

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$SCRIPT_DIR/.."

echo "Starting build process from: $ROOT_DIR"
echo ""

# ===========================================
# BACKEND BUILD & TEST
# ===========================================
echo -e "${YELLOW}▶ BACKEND BUILD & TEST${NC}"
echo "-------------------------------------------"

cd "$ROOT_DIR/TennisApp"

# Clean previous builds
echo "Cleaning previous builds..."
dotnet clean -c Release 2>/dev/null || true

# Restore packages
echo "Restoring NuGet packages..."
dotnet restore
print_status $? "Backend package restore"

# Build solution
echo "Building backend solution..."
dotnet build -c Release --no-restore
print_status $? "Backend build"
BACKEND_BUILD=true

# Run tests with coverage
echo "Running backend tests..."
dotnet test --no-build -c Release \
    --logger "console;verbosity=normal" \
    --collect:"XPlat Code Coverage" \
    /p:CollectCoverage=true \
    /p:CoverletOutputFormat=cobertura \
    /p:CoverletOutput=./TestResults/

TEST_RESULT=$?
print_status $TEST_RESULT "Backend tests"

if [ $TEST_RESULT -eq 0 ]; then
    BACKEND_TESTS=true
    # Check if any test results exist
    if [ -d "TennisApp.Tests/TestResults" ]; then
        echo "Backend test coverage report generated"
    fi
fi

echo ""

# ===========================================
# FRONTEND BUILD & TEST
# ===========================================
echo -e "${YELLOW}▶ FRONTEND BUILD & TEST${NC}"
echo "-------------------------------------------"

cd "$ROOT_DIR/tennis-app-client"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
    print_status $? "Frontend package installation"
else
    echo "npm packages already installed"
fi

# Run linting
echo "Running linting..."
ng lint 2>/dev/null || true  # Continue even if linting fails

# Build frontend
echo "Building frontend application..."
ng build --configuration=production
print_status $? "Frontend build"
FRONTEND_BUILD=true

# Run frontend tests
echo "Running frontend tests..."
ng test --watch=false --browsers=ChromeHeadless --code-coverage
TEST_RESULT=$?
print_status $TEST_RESULT "Frontend tests"

if [ $TEST_RESULT -eq 0 ]; then
    FRONTEND_TESTS=true
    if [ -d "coverage" ]; then
        echo "Frontend test coverage report generated"
    fi
fi

echo ""

# ===========================================
# E2E TESTS (if Cypress is configured)
# ===========================================
if [ -f "cypress.config.ts" ]; then
    echo -e "${YELLOW}▶ E2E TESTS${NC}"
    echo "-------------------------------------------"
    
    # Start backend in background
    cd "$ROOT_DIR/TennisApp"
    dotnet run --project TennisApp.API &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 10
    
    # Start frontend in background
    cd "$ROOT_DIR/tennis-app-client"
    ng serve &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    sleep 15
    
    # Run E2E tests
    npx cypress run
    E2E_RESULT=$?
    
    # Kill background processes
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    
    print_status $E2E_RESULT "E2E tests"
    echo ""
fi

# ===========================================
# BUILD SUMMARY
# ===========================================
echo "========================================="
echo -e "${YELLOW}BUILD SUMMARY${NC}"
echo "========================================="

# Calculate summary
TOTAL_CHECKS=4
PASSED_CHECKS=0

if [ "$BACKEND_BUILD" = true ]; then
    echo -e "${GREEN}✅ Backend Build: PASSED${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Backend Build: FAILED${NC}"
fi

if [ "$FRONTEND_BUILD" = true ]; then
    echo -e "${GREEN}✅ Frontend Build: PASSED${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Frontend Build: FAILED${NC}"
fi

if [ "$BACKEND_TESTS" = true ]; then
    echo -e "${GREEN}✅ Backend Tests: PASSED${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Backend Tests: FAILED${NC}"
fi

if [ "$FRONTEND_TESTS" = true ]; then
    echo -e "${GREEN}✅ Frontend Tests: PASSED${NC}"
    ((PASSED_CHECKS++))
else
    echo -e "${RED}❌ Frontend Tests: FAILED${NC}"
fi

echo ""
echo "Overall: $PASSED_CHECKS/$TOTAL_CHECKS checks passed"

# ===========================================
# ARTIFACTS
# ===========================================
echo ""
echo "========================================="
echo "BUILD ARTIFACTS"
echo "========================================="
echo "Backend build output: $ROOT_DIR/TennisApp/TennisApp.API/bin/Release/"
echo "Frontend build output: $ROOT_DIR/tennis-app-client/dist/"
echo "Backend test results: $ROOT_DIR/TennisApp/TennisApp.Tests/TestResults/"
echo "Frontend coverage: $ROOT_DIR/tennis-app-client/coverage/"

# Exit with appropriate code
if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo ""
    echo -e "${GREEN}🎉 BUILD SUCCESSFUL - All checks passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  BUILD FAILED - Some checks did not pass${NC}"
    exit 1
fi