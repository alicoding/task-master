# Task Master API Documentation

The Task Master API provides a comprehensive interface for interacting with Task Master programmatically. It is designed for integration with UIs, AI agents, and external tools.

## New Command-Based Architecture

Task Master's API has been redesigned around a unified command-based architecture that provides consistent behavior between the CLI and API. Every feature in Task Master is represented as a command that can be executed through the CLI, HTTP API, or direct programmatic access.

### Key Components

- **Command Handlers**: Each command has a dedicated handler that processes specific parameters and produces a result.
- **Command Registry**: A central registry that manages all available commands.
- **Command Context**: Provides execution context including database access, output formatting, etc.
- **API Router**: Maps HTTP requests to command handlers.
- **API Service**: Provides a programmatic interface for executing commands.

## API Access Methods

There are three ways to interact with the Task Master API:

1. **HTTP API**: RESTful interface for remote access
2. **Direct Integration**: Use the API service directly in your JavaScript/TypeScript code
3. **Command-Line Interface**: Task Master's CLI is built on the same API

## HTTP API Endpoints

Task Master provides the following RESTful API endpoints:

### Task Operations

- `GET /tasks` - Get all tasks
- `GET /tasks/:id` - Get a specific task
- `POST /tasks` - Create a new task
- `PUT /tasks/:id` - Update a task 
- `DELETE /tasks/:id` - Delete a task

### Search & Visualization

- `POST /tasks/search` - Search for tasks
- `GET /graph` - Get task graph visualization
- `GET /deps` - Get task dependencies

### Batch Operations

- `POST /batch` - Execute multiple operations in a batch

### Command Execution

- `POST /commands/:command` - Execute any registered command

## Using the API Service Directly

The ApiService can be used directly in JavaScript/TypeScript applications:

```typescript
import { ApiService } from 'task-master/core/api';

// Create an API service instance
const api = new ApiService('./db/taskmaster.db');

// Execute a command
const result = await api.executeCommand('add', {
  title: 'New task',
  status: 'todo',
  tags: ['api', 'example']
});

console.log(result);

// For legacy compatibility:
const exportedTasks = await api.exportTasks('json', 'status:todo');
const importResults = await api.importTasks(tasksArray);

// Close the connection when done
api.close();
```

## Command Reference

Each command accepts specific parameters and produces a result. All commands return a standard response format:

```typescript
interface CommandResponse<T> {
  success: boolean;        // Whether the command succeeded
  result?: T;              // Command result data
  error?: string;          // Error message if any
  timestamp: string;       // When the command was executed
  command: string;         // Command name that was executed
  source: string;          // Where the command came from (cli, api, script)
  dryRun: boolean;         // Whether this was a dry run
}
```

### Core Commands

#### add

Creates a new task.

Parameters:
- `title` (string, required) - Task title
- `parentId` (string, optional) - Parent task ID
- `status` (string, optional) - Task status ('todo', 'in-progress', 'done')
- `readiness` (string, optional) - Task readiness ('draft', 'ready', 'blocked')
- `tags` (string[], optional) - Array of tags
- `metadata` (object, optional) - Additional metadata

#### update

Updates an existing task.

Parameters:
- `id` (string, required) - Task ID to update
- `title` (string, optional) - New task title
- `parentId` (string, optional) - New parent task ID
- `status` (string, optional) - New task status
- `readiness` (string, optional) - New task readiness
- `tags` (string[], optional) - New array of tags
- `metadata` (object, optional) - New metadata

#### remove

Removes a task.

Parameters:
- `id` (string, required) - Task ID to remove
- `force` (boolean, optional) - Whether to force removal of tasks with children

#### show

Shows a task or list of tasks.

Parameters:
- `id` (string, optional) - Specific task ID to show
- `format` (string, optional) - Output format ('hierarchy', 'flat')
- `includeChildren` (boolean, optional) - Include child tasks
- `includeParents` (boolean, optional) - Include parent tasks

#### search

Searches for tasks.

Parameters:
- `query` (string, optional) - Search query
- `status` (string, optional) - Filter by status
- `readiness` (string, optional) - Filter by readiness
- `tags` (string[], optional) - Filter by tags
- `parentId` (string, optional) - Filter by parent ID
- `natural` (boolean, optional) - Use natural language processing
- `fuzzy` (boolean, optional) - Use fuzzy matching
- `limit` (number, optional) - Limit results

#### graph

Visualizes task hierarchy.

Parameters:
- `format` (string, optional) - Output format ('text', 'json', 'dot', 'mermaid')
- `textStyle` (string, optional) - Text style ('simple', 'tree', 'detailed', 'compact')
- `jsonStyle` (string, optional) - JSON style ('flat', 'tree', 'graph', 'ai')
- `showMetadata` (boolean, optional) - Include metadata
- `useColor` (boolean, optional) - Use colors in output
- `filter` (string[], optional) - Filter by tags
- `status` (string, optional) - Filter by status
- `readiness` (string, optional) - Filter by readiness

#### deps

Visualizes task dependencies.

Parameters:
- `id` (string, optional) - Root task ID
- `depth` (number, optional) - Depth limit
- `direction` (string, optional) - Direction ('down', 'up', 'both')
- `format` (string, optional) - Output format ('text', 'json', 'dot', 'mermaid')
- `textStyle` (string, optional) - Text style ('simple', 'tree', 'detailed')
- `jsonStyle` (string, optional) - JSON style ('flat', 'tree', 'graph')

#### batch

Executes multiple commands in a batch.

Parameters:
- `operations` (array, required) - Array of operations, each containing:
  - `command` (string, required) - Command name
  - `params` (object, required) - Command parameters

## Batch Operations

Batch operations allow executing multiple commands in a single request:

```json
{
  "operations": [
    {
      "command": "add",
      "params": {
        "title": "New task via batch"
      }
    },
    {
      "command": "update",
      "params": {
        "id": "1.2",
        "status": "done"
      }
    },
    {
      "command": "remove",
      "params": {
        "id": "3.4"
      }
    }
  ]
}
```

## CLI Commands

Task Master's CLI provides convenient access to API functionality through these commands:

```bash
# Export tasks
tm api export --format json --filter status:todo --output tasks.json

# Import tasks
tm api import --input tasks.json

# Execute batch operations
tm api batch --input operations.json
```

## Error Handling

All API operations return consistent error structures:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2023-05-10T14:30:00.000Z",
  "command": "command-name",
  "source": "api",
  "dryRun": false
}
```

Batch operations include details about each operation's success or failure:

```json
{
  "success": true,
  "result": {
    "success": 2,
    "failed": 1,
    "skipped": 0,
    "details": [
      {
        "success": true,
        "result": { "id": "1.2", "title": "New task" },
        "timestamp": "2023-05-10T14:30:00.000Z",
        "command": "add",
        "source": "api",
        "dryRun": false
      },
      {
        "success": false,
        "error": "Task not found",
        "timestamp": "2023-05-10T14:30:00.100Z",
        "command": "update",
        "source": "api",
        "dryRun": false
      }
    ]
  },
  "timestamp": "2023-05-10T14:30:00.200Z",
  "command": "batch",
  "source": "api",
  "dryRun": false
}
```

## Legacy Compatibility

For backward compatibility, the API service still supports the legacy operation format:

```typescript
// Legacy format
const batchResults = await apiService.executeBatch({
  operations: [
    { type: 'add', data: { title: 'New Task' } },
    { type: 'update', data: { id: '1.2', status: 'done' } }
  ]
});
```

## Future Enhancements

- Authentication and authorization
- Real-time updates via WebSockets
- Rate limiting and throttling
- Pagination for large datasets
- Streaming for large imports/exports
- Extended filtering options
- GraphQL interface