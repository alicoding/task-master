#!/bin/bash

# This script runs the fixed test files for the Task Master project
# To use: chmod +x test-fixed-files.sh && ./test-fixed-files.sh

echo "Running fixed test files:"
echo "------------------------"
echo ""

# Run the fixed API test
echo "1. Running API Command tests..."
npm run test -- test/commands/api-fixed.vitest.ts --no-watch

# Run the fixed search repository test
echo ""
echo "2. Running Search Repository tests..."
npm run test -- test/core/search-repository-fixed.vitest.ts --no-watch

echo ""
echo "------------------------"
echo "All fixed tests completed."