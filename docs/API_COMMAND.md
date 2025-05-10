# Task Master Command-Based API Architecture

The Task Master API has been redesigned with a unified command-based architecture. This document provides an overview of the new design and its benefits.

## Architecture Overview

The new API architecture is built around a unified command pattern that provides a consistent interface for both the CLI and API. Every feature in Task Master is represented as a command that can be executed through multiple interfaces.

### Key Components

1. **Command Handlers**: Each command has a dedicated handler class that processes specific parameters and produces a result.

2. **Command Registry**: A central registry that manages all available commands and provides discovery and execution services.

3. **Command Context**: Provides execution context including database access, output formatting, and environment configuration.

4. **API Router**: Maps HTTP requests to command handlers, enabling RESTful access to all commands.

5. **API Service**: Programmatic interface for executing commands and working with the Task Master system.

## Command Handler System

### BaseCommandHandler

The `BaseCommandHandler` class provides a standard implementation for all command handlers:

```typescript
abstract class BaseCommandHandler<TParams, TResult> implements CommandHandler<TParams, TResult> {
  readonly name: string;
  readonly description: string;
  
  // Execute with standardized error handling and context
  async execute(context: CommandContext, params: TParams): Promise<CommandResponse<TResult>>;
  
  // Validate parameters
  validateParams(params: TParams): true | string;
  
  // Command-specific implementation
  abstract executeCommand(context: CommandContext, params: TParams): Promise<TResult>;
}
```

### CommandRegistry

The `CommandRegistry` class manages all command handlers:

```typescript
class CommandRegistry {
  private handlers: Map<string, CommandHandler> = new Map();

  // Register a command handler
  register(handler: CommandHandler): void;
  
  // Get a command handler by name
  get(name: string): CommandHandler | undefined;
  
  // Check if a command exists
  has(name: string): boolean;
  
  // Get all registered command names
  getCommandNames(): string[];
  
  // Execute a command by name
  async executeCommand(name: string, params: any, options: any): Promise<CommandResponse>;
}
```

### CommandContext

The `CommandContext` class provides a consistent execution environment:

```typescript
class CommandContext {
  // Create a new command execution context
  constructor(dbPath: string, options: ExecutionOptions);
  
  // Access to core services
  getRepository(): TaskRepository;
  getGraph(): TaskGraph;
  
  // Context configuration
  isDryRunMode(): boolean;
  getOutputMode(): OutputMode;
  getInputSource(): InputSource;
  
  // Format a response based on context settings
  formatResponse<T>(command: string, success: boolean, result?: T, error?: string): CommandResponse<T>;
  
  // Write output to the appropriate destination
  async writeOutput<T>(response: CommandResponse<T>): Promise<void>;
  
  // Close the context (databases, etc.)
  close(): void;
}
```

## Command Implementations

Task Master implements the following core commands:

- **add**: Create a new task
- **update**: Update an existing task
- **remove**: Delete a task
- **show**: Display task details
- **search**: Find tasks matching criteria
- **graph**: Visualize task hierarchy
- **deps**: Visualize task dependencies
- **batch**: Execute multiple commands

Each command handler follows a consistent pattern:
1. Define parameters interface
2. Implement parameter validation
3. Implement command-specific business logic
4. Format and return results

## API Integration

### ApiService

The `ApiService` class provides a programmatic interface for executing commands:

```typescript
class ApiService {
  // Execute a command by name
  async executeCommand(
    commandName: string,
    params: any = {},
    options: any = {}
  ): Promise<any>;
  
  // Get all available commands
  getAvailableCommands(): string[];
  
  // Legacy compatibility methods
  async executeBatch(batch: any, dryRun: boolean): Promise<any>;
  async exportTasks(format: string, filter?: string): Promise<any>;
  async importTasks(tasks: any[], dryRun: boolean): Promise<any>;
}
```

### ApiRouter

The `ApiRouter` class maps HTTP requests to command handlers:

```typescript
class ApiRouter {
  // Register a new API endpoint
  registerEndpoint(endpoint: EndpointDefinition): void;
  
  // Get all registered endpoints
  getEndpoints(): EndpointDefinition[];
  
  // Execute a command through the API
  async executeCommand(commandName: string, params: any, options: any): Promise<any>;
  
  // Handle an API request
  async handleRequest(method: HttpMethod, path: string, body: any, query: any): Promise<any>;
}
```

## API Command Line Interface

The CLI command structure remains the same, but now it's built on top of the shared command system:

### Export Command

```bash
# Export all tasks in JSON format
tm api export

# Export tasks in hierarchical format with specific filter
tm api export --format hierarchical --filter status:todo

# Export to a file
tm api export --output tasks.json
```

### Import Command

```bash
# Import tasks from a file
tm api import --input tasks.json

# Preview import without making changes
tm api import --input tasks.json --dry-run
```

### Batch Command

```bash
# Run multiple operations from a batch file
tm api batch --input operations.json

# Preview batch operations without making changes
tm api batch --input operations.json --dry-run
```

## New Batch File Format

The batch operations format has been updated to match the command architecture:

```json
{
  "operations": [
    {
      "command": "add",
      "params": {
        "title": "New Task",
        "tags": ["api", "batch"]
      }
    },
    {
      "command": "update",
      "params": {
        "id": "1.2",
        "status": "in-progress"
      }
    },
    {
      "command": "remove",
      "params": {
        "id": "3.1"
      }
    },
    {
      "command": "search",
      "params": {
        "tags": ["important"]
      }
    }
  ]
}
```

## Benefits of the New Architecture

1. **Unified Interface**: All Task Master features are accessible through the same interface, whether using the CLI, API, or direct integration.

2. **Modularity**: Each command is implemented as an independent module, making the codebase more maintainable.

3. **Consistency**: All commands follow the same structure, validation patterns, and response formats.

4. **Extensibility**: New commands can be added without modifying existing code, following the Open/Closed Principle.

5. **Testability**: Commands can be tested in isolation with mock contexts.

6. **Documentation**: The command structure makes it easy to generate comprehensive API documentation.

## Migration Notes

For backward compatibility, the API still supports the legacy operation format:

```json
{
  "operations": [
    {
      "type": "add",
      "data": {
        "title": "New Task"
      }
    }
  ]
}
```

This is automatically converted to the new format internally.

## Future Improvements

- Add command middleware for cross-cutting concerns
- Support command dependencies
- Add command versioning for backward compatibility
- Improve command discovery and documentation generation
- Add permission checking to commands
- Add authentication mechanism for secure API access
- Implement rate limiting for batch operations
- Add streaming support for large exports/imports