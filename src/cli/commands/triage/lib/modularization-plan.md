# Modularization Plan for interactive-enhanced.ts

The `interactive-enhanced.ts` file (1098 lines) needs to be broken down into smaller, focused modules to improve maintainability and readability.

## Directory Structure

```
cli/commands/triage/lib/
  ├── interactive-enhanced/
  │   ├── index.ts                     # Main entry point that exports runInteractiveMode
  │   ├── display/
  │   │   ├── index.ts                 # Export all display components
  │   │   ├── intro.ts                 # Display intro screen
  │   │   ├── task-details.ts          # Display task details
  │   │   ├── similar-tasks.ts         # Display similar tasks
  │   │   ├── dependencies.ts          # Display task dependencies
  │   │   ├── action-menu.ts           # Display action menu
  │   │   └── help-screen.ts           # Display help screen
  │   ├── handlers/
  │   │   ├── index.ts                 # Export all action handlers
  │   │   ├── update-task.ts           # Update task status/readiness
  │   │   ├── mark-done.ts             # Mark task as done
  │   │   ├── update-tags.ts           # Update task tags
  │   │   ├── merge-task.ts            # Merge with similar task
  │   │   ├── create-subtask.ts        # Create subtask
  │   │   └── toggle-blocked.ts        # Toggle blocked status
  │   ├── prompts/
  │   │   ├── index.ts                 # Export all prompt-related functions
  │   │   └── action-prompts.ts        # Prompt for user actions
  │   └── utils/
  │       ├── index.ts                 # Export all utility functions
  │       ├── colors.ts                # Color-related utilities
  │       └── sorting.ts               # Sorting utilities
  └── utils.js                         # Existing utils file
```

## Component Breakdown

### 1. Main Entry Point

**index.ts**: Main entry point that exports the `runInteractiveMode` function, now refactored to use the modular components.

### 2. Display Components

**display/intro.ts**: Display the interactive triage intro screen (lines 198-209)
```typescript
export function displayInteractiveIntro(taskCount: number, colorize: ColorizeFunction): void
```

**display/task-details.ts**: Display enhanced task details (lines 214-311)
```typescript
export async function displayEnhancedTaskDetails(
  task: TriageTask,
  index: number,
  total: number,
  allTasks: TriageTask[],
  graph: TaskGraph,
  colorize: ColorizeFunction
): Promise<void>
```

**display/similar-tasks.ts**: Display similar tasks (lines 316-364)
```typescript
export async function displaySimilarTasksEnhanced(
  filteredTasks: TriageTask[],
  colorize: ColorizeFunction
): Promise<void>
```

**display/dependencies.ts**: Display task dependencies (lines 369-408)
```typescript
export function displayDependencies(
  dependencies: {
    direction: 'blocked' | 'blocking';
    task: {
      id: string;
      title: string;
      status: string;
    }
  }[],
  colorize: ColorizeFunction
): void
```

**display/action-menu.ts**: Display the action menu (lines 413-439)
```typescript
export function displayActionMenu(
  hasSimilarTasks: boolean,
  colorize: ColorizeFunction
): void
```

**display/help-screen.ts**: Display help screen (lines 444-488)
```typescript
export function displayHelpScreen(
  colorize: ColorizeFunction
): void
```

### 3. Action Handlers

**handlers/update-task.ts**: Update task status and readiness (lines 513-620)
```typescript
export async function handleUpdateTaskAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void>
```

**handlers/mark-done.ts**: Mark task as done (lines 625-658)
```typescript
export async function handleMarkAsDoneAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void>
```

**handlers/update-tags.ts**: Update task tags (lines 663-737)
```typescript
export async function handleUpdateTagsAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void>
```

**handlers/merge-task.ts**: Merge tasks (lines 742-885)
```typescript
export async function handleMergeTaskAction(
  task: TriageTask,
  filteredTasks: TriageTask[],
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void>
```

**handlers/create-subtask.ts**: Create subtask (lines 890-998)
```typescript
export async function handleCreateSubtaskAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void>
```

**handlers/toggle-blocked.ts**: Toggle blocked status (lines 1003-1075)
```typescript
export async function handleToggleBlockedAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void>
```

### 4. Prompts

**prompts/action-prompts.ts**: Prompt for user actions (lines 493-508)
```typescript
export async function promptForAction(
  colorize: ColorizeFunction
): Promise<string>
```

### 5. Utilities

**utils/colors.ts**: Color-related utilities (lines 1077-1099)
```typescript
export function getStatusColor(status: string): ChalkColor
export function getReadinessColor(readiness: string): ChalkColor
```

**utils/sorting.ts**: Task sorting utilities (lines 51-65)
```typescript
export function sortPendingTasks(tasks: TriageTask[]): TriageTask[]
```

## Implementation Strategy

1. Create the directory structure
2. Define and extract reusable types (TriageTask, ColorizeFunction, etc.)
3. Implement utility modules first (they have fewer dependencies)
4. Implement prompt modules
5. Implement display modules
6. Implement action handler modules
7. Refactor main runInteractiveMode to use the modular components
8. Test the full integration