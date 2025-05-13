#!/bin/bash

# This script runs the fixed test files for Task Master
echo "Running fixed test files..."
echo ""

# Fixed Tests List
FIXED_TESTS=(
  "test/commands/api-fixed.vitest.ts"
  "test/core/search-repository-fixed.vitest.ts"
  "test/core/terminal-session-factory-basic.vitest.ts"
  "test/core/file-change-analyzer-fixed.vitest.ts"
)

# Run each fixed test
for test_file in "${FIXED_TESTS[@]}"; do
  echo "Running $test_file"
  npx vitest run "$test_file" --no-watch
  echo ""
done

echo "All fixed tests completed."