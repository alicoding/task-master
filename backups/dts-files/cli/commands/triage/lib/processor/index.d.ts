/**
 * Task processing system
 *
 * Modular implementation of task processing functionality for the triage command.
 * Handles processing, updating, creating, and merging tasks with enhanced UI.
 */
export { processPlanTask } from './task-processor';
export { processPlanWithEnhancedUI } from './batch';
export { handleTaskUpdate } from './task-update';
export { createNewTask } from './task-creation';
export { handleNewTask } from './similarity';
export { handleAutoMerge } from './auto-merge';
export type { SimilarTask } from './auto-merge';
