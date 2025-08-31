#!/bin/bash

# Quick test script for rapid feedback during development
set -e

echo "Running quick build and test..."

# Backend quick check
echo "Backend build check..."
cd ../TennisApp
dotnet build --no-restore

# Frontend quick check  
echo "Frontend build check..."
cd ../tennis-app-client
ng build --configuration=development

echo "✅ Quick build check passed!"