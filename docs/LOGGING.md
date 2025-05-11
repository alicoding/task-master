# Logging System

This document describes the standardized logging system used in Task Master for consistent log message formatting and behavior across the codebase.

## Overview

Task Master uses a centralized logging utility that provides:

1. Consistent log message formatting
2. Configurable log levels
3. Context-aware logging
4. Standardized error handling
5. Colorized output
6. Child loggers for subsystems
7. Metadata support

## Usage

### Creating a Logger

```typescript
import { createLogger } from '../core/utils/logger.ts';

// Create a logger with context (typically module or class name)
const logger = createLogger('MyModule');

// Use the logger
logger.info('System initialized');
logger.warn('Resource usage high', { memoryUsage: '85%' });
logger.error('Operation failed', error, { operation: 'save' });
```

### Log Levels

The logger supports the following log levels:

- `DEBUG`: Detailed information for debugging
- `INFO`: General informational messages
- `WARN`: Warning conditions that might lead to errors
- `ERROR`: Error conditions that affect operations
- `NONE`: Disable all logging

### Class Integration

Integrate the logger with your classes:

```typescript
import { createLogger } from '../core/utils/logger.ts';

class TaskService {
  private logger = createLogger('TaskService');
  
  constructor() {
    this.logger.info('Service initialized');
  }
  
  createTask(taskData: any): void {
    this.logger.debug('Creating task', { taskData });
    
    try {
      // Task creation logic
      this.logger.info(`Task created with ID: ${taskId}`);
    } catch (error) {
      this.logger.error('Failed to create task', error, { taskData });
      throw error;
    }
  }
}
```

### Child Loggers

Create child loggers for subsystems or operations:

```typescript
// Parent logger
const repoLogger = createLogger('Repository');

// Create a child logger for a specific repository function
const searchLogger = repoLogger.child('Search');
searchLogger.info('Starting search operation');
```

### Configuration

Configure logging behavior globally:

```typescript
import { configureLogger, LogLevel } from '../core/utils/logger.ts';

// Change global configuration
configureLogger({
  level: LogLevel.DEBUG,      // Show all logs, including debug
  useColors: true,            // Use colored output
  includeTimestamps: true,    // Include timestamps in logs
  includeLevel: true,         // Include log level in logs
  includeContext: true        // Include context in logs
});
```

## Log Format

The standard log format is:

```
[TIMESTAMP] LEVEL [CONTEXT] Message
```

Example:
```
[2023-05-01T12:34:56.789Z] INFO [Repository:Search] Starting search operation
```

For errors, additional information is included:
```
[2023-05-01T12:34:56.789Z] ERROR [TaskService] Failed to create task
Error: Database connection failed
  at TaskService.createTask (/path/to/file.ts:123:45)
  at ...
```

## Best Practices

1. **Context Naming**:
   - Use descriptive context names (typically module or class names)
   - Use hierarchical naming for related components (e.g., `Repository:Search`)

2. **Log Levels**:
   - `DEBUG`: Implementation details useful during development
   - `INFO`: Normal operational information
   - `WARN`: Potential issues that don't prevent operation
   - `ERROR`: Failures and exceptions that affect operation

3. **Error Logging**:
   - Always include the error object as the second parameter
   - Include relevant metadata as the third parameter
   - Don't catch errors just to log them - let them propagate after logging

4. **Message Style**:
   - Use concise, descriptive messages
   - Include relevant identifiers (e.g., task IDs, user IDs)
   - Be consistent with message wording and format

5. **Sensitive Information**:
   - Never log sensitive information (passwords, tokens, etc.)
   - Sanitize user input in log messages

## Examples

### Basic Logging

```typescript
const logger = createLogger('App');

logger.info('Application started');
logger.debug('Configuration loaded', { config: configSummary });
logger.warn('Database connection slow', { responseTime: '1.2s' });
logger.error('Failed to connect to service', error, { service: 'auth' });
```

### Repository Logging

```typescript
class TaskRepository {
  private logger = createLogger('Repository:Task');
  
  async getTask(id: string): Promise<TaskOperationResult<Task>> {
    this.logger.debug('Getting task', { id });
    
    try {
      // Database operation
      
      if (!task) {
        this.logger.info(`Task not found: ${id}`);
        return {
          success: false,
          error: new TaskError('Task not found', TaskErrorCode.NOT_FOUND)
        };
      }
      
      this.logger.debug('Task retrieved successfully', { id });
      return {
        success: true,
        data: task
      };
    } catch (error) {
      this.logger.error('Error retrieving task', error, { id });
      return {
        success: false,
        error: new TaskError(
          `Error retrieving task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }
}
```

## Command Line Integration

For CLI commands, use the logger for operational logs but use direct console methods for user-facing output:

```typescript
import { createLogger } from '../core/utils/logger.ts';
import chalk from 'chalk';

const logger = createLogger('Commands:Add');

export function handleAddCommand(options) {
  logger.debug('Handling add command', { options });
  
  try {
    // Operation logic
    logger.info('Creating task');
    const task = createTask(options);
    
    // User-facing output - use console directly
    console.log(chalk.green(`✅ Task ${task.id} created successfully!`));
    console.log(chalk.white.bold(task.title));
    
  } catch (error) {
    logger.error('Error in add command', error, { options });
    
    // User-facing error - use console directly
    console.error(chalk.red(`❌ Error: ${error.message}`));
  }
}
```