# Repository Migration Guide

This document outlines the changes made to the TaskRepository system and provides guidance for migrating to the new architecture.

## Changes Implemented

1. **Repository Factory Pattern**
   - Created `RepositoryFactory` to manage database connections
   - Ensures all specialized repositories share a single connection
   - Located in `core/repository/factory.ts`

2. **Specialized Repository Updates**
   - Modified all repositories to accept database connections
   - Updated constructor signatures to handle different initialization patterns
   - Added better error handling for database operations

3. **Legacy Mode**
   - Added backward compatibility through legacy mode
   - Enabled by default to ensure tests continue to pass
   - Configuration through constructor or environment variable

4. **Connection Management**
   - Improved connection cleanup with better error handling
   - Factory manages shared connection lifecycle
   - Repository close methods respect shared connections

## Migration Plan

### Phase 1: Current Implementation (Backward Compatible)

- Legacy mode enabled by default
- Tests pass with current expectations
- New code can opt into the new pattern explicitly

### Phase 2: Gradual Migration

1. Update all command files to use the new pattern:
   ```typescript
   // New pattern (shared connection)
   const repo = new TaskRepository('./db/taskmaster.db', false, false);
   ```

2. Update tests to work with the new architecture:
   - Update test expectations for connection behavior
   - Replace direct DB access with repository methods

3. Enable modern mode by default in non-test environments:
   ```typescript
   // In your environment setup
   process.env.USE_MODERN_REPO_MODE = 'true';
   ```

### Phase 3: Full Migration

1. Remove legacy mode completely
2. Make the factory pattern the only supported implementation
3. Refactor specialized repositories to only work with injected connections

## Using the New Pattern

### Creating Repositories with Shared Connection

```typescript
// Initialize with factory (recommended)
const repo = new TaskRepository('./db/taskmaster.db', false, false);

// All specialized repositories will share a connection
const { db, sqlite } = RepositoryFactory.initialize('./db/taskmaster.db');
const baseRepo = new BaseTaskRepository(db, sqlite);
const searchRepo = new TaskSearchRepository(db, sqlite);
```

### Using Legacy Mode (For Backwards Compatibility)

```typescript
// Explicitly use legacy mode (each repo gets its own connection)
const repo = new TaskRepository('./db/taskmaster.db', false, true);
```

## Best Practices

1. Always close the main repository when done
   ```typescript
   const repo = new TaskRepository();
   try {
     // Use the repository
   } finally {
     repo.close(); // Handles connections properly
   }
   ```

2. Prefer using the main TaskRepository for most use cases
3. Only use specialized repositories directly for advanced use cases
4. When using multiple specialized repositories, get them through the factory

## Technical Details

### RepositoryFactory

The repository factory manages the database connection lifecycle:

```typescript
// Initialize once
const { db, sqlite } = RepositoryFactory.initialize('./db/taskmaster.db');

// Get the connection elsewhere
const connection = RepositoryFactory.getConnection();

// Reset and close connection
RepositoryFactory.reset();
```

### Connection Handling

The base repository supports three initialization patterns:

1. No parameters: Use factory or default connection
2. DB objects: Use provided connection objects
3. Path and memory flag: Create a new connection

This flexibility allows for different use cases while maintaining consistency.