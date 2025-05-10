# Task Repository Architecture

The Task Repository is a core component of Task Master that handles all database operations related to tasks. It follows a modular design pattern to maintain clean separation of concerns and keep files under 300 lines for better maintainability.

## Repository Structure

The repository is divided into several specialized repository classes, each with a specific responsibility:

1. **BaseTaskRepository** (`/core/repository/base.ts`)
   - Handles core database operations
   - Provides basic CRUD operations (get, update, remove)
   - Manages database connection

2. **TaskCreationRepository** (`/core/repository/creation.ts`)
   - Handles task creation logic
   - Manages ID generation for hierarchical task structure
   - Handles task ID updates and dependency references

3. **TaskSearchRepository** (`/core/repository/search.ts`)
   - Implements advanced search functionality
   - Provides NLP-based search capabilities
   - Implements "next task" prioritization
   - Handles similarity detection for deduplication

4. **TaskMetadataRepository** (`/core/repository/metadata.ts`)
   - Manages task metadata operations
   - Provides get, set, append, and remove operations for metadata fields

5. **TaskHierarchyRepository** (`/core/repository/hierarchy.ts`)
   - Builds task hierarchies for visualization
   - Handles reordering of tasks after deletion

## Main Repository Class

The `TaskRepository` class (`/core/repository/index.ts`) combines all the specialized repositories into a single, unified interface. It delegates operations to the appropriate specialized repository internally.

```typescript
export class TaskRepository implements 
  Omit<BaseTaskRepository, 'db' | 'sqlite'>,
  Omit<TaskCreationRepository, 'db' | 'sqlite'>,
  Omit<TaskSearchRepository, 'db' | 'sqlite'>,
  Omit<TaskMetadataRepository, 'db' | 'sqlite'>,
  Omit<TaskHierarchyRepository, 'db' | 'sqlite'> {
  
  private baseRepo: BaseTaskRepository;
  private creationRepo: TaskCreationRepository;
  private searchRepo: TaskSearchRepository;
  private metadataRepo: TaskMetadataRepository;
  private hierarchyRepo: TaskHierarchyRepository;
  
  // ...implementation details...
}
```

## Design Benefits

1. **Modularity**: Each repository focuses on a specific aspect of task management
2. **Maintainability**: Files stay under 300 lines for better readability
3. **Testability**: Specialized repositories can be tested independently
4. **Extensibility**: New functionality can be added by creating new specialized repositories

## Future Improvements

- Implement transaction support for operations that affect multiple tasks
- Add error handling and logging strategy
- Implement caching for frequently accessed tasks
- Add monitoring for query performance