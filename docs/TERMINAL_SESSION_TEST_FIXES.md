# Terminal Session Test Fixes

This document outlines a systematic approach to fix terminal session test issues in the Task Master project. It provides a structured methodology to identify and resolve common test failures related to terminal I/O, database interactions, and mocking.

## Test File Structure

### Test Organization

```
/test
├── commands/           # CLI command tests
│   ├── add-command.test.ts
│   ├── api.test.ts
│   ├── metadata-command.test.ts
│   └── ...
├── core/               # Core functionality tests
│   ├── base-repository.test.ts
│   ├── capability-map.test.ts
│   └── ...
└── utils/              # Test utilities
    └── test-helpers.ts # Common test helpers
```

### Test Dependencies

- Most command tests depend on repository functionality
- Repository tests depend on database initialization
- Many tests rely on proper terminal I/O mocking

## Common Test Failures

### "Too Few Parameter Values Provided"

**Root Cause**: Tests aren't properly initializing DrizzleORM or are using outdated schema definitions that don't match the actual database schema.

**Example Error**:
```
Error: Too few parameter values were provided. Expected 5 values, but got 4.
  at Statement.run (/Users/ali/tm/task-master/node_modules/better-sqlite3/lib/statement.js:124:15)
```

### "No Such Table" Errors

**Root Cause**: Tests are running before database initialization completes or the database schema is outdated.

**Example Error**:
```
Error: no such table: tasks
  at Statement.run (/Users/ali/tm/task-master/node_modules/better-sqlite3/lib/statement.js:124:15)
```

### Process.stdout Mocking Issues

**Root Cause**: Inconsistent approaches to mocking stdout/stdin across tests, or failing to restore mocks after tests.

**Example Error**:
```
TypeError: Cannot read properties of undefined (reading 'write')
  at Object.write (test/commands/add-command.test.ts:45:23)
```

### DrizzleORM Interaction Issues

**Root Cause**: Improper transaction handling, race conditions with async operations, or failure to reset database state between tests.

**Example Error**:
```
Error: SQLITE_BUSY: database is locked
  at Database.prepare (/Users/ali/tm/task-master/node_modules/better-sqlite3/lib/database.js:184:24)
```

## Step-by-Step Fix Approach

### 1. Create a Unified Test Setup Helper

```typescript
// /test/utils/test-helpers.ts
import { vi } from 'vitest';
import { createClient } from '../../db/init';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

interface MockConsole {
  mockStdout: () => { restore: () => void, output: string[] };
  mockStdin: (inputs: string[]) => { restore: () => void };
}

interface TestEnvironment {
  db: BetterSQLite3Database;
  console: MockConsole;
  cleanup: () => Promise<void>;
}

export async function setupTestEnvironment(): Promise<TestEnvironment> {
  // Initialize in-memory database
  const db = await createClient(':memory:');
  
  // Mock console functions
  const stdoutOutput: string[] = [];
  const stdoutWrite = process.stdout.write;
  const stdinOn = process.stdin.on;
  
  const mockStdout = () => {
    process.stdout.write = vi.fn((data) => {
      stdoutOutput.push(data.toString());
      return true;
    }) as any;
    
    return {
      restore: () => {
        process.stdout.write = stdoutWrite;
      },
      output: stdoutOutput,
    };
  };
  
  const mockStdin = (inputs: string[]) => {
    let inputIndex = 0;
    
    process.stdin.on = vi.fn((event, callback) => {
      if (event === 'data' && inputIndex < inputs.length) {
        callback(inputs[inputIndex++]);
      }
      return process.stdin;
    }) as any;
    
    return {
      restore: () => {
        process.stdin.on = stdinOn;
      }
    };
  };
  
  // Return test environment
  return {
    db,
    console: {
      mockStdout,
      mockStdin,
    },
    cleanup: async () => {
      // Close database connection
      await db.run({ sql: 'PRAGMA optimize' });
      // Restore console mocks
      process.stdout.write = stdoutWrite;
      process.stdin.on = stdinOn;
    }
  };
}
```

### 2. Create a Database Reset Utility

```typescript
// /test/utils/db-reset.ts
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function resetDatabase(db: BetterSQLite3Database): Promise<void> {
  // Get all tables
  const tables = await db.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  
  // Delete all data from each table
  for (const table of tables) {
    await db.run({ sql: `DELETE FROM ${table.name}` });
  }
  
  // Reset sequences
  await db.run({ sql: 'VACUUM' });
}
```

### 3. Script to Update Test Files

Create a script that can systematically update test files to use the new test utilities:

```typescript
// /scripts/fix-tests.ts
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const fixTestFile = (filePath: string): void => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add imports
  if (!content.includes('setupTestEnvironment')) {
    content = content.replace(
      /import .* from ['"]vitest['"];?/,
      `import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment } from '../utils/test-helpers';`
    );
  }
  
  // Add test setup
  if (!content.includes('setupTestEnvironment')) {
    content = content.replace(
      /describe\(['"](.+)['"]/,
      `describe('$1', () => {
  let testEnv;
  
  beforeEach(async () => {
    testEnv = await setupTestEnvironment();
  });
  
  afterEach(async () => {
    await testEnv.cleanup();
  });`
    );
  }
  
  // Fix console mocking
  content = content.replace(
    /process\.stdout\.write\s*=\s*vi\.fn\(\)/g,
    'const { output } = testEnv.console.mockStdout()'
  );
  
  // Fix stdin mocking
  content = content.replace(
    /process\.stdin\.on\s*=\s*vi\.fn\(\)/g,
    'testEnv.console.mockStdin(["input1", "input2"])'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
};

// Find and fix all test files
const testFiles = glob.sync('test/**/*.test.ts');
testFiles.forEach(fixTestFile);
```

### 4. Example: Converting a Failing Test to a Passing Test

#### Before:

```typescript
// test/commands/add-command.test.ts
import { describe, it, expect, vi } from 'vitest';
import { executeAddCommand } from '../../cli/commands/add';

describe('Add Command', () => {
  it('should add a new task', async () => {
    // Problematic mocking
    const stdoutSpy = vi.spyOn(process.stdout, 'write');
    const stdinOnSpy = vi.spyOn(process.stdin, 'on');
    
    // Direct database access without proper setup
    await executeAddCommand({ 
      title: 'Test task',
      interactive: false
    });
    
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Task added'));
    
    // No cleanup of mocks
    stdoutSpy.mockRestore();
    stdinOnSpy.mockRestore();
  });
});
```

#### After:

```typescript
// test/commands/add-command.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupTestEnvironment } from '../utils/test-helpers';
import { executeAddCommand } from '../../cli/commands/add';

describe('Add Command', () => {
  let testEnv;
  
  beforeEach(async () => {
    testEnv = await setupTestEnvironment();
  });
  
  afterEach(async () => {
    await testEnv.cleanup();
  });

  it('should add a new task', async () => {
    // Proper console mocking
    const { output } = testEnv.console.mockStdout();
    
    // Using the properly initialized database
    await executeAddCommand({ 
      title: 'Test task',
      interactive: false
    });
    
    // Check stdout output
    expect(output.join('')).toContain('Task added');
  });
  
  it('should handle interactive mode', async () => {
    // Mock both stdout and stdin
    const { output } = testEnv.console.mockStdout();
    testEnv.console.mockStdin(['Test interactive task', 'y', 'tag1,tag2', '']);
    
    await executeAddCommand({ interactive: true });
    
    expect(output.join('')).toContain('Task added');
  });
});
```

## Pattern for Updating Each Test File

1. **Import the test helpers**:
   ```typescript
   import { setupTestEnvironment } from '../utils/test-helpers';
   ```

2. **Add standard beforeEach/afterEach hooks**:
   ```typescript
   let testEnv;
  
   beforeEach(async () => {
     testEnv = await setupTestEnvironment();
   });
  
   afterEach(async () => {
     await testEnv.cleanup();
   });
   ```

3. **Replace direct console mocking**:
   ```typescript
   // Replace this:
   const stdoutSpy = vi.spyOn(process.stdout, 'write');
   
   // With this:
   const { output } = testEnv.console.mockStdout();
   ```

4. **Replace direct stdin mocking**:
   ```typescript
   // Replace this:
   process.stdin.on = vi.fn((event, callback) => {
     if (event === 'data') callback('user input');
     return process.stdin;
   });
   
   // With this:
   testEnv.console.mockStdin(['user input']);
   ```

5. **Use testEnv.db for database operations**:
   ```typescript
   const result = await testEnv.db.query...
   ```

## Available Utility Functions

| Function | Purpose |
|----------|---------|
| `setupTestEnvironment()` | Creates an isolated test environment with in-memory DB and console mocking |
| `testEnv.console.mockStdout()` | Mocks process.stdout and captures output |
| `testEnv.console.mockStdin(inputs)` | Mocks process.stdin with predefined inputs |
| `testEnv.cleanup()` | Cleans up all mocks and database connections |
| `resetDatabase(db)` | Clears all tables in the database |

## Implementation Strategy

1. Create the test helper utilities first
2. Update one test file manually as a proof of concept
3. Run the script to update remaining test files
4. Run tests and address any remaining issues
5. Document specific edge cases that required manual intervention

By following this systematic approach, we can efficiently fix all terminal session test issues while ensuring consistent test patterns across the codebase.