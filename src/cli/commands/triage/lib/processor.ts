/**
 * Task processor functionality
 * 
 * This file serves as a backward compatibility wrapper around the modularized
 * implementation of the task processor.
 */

import { TaskRepository } from '@/core/repo';
import { NlpService } from '@/core/nlp-service';
import { ProcessingOptions, TriageResults, TriageTask } from '@/cli/commands/triage/lib/utils';

// Import from the modularized implementation
import {
  processPlanTask as processPlanTaskModular,
  handleTaskUpdate,
  handleNewTask,
  handleAutoMerge,
  createNewTask
} from '@/cli/commands/triage/lib/processor/index';

/**
 * Process a task from a plan file
 * @param taskData Task data from plan
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
 */
export async function processPlanTask(
  taskData: TriageTask,
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
) {
  return processPlanTaskModular(taskData, repo, nlpService, results, options);
}

// Re-export other functions for backward compatibility
export {
  handleTaskUpdate,
  handleNewTask,
  handleAutoMerge,
  createNewTask
};