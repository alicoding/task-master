# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Commands
- Build: `npm run build` - Compiles TypeScript to JavaScript
- Dev: `npm run dev -- [command]` - Runs the CLI with live TS compilation
- Test: `npm run test` - Runs all tests
- Single test: `npm run test test/core/repo.test.ts` - Run specific test file
- Database: 
  - Init: `npm run db:init` - Initialize database
  - Migrate: `npm run db:migrate` - Apply migrations

## Task Tracking - Dogfooding
- Use Task Master to track implementation work: `npm run dev -- add "Task description"`
- Update task status as you make progress: `npm run dev -- update --id <task-id> --status in-progress`
- Mark tasks complete when done: `npm run dev -- update --id <task-id> --status done`
- Show current tasks: `npm run dev -- show`
- Check task graph: `npm run dev -- show --graph`
- Associate code files with tasks as you work on them: `npm run dev -- daemon associate <task-id> <file-path>`
- Before marking a task complete, verify the Definition of Done requirements

## Code Style Guidelines
- IMPORTANT: Use TypeScript-only implementation with `.ts` extension in imports (e.g., `import { x } from './y.ts'`)
- NEVER use `.js` extensions in import statements
- TypeScript with strict typing - define interfaces in core/types.ts
- Use async/await with try/catch for error handling
- Command pattern: each CLI command has its own module in cli/commands/
- Functions: camelCase, Classes: PascalCase
- Types: union types for bounded options (e.g., `type Status = 'todo' | 'in-progress'`)
- Database access through repository pattern
- CLI commands handle outputs and user interaction

## Definition of Done
- All imports verified against their source modules using `.ts` extensions
- TypeScript-only patterns followed throughout implementation
- CLI commands run without errors after implementation
- No regression in existing functionality
- Code tested with example use cases
- Task-Code relationships captured using Task Master daemon
- Implementation verified against all requirements before marking task complete

## Work Log

### 2024-05-11: Test Coverage Improvements

Completed the following test coverage improvements:

1. Graph module (increased from 28.93% to 49.36%):
   - Created tests for core util functions in `graph/utils.ts` (100% coverage)
   - Added tests for graph traversal and hierarchy building
   - Implemented tests for DOT and Mermaid formatters

2. Formatters (increased from 18.71% to 26.62%):
   - Added tests for JSON formatter
   - Improved tests for DOT and Mermaid formatters
   - Added tests for UI config functionality (100% coverage)

3. Repository module:
   - Created tests for Repository Factory
   - Added tests for core functionality of repositories

4. NLP utils (increased from 30% to 100%):
   - Implemented tests for distance.ts (Levenshtein, fuzzy matching)
   - Added tests for stemming.ts
   - Added comprehensive tests for tokenization.ts
   - Implemented tests for synonyms.ts

### 2024-05-11: Documentation Improvements

Added comprehensive JSDoc documentation to the following modules:

1. Graph module:
   - Enhanced documentation in `graph/index.ts` with detailed method descriptions
   - Added comprehensive JSDoc to `graph/utils.ts` with examples and edge cases

2. NLP utils:
   - Added detailed module-level documentation to all NLP utility files
   - Enhanced function documentation for:
     - `tokenization.ts`: Added examples and detailed descriptions for all functions
     - `stemming.ts`: Added comprehensive documentation with examples for stemming algorithms
     - `synonyms.ts`: Enhanced documentation for the synonym map and expansion functions
   - Added @example annotations with expected outputs
   - Included detailed descriptions of algorithm behavior and edge cases

### 2024-05-11: Integration Test Improvements

Created comprehensive integration tests for CLI commands:

1. Added Vitest-based integration tests for core CLI commands:
   - `update-command.vitest.ts`: Tests for task updating functionality
   - `search-command.vitest.ts`: Tests for task search and filtering
   - `next-command.vitest.ts`: Tests for next task recommendation

2. Test coverage highlights:
   - Command option handling for all parameters
   - JSON and text output formats
   - Error handling and edge cases
   - Complex filtering and sorting operations
   - Natural language processing integration
   - Dry run functionality
   - Metadata handling

3. Testing approach:
   - Used Vitest for consistent testing framework
   - Created isolated test environments with in-memory databases
   - Used mock data generation for reproducible tests
   - Applied spy techniques for verifying console output
   - Added comprehensive assertions for behavior verification

4. Updated Vitest configuration to properly include new test files

### 2024-05-11: Error Handling Test Improvements

Added comprehensive error handling tests for core modules:

1. Repository error handling (`error-handling.vitest.ts`):
   - Task CRUD operation error handling
   - Input validation error handling
   - Database error handling
   - Not found condition handling
   - Metadata validation errors

2. API error handling (`api-error-handling.vitest.ts`):
   - API service error propagation
   - API router HTTP status code mapping
   - Invalid request handling
   - Invalid endpoint handling
   - Unexpected error recovery

3. NLP error handling (`nlp-error-handling.vitest.ts`):
   - NLP service input validation
   - Distance calculation edge cases
   - Stemming function robustness
   - Tokenization error handling
   - Synonym function input validation

4. Testing approach:
   - Isolated component testing
   - Targeted error injection
   - Mock component failures
   - Edge case handling
   - Null/undefined handling
   - Error propagation verification
   - API contract validation

### 2024-05-11: Database Optimization Improvements

Implemented extensive database performance optimizations:

1. Caching Layer (`optimized-operations.ts`):
   - Added in-memory cache with TTL for frequently accessed data
   - Implemented optimized batch operations for multi-item transactions
   - Created cache key management for effective invalidation
   - Added prefix-based cache clearing for related items

2. Enhanced Repository (`enhanced.ts`):
   - Created optimized repository implementation with transparent caching
   - Added efficient task retrieval with cache hit optimization
   - Implemented intelligent cache invalidation on updates and deletions
   - Added optimized bulk operations for reduced transaction overhead

3. Repository Factory Enhancement:
   - Updated factory to support optimized repository creation
   - Added environment variable control for optimization toggling
   - Maintained backward compatibility with legacy mode
   - Created smooth transition path to optimized implementation

4. Performance Improvements:
   - Reduced database queries for repeated operations
   - Eliminated N+1 query patterns in related data access
   - Improved response time for common operations like task listing
   - Added optimized search queries with cached results
   - Implemented single-query batch operations

5. Added comprehensive tests for optimized database operations:
   - Cache behavior verification
   - Cache invalidation testing
   - Data consistency checks
   - Performance improvement validation
   - TTL expiration validation

### 2024-05-11: Developer Documentation Improvements

Enhanced developer documentation with comprehensive guides:

1. Created `DATABASE_OPTIMIZATION.md`:
   - Detailed explanation of caching strategy and implementation
   - Documentation of performance improvements and architecture
   - Configuration and usage guidelines for optimization features
   - Integration patterns and best practices

2. Created `ERROR_HANDLING.md`:
   - Comprehensive guide to error handling patterns
   - Error types and propagation documentation
   - Best practices for checking and handling errors
   - Repository, API, and CLI error handling patterns

3. Updated main `DEVELOPER_DOCS.md`:
   - Enhanced table of contents with detailed subsections
   - Added error handling section with code examples
   - Updated repository pattern documentation with optimization details
   - Improved code examples and references

4. Documentation Architecture:
   - Main developer guide with high-level overview
   - Specialized topic guides for detailed functionality
   - Cross-references between documents for navigation
   - Code examples for practical implementation

### 2024-05-11: Code Refactoring Improvements

Refactored complex functions to improve code maintainability:

1. Search command refactoring:
   - Split monolithic action function into smaller, focused functions
   - Created `search-handler.ts` for the main search logic
   - Created `color-utils.ts` for color management
   - Applied single responsibility principle to each function
   - Added stronger typing for better type safety

2. Code organization improvements:
   - Applied module extraction pattern
   - Created focused utility modules
   - Applied clear function boundaries
   - Added detailed JSDoc comments for each function
   - Improved error handling with proper try/catch blocks

3. Design improvements:
   - Applied dependency injection for testing
   - Added function composition for complex operations
   - Created clear interfaces for function parameters
   - Simplified complex conditional logic
   - Improved overall code readability

4. Benefits:
   - Enhanced maintainability with smaller, focused functions
   - Improved testability through better separation of concerns
   - Clearer function responsibilities and interfaces
   - Better error handling and recovery
   - Reduced cognitive load when understanding the codebase

Next steps:
- Profile and optimize NLP processing
- Fix TypeScript compiler warnings