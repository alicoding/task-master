# CLAUDE.md

This file provides essential guidance for Claude Code when working with the Task Master CLI project.

## CRITICAL PROJECT REQUIREMENTS

- **YOU MUST USE TypeScript-only implementation with `.ts` extensions in all imports**
- **NEVER use `.js` extensions in any import statements** 
- **All code must maintain strict type safety throughout the codebase**
- **Use ESM module system exclusively**

## Project Structure

- Core functionality in `src/core/`
- CLI commands in `src/cli/commands/`
- Repository pattern for database access
- Task graph implementation in `src/graph/`
- NLP utilities in `src/nlp/`
- API endpoints in `src/api/`

## Project Commands
- Build: `npm run build` - Compiles TypeScript to JavaScript
- Dev: `npm run dev -- [command]` - Runs the CLI with live TS compilation
- Test: `npm run test` - Runs all tests (uses Vitest)
- Single test: `npm run test test/core/repo.test.ts` - Run specific test file
- Database operations: 
  - Init: `npm run db:init` - Initialize SQLite database
  - Migrate: `npm run db:migrate` - Apply migrations

## Task Master Features
- Task graph with parent-child relationships backed by SQLite
- Task-code relationship tracking through daemon
- Hierarchical task structures
- Status tracking and integrated analysis
- Definition of Done (DoD) system for quality control
- Vitest test framework (recently migrated from custom scripts)

## Project Code Patterns

### Architecture
- **Command pattern**: Each CLI command has its own module in `cli/commands/`
- **Repository pattern**: Database access abstracted through repositories
- **Task graph**: Task relationships represented as a directed graph
- **Observer pattern**: Daemon watches file changes for task-code relationships

### Coding Standards
- **Naming**: Functions use camelCase, Classes use PascalCase
- **Types**: Define interfaces in `core/types.ts`, use union types for bounded options
- **Error handling**: Use async/await with try/catch
- **Testing**: Vitest-based testing with isolation for CI/CD integration

## Definition of Done Checklist

### Code Quality Requirements
1. All imports MUST use `.ts` extensions (never `.js`)
2. All code MUST follow TypeScript-only patterns with proper type safety
3. All modules MUST use ESM syntax (no CommonJS require statements)
4. No TypeScript `any` type unless absolutely necessary with documented reason
5. Functions and methods MUST include JSDoc comments with descriptions and param annotations
6. **VERIFY all import/export names exactly match module definitions**
7. **TEST all module imports work by running the command before committing**

### Testing Requirements
8. Test coverage MUST be maintained or increased with each change
9. Each new feature MUST be developed using Test-Driven Development (TDD):
   - Write tests first to define expected behavior
   - Implement the minimum code required to pass tests
   - Refactor while maintaining test coverage
10. All tests MUST pass with `npm test` command
11. Test descriptions MUST accurately describe what they're verifying
12. Tests MUST be isolated and not depend on external state
13. **INCLUDE module import validation tests for all new components**

### Functional Requirements
14. CLI commands MUST run without errors or hanging
15. No regressions in existing functionality (strict no-regression policy)
16. Implementation MUST be verified against specific requirements
17. Error handling MUST be comprehensive with useful error messages
18. Task-Code relationships MUST be captured and maintained
19. **TEST command integration by running with `npm run dev -- [command]`**

### Documentation Requirements
20. Code includes clear comments for complex logic
21. JSDoc documentation for all public APIs
22. README and documentation kept in sync with new features
23. Task descriptions maintained with accurate status
24. **Document all module exports in JSDoc comments**

## Recent Updates

- Test coverage significantly improved across modules
- Added comprehensive JSDoc documentation to Graph and NLP modules
- Enhanced Vitest integration tests for CLI commands
- Implemented database performance optimizations with caching
- Added detailed developer documentation
- Refactored complex functions for better maintainability

## Known Issues to Monitor
1. Import extension consistency (must use `.ts`, never `.js`)
2. **Export/import name mismatches (function names must match exactly)**
3. Test framework integration with Vitest (recently migrated)
4. Module resolution in TypeScript projects
5. Database schema compatibility with code models
6. NLP service ESM compatibility with external libraries
7. Task visualization performance with large hierarchies

## Implementation Workflow
1. Fix critical issues first (errors, failing tests, command hangs)
2. Prioritize tasks marked as "ready" in the backlog
3. Follow TDD methodology for all new implementations:
   - Write tests first to define expected behavior
   - Implement the minimum code needed to pass the tests
   - Refactor for readability and performance
   - Verify no regressions
4. Focus on completing feature sets (parent tasks with children) for cohesive implementation
5. Document all changes with clear commit messages
6. Ensure DoD requirements are met before marking tasks as complete

## Autopilot Mode Instructions
When asked to "continue" without a specific task context:

1. First, complete any task currently in progress
2. If no task is in progress, pick the next task following this priority:
   - Find in-progress tasks and complete them first
   - Find TODO tasks with [ready] status
   - Refine TODO tasks with [draft] status until they become [ready]
   - If no tasks remain, focus on increasing test coverage
3. Always follow the Definition of Done (DoD) checklist for all work
4. Ensure no failing tests, no type errors, and strictly follow project guidelines
5. If you identify an opportunity for enhancement, add it to the backlog for review
6. Continue in autopilot mode until explicitly asked to stop
7. Document all work in appropriate markdown files (TASK_CODE_*) and update status files

Remember: The goal is continuous improvement while maintaining code quality. Make the CLI better with each task completed.

## Module Import Validation

To prevent runtime errors related to module imports, ALWAYS include the following checks:

1. **Verify Export/Import Names**: Always check that imported functions/classes match the exact names exported from the module. Use the IDE to verify imports when possible.

2. **Run Import Validation Tests**: Use the module-imports.vitest.ts pattern to test that modules can be imported correctly:
   ```typescript
   // Example import validation test
   it('should verify db/init.ts exports the expected functions', async () => {
     const dbInitPath = '../../db/init.ts';
     const missingExports = await validateExports(dbInitPath, ['createDb']);
     expect(missingExports).toEqual([]);
   });
   ```

3. **Test CLI Commands**: Always run `npm run dev -- [command]` before committing to ensure the command can be executed without import errors.

4. **Document Module Exports**: Include clear JSDoc documentation on all exported functions/classes to make their purpose and usage clear.

5. **Check Circular Dependencies**: Be cautious of circular imports which can cause runtime errors that are difficult to debug.

If you add a new module or modify existing exports, always:
- Create/update import validation tests
- Test the functionality by running the relevant commands
- Document the exports and their purposes
- Verify module name resolution paths are correct

## Module-Specific Guidelines

### NLP Module
- Use ESM-compatible imports for all external libraries
- Implement fallback mechanisms for library compatibility issues
- Maintain test coverage for NLP operations
- Consider performance and memory usage with large datasets

### Task Visualization
- Use semantic relationship indicators (↳, →, ↔) for different dependency types
- Implement consistent color schemes for status and relationship types
- Provide proper indentation and tree structure
- Include legend explaining the relationship symbols
- Ensure performance with large task hierarchies

### Repository Layer
- Implement proper error handling with descriptive messages
- Ensure consistency between database schema and code models
- Optimize query patterns for common operations
- Maintain atomicity for multi-step operations
- Regularly test with larger datasets

### Testing Best Practices
- Focus on behavior-driven test descriptions
- Isolate tests to prevent cross-contamination
- Use mocks and stubs for external dependencies
- Maintain test coverage for edge cases
- Structure tests to mirror the codebase organization
- **ALWAYS include module import validation tests for new modules**
- Verify exports/imports match in integration tests
- Test CLI commands with `npm run dev -- command` before committing