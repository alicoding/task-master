# Refactoring Fix Plan

This document outlines the plan to fix issues introduced by the recent refactoring of the TaskRepository class and API command structure.

## Issues Identified

1. **Database Connection Management**
   - Multiple database connections are created for each specialized repository
   - This causes tests to fail as operations span multiple connections

2. **Method Delegation**
   - Some methods may not be correctly delegated to the specialized repositories
   - Parameters might not be passed correctly between repositories

3. **Test Compatibility**
   - Tests are written for the original monolithic TaskRepository
   - They need to be updated to work with the new modular architecture

## Fix Strategy

### 1. Repository Factory

Create a repository factory to ensure all specialized repositories share the same database connection:

```typescript
class RepositoryFactory {
  private static db;
  private static sqlite;
  
  static initialize(dbPath: string, inMemory: boolean) {
    const connection = createDb(dbPath, inMemory);
    this.db = connection.db;
    this.sqlite = connection.sqlite;
    return { db: this.db, sqlite: this.sqlite };
  }
  
  static getBaseRepo() {
    return new BaseTaskRepository(this.db, this.sqlite);
  }
  
  static getCreationRepo() {
    return new TaskCreationRepository(this.db, this.sqlite);
  }
  
  // ...other factory methods...
}
```

### 2. Update TaskRepository Implementation

Modify the TaskRepository class to use the factory:

```typescript
export class TaskRepository {
  private baseRepo: BaseTaskRepository;
  private creationRepo: TaskCreationRepository;
  // ...other repos...
  
  constructor(dbPath: string = './db/taskmaster.db', inMemory: boolean = false) {
    const { db, sqlite } = RepositoryFactory.initialize(dbPath, inMemory);
    this.baseRepo = RepositoryFactory.getBaseRepo();
    this.creationRepo = RepositoryFactory.getCreationRepo();
    // ...initialize other repos...
  }
  
  // Method implementations remain the same
}
```

### 3. Modify Specialized Repositories

Update specialized repositories to accept db and sqlite instances directly:

```typescript
export class BaseTaskRepository {
  protected db;
  protected sqlite;
  
  constructor(db?, sqlite?) {
    if (!db || !sqlite) {
      const connection = createDb('./db/taskmaster.db', false);
      this.db = connection.db;
      this.sqlite = connection.sqlite;
    } else {
      this.db = db;
      this.sqlite = sqlite;
    }
  }
  
  // ...rest of implementation...
}
```

### 4. Create a Legacy Mode

Add an option to revert to the original monolithic implementation for backward compatibility:

```typescript
export class TaskRepository {
  private legacyMode: boolean;
  private originalRepo: OriginalTaskRepository;
  
  constructor(dbPath: string = './db/taskmaster.db', inMemory: boolean = false, legacyMode: boolean = false) {
    this.legacyMode = legacyMode;
    
    if (legacyMode) {
      this.originalRepo = new OriginalTaskRepository(dbPath, inMemory);
    } else {
      // Initialize modular repositories
    }
  }
  
  // Method delegation with fallback to legacy mode
  getTask(id: string) {
    if (this.legacyMode) {
      return this.originalRepo.getTask(id);
    }
    return this.baseRepo.getTask(id);
  }
  
  // ...other methods...
}
```

## Implementation Plan

1. Create a backup of the original repository implementation
2. Implement the repository factory pattern
3. Update specialized repositories to support connection sharing
4. Add legacy mode for backward compatibility
5. Run tests with legacy mode enabled to verify backward compatibility
6. Fix any remaining issues in specialized repositories
7. Update tests to work with the new architecture
8. Gradually migrate commands to use the new architecture

## Timeline

- Day 1: Implement repository factory and connection sharing
- Day 2: Add legacy mode and fix immediate test issues 
- Day 3: Update specialized repositories and fix delegation issues
- Day 4: Update tests for the new architecture
- Day 5: Complete refactoring and verify all tests pass

## Success Criteria

- All tests pass with the new architecture
- No regression in functionality
- Code remains modular and maintainable
- Files stay under the 300-line limit