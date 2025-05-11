# File Tracking System

## Overview

The File Tracking System is a component of Task Master that enables tracking relationships between tasks and code files. It provides functionality for:

1. Tracking files and their changes over time
2. Associating files with tasks with different relationship types
3. Querying for files related to tasks and tasks related to files
4. Maintaining a change history for files

## Database Schema

The File Tracking System uses three new tables in the database:

### `files` Table

Stores information about tracked files:

- `id`: Unique identifier for the file
- `path`: Absolute or relative path to the file
- `hash`: SHA-256 hash of the file contents for change detection
- `last_modified`: Timestamp of the last modification
- `created_at`: Timestamp when the file was first tracked
- `file_type`: File extension or type (js, ts, md, etc.)
- `metadata`: Additional file metadata as JSON

### `task_files` Table

Maintains the many-to-many relationship between tasks and files:

- `id`: Unique identifier for the relationship
- `task_id`: ID of the task
- `file_id`: ID of the file
- `relationship_type`: Type of relationship (implements, tests, documents, related)
- `confidence`: Confidence score (0-100) for auto-detected relationships
- `created_at`: Timestamp when the relationship was created
- `updated_at`: Timestamp when the relationship was last updated
- `metadata`: Additional relationship metadata as JSON

### `file_changes` Table

Logs each time a file is changed:

- `id`: Unique identifier for the change
- `file_id`: ID of the changed file
- `task_id`: ID of the related task (optional)
- `change_type`: Type of change (created, modified, deleted, renamed)
- `timestamp`: When the change occurred
- `previous_hash`: Hash before the change
- `current_hash`: Hash after the change
- `metadata`: Additional change metadata as JSON

## API

The File Tracking System is integrated into the TaskRepository and provides the following methods:

### `trackFile(filePath: string): Promise<TaskOperationResult<File>>`

Tracks a file, creating or updating its record in the database:

```typescript
const result = await repo.trackFile('/path/to/file.js');
if (result.success && result.data) {
  console.log(`File ${result.data.id} tracked successfully`);
}
```

### `associateFileWithTask(taskId: string, filePath: string, relationshipType?: string, confidence?: number): Promise<TaskOperationResult<TaskFile>>`

Associates a file with a task:

```typescript
const result = await repo.associateFileWithTask(
  'task-123',
  '/path/to/file.js',
  'implements',
  90
);
```

Relationship types:
- `implements`: The file implements the task
- `tests`: The file contains tests for the task
- `documents`: The file documents the task
- `related`: The file is related to the task (default)

### `getFilesForTask(taskId: string): Promise<TaskOperationResult<{ file: File, relationship: TaskFile }[]>>`

Gets all files associated with a task:

```typescript
const result = await repo.getFilesForTask('task-123');
if (result.success && result.data) {
  for (const item of result.data) {
    console.log(`File: ${item.file.path}, Relationship: ${item.relationship.relationshipType}`);
  }
}
```

### `getTasksForFile(filePath: string): Promise<TaskOperationResult<{ task: any, relationship: TaskFile }[]>>`

Gets all tasks associated with a file:

```typescript
const result = await repo.getTasksForFile('/path/to/file.js');
if (result.success && result.data) {
  for (const item of result.data) {
    console.log(`Task: ${item.task.title}, Relationship: ${item.relationship.relationshipType}`);
  }
}
```

### `getFileChangeHistory(filePath: string): Promise<TaskOperationResult<FileChange[]>>`

Gets the change history for a file:

```typescript
const result = await repo.getFileChangeHistory('/path/to/file.js');
if (result.success && result.data) {
  for (const change of result.data) {
    console.log(`Change: ${change.changeType} at ${new Date(change.timestamp).toLocaleString()}`);
  }
}
```

## Usage Examples

### Tracking a File

```typescript
const repo = new TaskRepository();
try {
  // Track a file
  const fileResult = await repo.trackFile('/path/to/implementation.js');
  
  if (fileResult.success && fileResult.data) {
    console.log(`File tracked: ${fileResult.data.path}`);
  }
} finally {
  repo.close();
}
```

### Associating a File with a Task

```typescript
const repo = new TaskRepository();
try {
  // Associate a file with a task
  const associationResult = await repo.associateFileWithTask(
    'task-123',
    '/path/to/implementation.js',
    'implements',
    100
  );
  
  if (associationResult.success && associationResult.data) {
    console.log(`File associated with task`);
  }
} finally {
  repo.close();
}
```

### Finding Files for a Task

```typescript
const repo = new TaskRepository();
try {
  // Get all files for a task
  const filesResult = await repo.getFilesForTask('task-123');
  
  if (filesResult.success && filesResult.data) {
    console.log(`Found ${filesResult.data.length} files for task`);
    
    for (const item of filesResult.data) {
      console.log(`- ${item.file.path} (${item.relationship.relationshipType})`);
    }
  }
} finally {
  repo.close();
}
```

## Integration with Daemon Process

The File Tracking System is designed to be used with the Daemon Process (Task 17.1) and File System Watcher (Task 17.2) to automatically track file changes and associate them with tasks.

When a file is modified:

1. The File System Watcher detects the change
2. The Daemon Process identifies the related task(s)
3. The File Tracking System updates the file record and logs the change
4. The change is associated with the relevant task(s)

This enables automatic tracking of which files implement which tasks, making it easier to navigate between tasks and their corresponding code files.