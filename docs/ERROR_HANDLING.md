# Error Handling in Task Master

This document describes the error handling approach in Task Master, including error types, propagation patterns, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Error Architecture](#error-architecture)
3. [Error Types](#error-types)
4. [Error Propagation](#error-propagation)
5. [Repository Error Handling](#repository-error-handling)
6. [API Error Handling](#api-error-handling)
7. [CLI Error Handling](#cli-error-handling)
8. [Best Practices](#best-practices)

## Overview

Task Master implements a structured error handling system that provides:

- Consistent error reporting across all components
- Type-safe error objects with meaningful codes
- Predictable error propagation patterns
- Graceful degradation for user interfaces

## Error Architecture

The error handling architecture is built around the following components:

1. **TaskError Class**: A custom error class extending the standard Error with additional properties
2. **Error Code Enum**: An enumeration of all possible error types
3. **Result Type**: A generic type wrapping operation results with success/error information
4. **Error Guards**: Type guards for reliable error type checking

## Error Types

Task Master defines specific error types through the `TaskErrorCode` enum:

- `NOT_FOUND`: The requested resource (typically a task) was not found
- `INVALID_INPUT`: The provided input was invalid or malformed
- `DATABASE_ERROR`: An error occurred accessing the database
- `DEPENDENCY_ERROR`: An error related to task dependencies or relationships
- `PERMISSION_ERROR`: An operation was not permitted due to access restrictions
- `GENERAL_ERROR`: A general error not fitting other categories

Each error code maps to specific error conditions in the codebase.

## Error Propagation

Errors in Task Master are propagated through the `TaskOperationResult<T>` type:

```typescript
interface TaskOperationResult<T> {
  success: boolean;
  data?: T;
  error?: TaskError;
}
```

This pattern ensures that:

1. All operations explicitly indicate success or failure
2. Successful operations include the result data
3. Failed operations include a detailed error object
4. Calling code can handle errors gracefully

## Repository Error Handling

The repository layer is the primary source of errors in Task Master. Key error handling patterns include:

### Task Not Found

When attempting to access a non-existent task, repositories return:

```typescript
{
  success: false,
  error: new TaskError(`Task with ID ${id} not found`, TaskErrorCode.NOT_FOUND)
}
```

### Input Validation

Before performing operations, input is validated:

```typescript
if (!isTaskStatus(status)) {
  return {
    success: false,
    error: new TaskError(`Invalid status: ${status}`, TaskErrorCode.INVALID_INPUT)
  };
}
```

### Database Errors

Database operations are wrapped in try/catch blocks:

```typescript
try {
  // Database operation
} catch (error) {
  return {
    success: false,
    error: new TaskError(
      `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      TaskErrorCode.DATABASE_ERROR
    )
  };
}
```

### Dependency Errors

Circular dependencies and invalid relationships are caught:

```typescript
if (isCircular(taskId, parentId)) {
  return {
    success: false,
    error: new TaskError(
      `Circular dependency detected: ${taskId} → ${parentId}`,
      TaskErrorCode.DEPENDENCY_ERROR
    )
  };
}
```

## API Error Handling

The API layer maps repository errors to appropriate HTTP status codes:

- `NOT_FOUND` → 404 Not Found
- `INVALID_INPUT` → 400 Bad Request
- `DATABASE_ERROR` → 500 Internal Server Error
- `DEPENDENCY_ERROR` → 409 Conflict
- `PERMISSION_ERROR` → 403 Forbidden
- `GENERAL_ERROR` → 500 Internal Server Error

Error responses include structured information:

```json
{
  "status": "error",
  "error": {
    "code": "NOT_FOUND",
    "message": "Task with ID 123 not found"
  }
}
```

## CLI Error Handling

The command-line interface presents user-friendly error messages:

- **Color Coding**: Errors appear in red for visibility
- **Contextual Information**: Error messages include context about the operation
- **Graceful Degradation**: CLI continues functioning even after errors
- **Error Codes**: Critical errors include error codes for troubleshooting
- **Suggestions**: When possible, suggestions for resolution are provided

Example CLI error output:

```
Error: Task with ID 123 not found [NOT_FOUND]
Tip: Use 'tm show' to list available tasks
```

## Best Practices

When working with Task Master's error handling, follow these best practices:

### Checking Errors

Always check for success before accessing data:

```typescript
const result = await repo.getTask(id);
if (!result.success || !result.data) {
  // Handle error
  console.error(`Error: ${result.error?.message}`);
  return;
}

// Use data safely
const task = result.data;
```

### Error Type Guards

Use provided type guards for specific error handling:

```typescript
if (isTaskError(error, TaskErrorCode.NOT_FOUND)) {
  // Handle not found error
} else if (isTaskError(error, TaskErrorCode.INVALID_INPUT)) {
  // Handle validation error
}
```

### Error Propagation

When implementing new functions, follow the result pattern:

```typescript
async function myOperation(): Promise<TaskOperationResult<SomeType>> {
  try {
    // Operation logic
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: new TaskError(
        `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TaskErrorCode.GENERAL_ERROR
      )
    };
  }
}
```

### Testing Errors

Always test error conditions in your code, especially:

- Not found conditions
- Invalid input handling
- Database errors
- Edge cases

## Error Resilience

Task Master is designed for error resilience:

- **Graceful Recovery**: Components attempt to recover from non-fatal errors
- **State Preservation**: Database transactions prevent partial updates
- **Resource Cleanup**: Resources are properly closed even after errors
- **Fallback Behavior**: Alternative strategies are used when primary operations fail

## Conclusion

The error handling system in Task Master provides a robust foundation for reliable operation. By following the established patterns, you can ensure that your code extensions handle errors consistently and provide a good user experience even when problems occur.