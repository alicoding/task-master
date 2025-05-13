/**
 * Task processing system
 * 
 * Modular implementation of task processing functionality for the triage command.
 * Handles processing, updating, creating, and merging tasks with enhanced UI.
 */

// Export main API functionality
export { processPlanTask } from '@/cli/commands/triage/lib/processor/task-processor';
export { processPlanWithEnhancedUI } from '@/cli/commands/triage/lib/processor/batch';

// Export additional functionality for direct use if needed
export { handleTaskUpdate } from '@/cli/commands/triage/lib/processor/task-update';
export { createNewTask } from '@/cli/commands/triage/lib/processor/task-creation';
export { handleNewTask } from '@/cli/commands/triage/lib/processor/similarity';
export { handleAutoMerge } from '@/cli/commands/triage/lib/processor/auto-merge';

// Export types
export type { SimilarTask } from '@/cli/commands/triage/lib/processor/auto-merge';