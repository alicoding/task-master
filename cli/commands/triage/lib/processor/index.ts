/**
 * Task processing system
 * 
 * Modular implementation of task processing functionality for the triage command.
 * Handles processing, updating, creating, and merging tasks with enhanced UI.
 */

// Export main API functionality
export { processPlanTask } from './task-processor.ts';
export { processPlanWithEnhancedUI } from './batch.ts';

// Export additional functionality for direct use if needed
export { handleTaskUpdate } from './task-update.ts';
export { createNewTask } from './task-creation.ts';
export { handleNewTask } from './similarity.ts';
export { handleAutoMerge } from './auto-merge.ts';

// Export types
export type { SimilarTask } from './auto-merge.ts';