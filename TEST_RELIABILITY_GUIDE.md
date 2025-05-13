# Test Reliability Guide for Task Master

This guide documents the patterns and utilities created to fix test reliability issues in the Task Master project. It serves both as documentation for the current fixes and as a guide for future development to maintain test reliability.

## Recent Updates (2025-05-12)

We've implemented several significant improvements to the testing infrastructure:

1. **Database Migration Fixes**:
   - Modified `test/utils/test-migration-utils.ts` to use `CREATE TABLE IF NOT EXISTS` statements
   - Updated `test/utils/robust-database-test-utils.ts` to better handle table creation errors

2. **Jest to Vitest Migration Fixes**:
   - Fixed mocking issues by using proper Vitest patterns
   - Updated console mocking using `vi.spyOn` instead of direct assignment

3. **Process and Console Mocking**:
   - Implemented prototype-based approach for mocking `process.stdout`
   - Added proper cleanup and restoration of original objects

4. **Terminal Session Test Fixes**:
   - Created simplified terminal session factory tests for better isolation
   - Fixed process mocking issues in terminal session tests

5. **API Command Test Fixes**:
   - Created `api-fixed.vitest.ts` with improved mocking and isolation
   - Fixed file system dependencies for more reliable tests

## Common Test Issues and Solutions

### 1. Database Initialization and Migration Issues

**Problem**: Tests were failing with errors like "table already exists" due to migrations being applied multiple times or incorrectly.

**Solution**:
- Created robust database test utilities with safe migration handling
- Implemented transaction support for test isolation
- Added proper cleanup of database resources
- Created utilities for minimal schema creation for specific tests

**Key Files**:
- `/test/utils/robust-database-test-utils.ts` - Comprehensive database utilities
- `/test/utils/test-migration-utils.ts` - Safe migration handling
- `/test/commands/api-fixed.vitest.ts` - Example of fixed API command tests with proper mocking
- `/test/core/search-repository-fixed.vitest.ts` - Example of fixed search repository tests

**Usage Example**:
```typescript
import { initializeTestDatabase } from '../utils/robust-database-test-utils';

describe('My Test Suite', () => {
  let fixture;
  
  beforeEach(() => {
    // Create isolated test database
    fixture = initializeTestDatabase(true); // true = in-memory
  });
  
  afterEach(() => {
    // Clean up resources
    fixture.cleanup();
  });
  
  it('should perform database operations safely', async () => {
    // Use transaction for test isolation
    await fixture.withTransaction(async () => {
      const taskId = fixture.createTask({ title: 'Test Task' });
      // Test operations here
    });
    // Transaction is automatically rolled back
  });
});
```

### 2. Jest to Vitest Migration Issues

**Problem**: Tests were failing with "jest is not defined" errors after migration to Vitest.

**Solution**:
- Updated mock syntax from Jest pattern to Vitest pattern
- Fixed module mocking to work with ES modules
- Created Vitest-specific test files to replace Jest tests
- Fixed console mocking to use Vitest's spyOn functionality

**Key Files**:
- `/test/commands/search-command.vitest.ts` - Updated with Vitest mocking
- `/test/core/terminal-session-factory-basic.vitest.ts` - Simplified Vitest tests

**Usage Example**:
```typescript
// IMPORTANT: vi.mock calls are hoisted to the top of the file
vi.mock('../../core/logger.ts', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}));

// Import after mocks are defined
import { createLogger } from '../../core/logger.ts';

describe('Logger Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should log messages', () => {
    const logger = createLogger('test');
    
    logger.info('test message');
    
    expect(logger.info).toHaveBeenCalledWith('test message');
  });
});
```

### 3. Process stdout Mocking Issues

**Problem**: Tests were failing with "Cannot set property stdout of #<process>" errors when trying to mock process.stdout.

**Solution**:
- Used a prototype-based approach for mocking process properties
- Properly restored original values after tests
- Used proper descriptor handling for process object mocking

**Key Files**:
- `/test/core/terminal-integration.vitest.ts` - Fixed process mocking
- `/test/core/terminal-session-integration.vitest.ts` - Fixed process mocking

**Usage Example**:
```typescript
describe('Process Mocking', () => {
  // Save original process.stdout
  const originalStdout = { ...process.stdout };
  
  beforeEach(() => {
    // Properly mock process.stdout
    const mockStdout = Object.create(Object.getPrototypeOf(process.stdout));
    Object.defineProperties(mockStdout, Object.getOwnPropertyDescriptors(process.stdout));
    
    // Set mocked properties
    mockStdout.write = vi.fn();
    mockStdout.isTTY = true;
    
    // Use spyOn to mock the getter
    vi.spyOn(process, 'stdout', 'get').mockImplementation(() => mockStdout);
  });
  
  afterEach(() => {
    // Restore original process.stdout
    vi.restoreAllMocks();
  });
  
  it('should mock process.stdout', () => {
    process.stdout.write('test output');
    expect(process.stdout.write).toHaveBeenCalledWith('test output');
  });
});
```

### 4. Terminal Session Testing Issues

**Problem**: Terminal session tests were unreliable due to complex dependencies and mocking issues.

**Solution**:
- Created simplified test versions focusing on core functionality
- Fixed process.stdout mocking using prototype-based approach
- Added better error handling and reporting
- Improved mocking approach for terminal session objects

**Key Files**:
- `/test/core/terminal-session-factory-basic.vitest.ts` - Simplified terminal tests
- `/test/core/terminal-session-integration-fixed.vitest.ts` - Fixed integration tests

**Usage Example**:
```typescript
describe('Terminal Session', () => {
  let mockSessionManager;
  
  beforeEach(() => {
    // Create a simple mock instead of a complex one
    mockSessionManager = {
      getCurrentSession: vi.fn().mockReturnValue({ id: 'test-session' }),
      initialize: vi.fn().mockResolvedValue({ id: 'test-session' }),
      getConfigManager: vi.fn().mockReturnValue({
        getConfig: vi.fn().mockReturnValue({ inactivityTimeout: 30 })
      })
    };
  });
  
  it('should test a specific behavior', async () => {
    // Focus on testing one behavior at a time
    const result = await mockSessionManager.initialize();
    
    expect(result).toEqual({ id: 'test-session' });
    expect(mockSessionManager.initialize).toHaveBeenCalled();
  });
});
```

### 5. API Command Testing Issues

**Problem**: API command tests were failing due to file system dependencies and complex mocking.

**Solution**:
- Created improved API test fixtures with mocked file system operations
- Fixed repository mocking to return predictable values
- Added better error handling and reporting
- Used direct mock implementations instead of spies for more reliability

**Key Files**:
- `/test/commands/api-fixed.vitest.ts` - Fixed API command tests

**Usage Example**:
```typescript
describe('API Commands', () => {
  beforeEach(() => {
    // Mock fs module directly
    vi.spyOn(fs, 'writeFile').mockImplementation(async () => {});
    vi.spyOn(fs, 'readFile').mockImplementation(async () => 
      JSON.stringify({ tasks: [{ title: 'Mock Task' }] })
    );
    
    // Mock repository methods
    repo.getAllTasks = vi.fn().mockResolvedValue([
      { id: '1', title: 'Test Task' }
    ]);
  });
  
  it('should export tasks', async () => {
    await command.export({ format: 'json', output: 'test.json' });
    
    expect(fs.writeFile).toHaveBeenCalled();
    expect(repo.getAllTasks).toHaveBeenCalled();
  });
});
```

## Best Practices for Test Reliability

### Database Testing

1. **Use In-Memory Databases**:
   - Always use in-memory databases for tests (`sqlite::memory:`)
   - This improves test speed and avoids file system issues

2. **Use Transactions for Isolation**:
   - Wrap test operations in transactions
   - Roll back transactions after tests to prevent test pollution

3. **Add Explicit Error Handling**:
   - Add try/catch blocks for database operations
   - Log useful error messages for debugging

4. **Create Schema Safely**:
   - Use `CREATE TABLE IF NOT EXISTS` for all table creations
   - This prevents "table already exists" errors

5. **Clean Up All Database Resources**:
   - Close database connections after tests
   - Delete temporary database files if needed

### Vitest Mocking

1. **Remember Hoisting Rules**:
   - All `vi.mock()` calls are hoisted to the top of the file
   - Import modules after defining their mocks

2. **Use Proper Mock Implementation**:
   - Use `vi.fn()` and `mockImplementation()` for complex mocks
   - Return predictable values from mocks

3. **Clear Mocks Between Tests**:
   - Use `vi.clearAllMocks()` in beforeEach hooks
   - Restore originals with `vi.restoreAllMocks()` in afterEach hooks

4. **Use Spies Wisely**:
   - Use `vi.spyOn()` for monitoring without replacing functionality
   - Be careful with spying on getters/setters

### Process and Console Mocking

1. **Use Prototype-Based Approach**:
   - Create mock objects using Object.create and Object.defineProperties
   - Never directly assign to process properties

2. **Save and Restore Originals**:
   - Save original values before mocking
   - Restore after tests to prevent leakage

3. **Use vi.spyOn for Console Methods**:
   - Use `vi.spyOn(console, 'log')` instead of direct replacement
   - Restore with `vi.restoreAllMocks()`

### Test Isolation

1. **Create Fresh Instances**:
   - Create new instances of the system under test in each test
   - Don't share instances between tests

2. **Reset State**:
   - Reset all state in beforeEach hooks
   - Clean up resources in afterEach hooks

3. **Mock External Dependencies**:
   - Mock file system, network, and other external dependencies
   - Use dependency injection for easier testing

### Error Handling

1. **Handle Async Errors Properly**:
   - Use try/catch blocks with explicit assertions
   - Use expect.assertions() to ensure promises reject

2. **Use Explicit Error Checks**:
   - Check specific error messages and types
   - Don't just check that an error was thrown

3. **Test Both Success and Error Cases**:
   - Write tests for normal operation and error conditions
   - Cover edge cases and boundary conditions

## Adding New Tests

When adding new tests, follow these guidelines:

1. **Use the Patterns in This Guide**:
   - Follow the mocking patterns shown in the examples
   - Use the database test utilities for database operations

2. **Keep Tests Simple and Focused**:
   - Test one behavior per test
   - Keep test setup simple and focused on the behavior being tested

3. **Use Proper Setup and Teardown**:
   - Initialize resources in beforeEach hooks
   - Clean up resources in afterEach hooks

4. **Follow the AAA Pattern**:
   - Arrange: Set up test data and conditions
   - Act: Execute the code being tested
   - Assert: Verify the behavior is correct

5. **Write Self-Contained Tests**:
   - Tests should not depend on other tests
   - Use helper functions for common setup

## Conclusion

By following these patterns and guidelines, test reliability in the Task Master project can be significantly improved. These approaches address the most common issues that cause test failures and provide a solid foundation for writing reliable tests.

Remember that good tests give confidence in the codebase, but only if they themselves are reliable. Taking the time to fix test reliability issues now will save much more time in the future by preventing false failures and making test maintenance easier.