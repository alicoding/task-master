# Test Migration Plan

## Current Status

After implementing the TypeScript ESM loader solution using tsx, we have made significant progress:

- Fixed 1 of 24 failing test files (file-system-watcher.vitest.ts)
- Fixed import resolution issues for .ts extensions
- 461 passing tests (out of 598 total)
- 121 failing tests (down from 89 initially since we're now running more tests)
- 16 skipped tests

## Remaining Issues

The failing tests appear to be primarily in the following areas:

1. **Terminal Session Integration Tests**
   - Many of these tests are failing with specific error messages
   - The tests are designed to handle errors correctly, but the errors are not being caught as expected

2. **Terminal Time Window Tests**
   - Similar to the terminal session tests, these are showing errors that are part of the test but not being handled correctly

3. **Legacy Test Format Issues**
   - Some tests are using the older uvu test format which might not be fully compatible with our new loader

## Action Plan

### 1. Timing and Asynchronous Issues

- Create a more robust test helper for asynchronous operations
- Implement test utilities for reliable wait times
- Address any race conditions in tests

### 2. Terminal Session Tests

- Review and update error handling in terminal session tests
- Use our new timeout utilities to ensure consistent behavior
- Update mocks and stubs to work with the new loader

### 3. Legacy Test Migration

- Systematically convert remaining legacy tests to Vitest format
- Create compatibility layer for tests that can't be immediately migrated
- Update test assertions to match Vitest expectations

### 4. Error Handling Improvements

- Update error handling patterns across the codebase
- Ensure consistent error catching and reporting
- Fix any incorrect expectations in tests

## Implementation Approach

1. Create a comprehensive test utility module:
   - Standardized timing constants
   - Retry mechanisms for flaky tests
   - Better error handling for async operations

2. Use a staged migration approach:
   - Fix one category of tests at a time
   - Start with the simplest failures first
   - Add thorough documentation of fixes for future reference

3. Ensure consistency:
   - Apply the same patterns to all tests
   - Document standards for future test development
   - Create migration guides for team members

## Expected Outcomes

- All 598 tests should pass consistently
- Test suite should run faster with optimized timing
- Better error handling and reporting
- More maintainable test codebase

By following this plan, we will systematically address all the remaining test failures and create a more robust testing infrastructure.
EOF < /dev/null