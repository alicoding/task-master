# Modularization Plan for Triage Processor

## 1. Directory Structure

```
cli/commands/triage/lib/
├── processor/
│   ├── index.ts                 # Re-exports all functionality
│   ├── task-processor.ts        # Core task processing logic
│   ├── task-update.ts           # Update task functionality
│   ├── task-creation.ts         # New task creation 
│   ├── similarity.ts            # Similarity/duplicate handling
│   ├── auto-merge.ts            # Auto-merge functionality
│   ├── batch.ts                 # Batch processing functionality
```

## 2. Module Breakdown

### 2.1. `processor/index.ts`
- Export the main API functions:
  - `processPlanTask` (from task-processor.ts)
  - `processPlanWithEnhancedUI` (from batch.ts)
- Re-export the necessary types

### 2.2. `processor/task-processor.ts`
- Main `processPlanTask` function
- Core logic for processing a single task
- Delegates to task-update.ts or task-creation.ts based on task type

### 2.3. `processor/task-update.ts`
- `handleTaskUpdate` function
- Logic for updating existing tasks
- Error handling for update operations

### 2.4. `processor/task-creation.ts`
- `createNewTask` function
- Logic for creating new tasks
- Validation for required fields

### 2.5. `processor/similarity.ts`
- `handleNewTask` function
- Logic for checking similar tasks
- Handling of forced task creation
- Delegates to auto-merge.ts or task-creation.ts

### 2.6. `processor/auto-merge.ts`
- `handleAutoMerge` function
- Logic for merging similar tasks
- Threshold-based decision making

### 2.7. `processor/batch.ts`
- `processPlanWithEnhancedUI` function
- Sorting and batching of tasks
- Progress tracking and UI feedback

## 3. Implementation Strategy

1. Create the directory structure
2. Extract each function to its appropriate module
3. Update imports/exports
4. Create proper index file
5. Create backward compatibility wrapper in the original files

## 4. Extra Tasks

1. Standard code improvements:
   - Consistent error handling
   - Better type definitions
   - Improved documentation
   - Remove duplicated code

2. Fix any bugs found during modularization

## 5. Backward Compatibility

The original files (`processor.ts` and `processor-enhanced.ts`) should be kept but modified to:
1. Import from the new modular implementation
2. Re-export the functions with the same signatures
3. Include documentation referencing the new modules