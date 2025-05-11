# Code Modularization Guidelines

This document provides guidelines for modularizing large TypeScript files in the Task Master codebase. By following these guidelines, we can maintain better code quality, improve maintainability, and make the codebase more developer-friendly.

## File Size Rule

- **Maximum file size: 300 lines of code**
- Any file exceeding this limit should be considered for refactoring and modularization

## Why Modularize?

1. **Maintainability**: Smaller files are easier to understand, maintain, and debug
2. **Testability**: Modules with focused responsibilities are easier to test
3. **Reusability**: Well-defined modules can be reused across the codebase
4. **Collaboration**: Smaller modules reduce merge conflicts and make collaboration easier
5. **Code quality**: Focused modules tend to have better code quality and fewer bugs

## Modularization Strategies

### 1. Extract Constants and Types

Common constants and types can be extracted into dedicated files:

```typescript
// Before: Everything in one file
// typography.ts
export const TYPOGRAPHY = {
  BOX: { /* ... */ },
  DIVIDERS: { /* ... */ },
  // ...
};

// color.ts
export const COLORS = {
  PRIMARY: '#4dabf7',
  SECONDARY: '#748ffc',
  // ...
};

// types.ts
export interface FormatterOptions {
  useColor: boolean;
  width: number;
  // ...
}
```

### 2. Group Related Functions

Group related utility functions into focused utility files:

```typescript
// text-formatter.ts
export function formatText(text: string, options: TextFormatterOptions): string {
  // ...
}

export function wrapText(text: string, width: number): string {
  // ...
}

// date-formatter.ts
export function formatDate(timestamp: number): string {
  // ...
}

export function formatDateRange(start: number, end: number): string {
  // ...
}
```

### 3. Component-Based Organization

For UI-related code, consider a component-based approach:

```typescript
// task-header.ts
export function formatTaskHeader(task: Task, options: FormatterOptions): string {
  // ...
}

// task-description.ts
export function formatTaskDescription(task: Task, options: FormatterOptions): string {
  // ...
}

// task-status.ts
export function formatTaskStatus(task: Task, options: FormatterOptions): string {
  // ...
}
```

### 4. Factory Pattern for Complex Components

For complex component creation, use a factory pattern:

```typescript
// table-factory.ts
export function createTable(options: TableOptions): Table {
  // ...
}

export function createHeaderRow(columns: string[], options: TableOptions): TableRow {
  // ...
}
```

## Current Modularization Tasks

We have identified several files that exceed the 300-line limit and need modularization:

1. `polished-task.ts` (979 lines)
2. `enhanced-visualizer.ts` (1814 lines)
3. `interactive-enhanced.ts` (1098 lines)
4. `visualizer.ts` (720 lines)
5. `capability-map/index.ts` (712 lines)
6. `enhanced-discovery.ts` (678 lines)
7. `formatter-enhanced.ts` (615 lines)
8. `repository/search.ts` (613 lines)
9. `enhanced-relationships.ts` (594 lines)

These files have been added to the Task Master backlog for modularization (see task ID 18 and its subtasks).

## Implementation Approach

When modularizing a file, follow these steps:

1. **Analyze the file**: Identify logical groups of code, repeated patterns, and responsibilities
2. **Plan the modularization**: Decide which parts to extract and how they relate to each other
3. **Extract shared code first**: Start with constants, types, and utility functions
4. **Create focused modules**: Develop modules with single responsibilities
5. **Update imports/exports**: Ensure proper import/export relationships between modules
6. **Test thoroughly**: Verify that the modularized code behaves identically to the original
7. **Update documentation**: Document the new module structure

## Tools and Enforcement

To help maintain the 300-line rule:

1. Consider adding a linting rule to warn when files exceed 300 lines
2. Add a pre-commit hook to warn about large files
3. Make file size review part of the code review process

## Conclusion

By following these modularization guidelines, we can improve the maintainability, readability, and quality of the Task Master codebase. The modularization tasks in the backlog should be addressed as part of ongoing maintenance work.