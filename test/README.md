# Task Master Testing Guide

This document explains our testing setup and how to write and run tests.

## Testing Framework: Vitest

We use Vitest as our testing framework because it provides excellent TypeScript integration and supports our ESM module format with `.ts` extensions in imports.

### Running Tests

```bash
# Run all migrated Vitest tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a specific migrated Vitest test file
npm run test:single path/to/test.ts

# Run tests with coverage
npm run test:coverage

# Run legacy uvu tests
npm run test:legacy

# Run a specific legacy uvu test file
npm run test:legacy:single path/to/test.ts

# Run all tests with uvu compatibility layer
npm run test:compat

# Run Vitest tests with the simple configuration
npm run test:simple
```

## Test Structure

- Test files are located in the `test/` directory
- File extension patterns:
  - `*.test.ts` - Legacy uvu tests that are not yet migrated
  - `*.vitest.ts` - Migrated tests using Vitest
  - `resilient-template.vitest.ts` - Template for creating resilient Vitest tests
- Each test file should focus on testing a specific component or feature

## Writing Tests

### Direct Vitest Tests

For new tests, use the Vitest API directly:

```typescript
import { describe, it, expect } from 'vitest';
import { MyComponent } from '../path/to/component.ts';

describe('MyComponent', () => {
  it('does something correctly', () => {
    const component = new MyComponent();
    expect(component.doSomething()).toBe(true);
  });
});
```

### Using Test Helpers

We provide test helpers to make testing easier:

```typescript
import { createTestRepository } from './core/test-helpers.ts';

describe('Repository Tests', () => {
  it('creates a task correctly', async () => {
    const repo = createTestRepository();
    
    const task = await repo.createTask({
      title: 'Test Task',
      status: 'todo',
    });
    
    expect(task.success).toBe(true);
    expect(task.data?.title).toBe('Test Task');
    
    repo.close();
  });
});
```

## Migrating Legacy Tests

We have a migration script to help convert existing uvu tests to Vitest:

```bash
# Migrate a specific test file
npm run test:migrate:file path/to/test.ts

# Migrate all test files
npm run test:migrate
```

The migration creates a `.vitest.test.ts` version of your test that uses our adapter to run with Vitest. This allows for a gradual transition without breaking existing tests.

### Resilient API Pattern Strategy

To handle API changes between older code using direct returns and newer code using the TaskOperationResult pattern, we've adopted a resilient approach:

1. Create tests that can handle both API patterns
2. Use the provided resilient-template.vitest.ts as a starting point
3. Run tests with the unified configuration

Here's an example of how to handle both patterns for task creation:

```typescript
// Handle both direct result and TaskOperationResult patterns
const taskResult = await repo.createTask(taskOptions);
let task: any;

if (taskResult && typeof taskResult === 'object') {
  if ('success' in taskResult) {
    // It's a TaskOperationResult
    expect(taskResult.success).toBeTruthy();
    task = taskResult.data!;
  } else {
    // It's a direct task object from legacy method
    task = taskResult;
  }
}

// Now you can safely use the task variable
expect(task.id).toBeDefined();
expect(task.title).toEqual('Test Task');
```

For array results like search:

```typescript
// Handle both legacy and new return types
let searchByTag: any[] = [];

if (searchByTagResult && typeof searchByTagResult === 'object') {
  if ('success' in searchByTagResult) {
    // It's a TaskOperationResult
    expect(searchByTagResult.success).toBeTruthy();
    searchByTag = searchByTagResult.data || [];
  } else if (Array.isArray(searchByTagResult)) {
    // It's a direct array result from legacy method
    searchByTag = searchByTagResult;
  }
}
```

### Definition of Done for Migrated Tests

A properly migrated test should:

- ✅ Use proper TypeScript imports with `.ts` extensions
- ✅ Include setup and teardown for proper resource cleanup
- ✅ Use Vitest `expect()` assertions
- ✅ Group tests logically in `describe` blocks
- ✅ Handle both TaskOperationResult and legacy direct return patterns
- ✅ Clean up resources (e.g., close database connections)

## TypeScript Module Resolution

Our tests use TypeScript imports with `.ts` extensions:

```typescript
// Correct import with .ts extension
import { Component } from './component.ts';

// Incorrect import (don't use .js)
import { Component } from './component.js';
```

Vitest is configured to handle these TypeScript imports correctly through our configuration.

## Test Coverage

We use Vitest's coverage tools to track test coverage. Run the coverage report with:

```bash
npm run test:coverage
```

This will generate a coverage report in the `coverage/` directory.

## Continuous Integration

Tests run automatically in CI to ensure code quality. Make sure your tests pass locally before pushing!

```bash
npm test
```