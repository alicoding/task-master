# Vitest Migration Guide

This document outlines how to migrate tests from uvu to Vitest in the Task Master project.

## Overview

Task Master now uses Vitest as its testing framework, replacing the custom testing setup with uvu. This migration provides:

- Better TypeScript integration
- Improved test discovery and running
- Watch mode and coverage reporting
- Parallel test execution
- Enhanced test reporting

## Migration Steps

### 1. Setup

Vitest is already configured in the project with:

- `vitest.simple.config.ts` - Main configuration file
- `test/template.vitest.ts` - Template for new Vitest tests

### 2. Converting Existing Tests

Use the migration script to convert uvu tests to Vitest format:

```bash
# Convert all tests
npm run test:migrate

# Convert a specific test file
npm run test:migrate:file test/path/to/file.test.ts
```

The migration script performs the following transformations:

1. Converts uvu imports to Vitest imports
2. Wraps test code in describe() and it() blocks
3. Converts assert.* assertions to expect().*
4. Makes tests more resilient to API changes
5. Adds TypeScript .ts extensions to imports
6. Adds Definition of Done comments

### 3. Test Patterns

#### Before (uvu)

```typescript
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { someFunction } from '../src/module.js';

test('test description', async () => {
  const result = await someFunction();
  assert.equal(result, expectedValue);
});

test.run();
```

#### After (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { someFunction } from '../src/module.ts';

describe('Test Group', () => {
  it('test description', async () => {
    const result = await someFunction();
    expect(result).toEqual(expectedValue);
  });
});
```

### 4. Running Tests

Use the updated npm scripts to run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a specific test file
npm run test:single test/path/to/file.ts

# Generate coverage report
npm run test:coverage
```

### 5. Creating New Tests

When creating new tests:

1. Use the template file `test/template.vitest.ts` as a reference
2. Follow TypeScript-only import patterns with .ts extensions
3. Use beforeEach/afterEach for setup and teardown
4. Group related tests in describe blocks
5. Use it() for individual test cases
6. Include Definition of Done comments

### 6. Migration Best Practices

1. **TypeScript Imports**: Always use .ts extensions in imports
2. **Resilient Assertions**: Make assertions resilient to API changes
3. **Resource Cleanup**: Ensure proper test cleanup in afterEach or try/finally
4. **Test Isolation**: Create fresh test data for each test
5. **Clear Test Names**: Use descriptive names for test cases

## Available Assertion Patterns

| uvu | Vitest |
|-----|--------|
| `assert.equal(actual, expected)` | `expect(actual).toEqual(expected)` |
| `assert.is(actual, expected)` | `expect(actual).toBe(expected)` |
| `assert.ok(value)` | `expect(value).toBeTruthy()` |
| `assert.not.ok(value)` | `expect(value).toBeFalsy()` |
| `assert.instance(value, Type)` | `expect(value).toBeInstanceOf(Type)` |
| `assert.type(value, 'type')` | `expect(typeof value).toBe('type')` |
| `assert.snapshot(actual, expected)` | `expect(actual).toEqual(expected)` |
| `assert.match(actual, expected)` | `expect(actual).toMatchObject(expected)` |
| `assert.throws(fn)` | `expect(fn).toThrow()` |

## Definition of Done for Tests

All tests should:

✅ Use proper TypeScript imports with .ts extensions  
✅ Include setup and teardown for proper resource cleanup  
✅ Use Vitest expect() syntax for assertions  
✅ Group tests logically in describe blocks  
✅ Clean up resources properly (e.g., close database connections)  

## Migration Tools

Task Master provides several tools to help with the migration from uvu to Vitest:

### 1. Analyze Test Coverage

Run the analysis script to get a complete picture of test migration status:

```bash
npm run test:analyze
```

This generates a `TEST_MIGRATION_PLAN.md` file with:
- Migration progress statistics
- Lists of files that need to be converted
- Recommendations for migration

### 2. Interactive Migration

Use the interactive migration tool to select which test files to migrate:

```bash
npm run test:migrate:interactive
```

This displays a menu of test files grouped by directory and allows you to select which files to migrate one by one.

### 3. Batch Migration

To migrate all tests at once:

```bash
npm run test:migrate:all
```

Options:
- `npm run test:migrate:all:dry` - Dry run (no files modified)
- `npm run test:migrate:all:skip-tests` - Skip running tests after migration
- `npm run test:migrate:all:verbose` - Show detailed output

### 4. Single File Migration

To migrate a specific test file:

```bash
npm run test:migrate:file test/path/to/file.test.ts
```

## Troubleshooting

If you encounter issues during migration:

1. **Module Resolution Issues**: Ensure NODE_OPTIONS=--experimental-specifier-resolution=node is set
2. **Test Not Found**: Check file pattern matching in vitest.simple.config.ts
3. **API Changes**: Update tests to be resilient to API result structures
4. **Database Connection Issues**: Ensure proper cleanup in afterEach hooks