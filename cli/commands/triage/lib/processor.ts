/**
 * Task processor functionality
 * 
 * This file serves as a backward compatibility wrapper around the modularized
 * implementation of the task processor.
 */

import { TaskRepository } from '../../../../core/repo.ts';
import { NlpService } from '../../../../core/nlp-service.ts';
import { ProcessingOptions, TriageResults, TriageTask } from './utils.ts';

// Import from the modularized implementation
import {
  processPlanTask as processPlanTaskModular,
  handleTaskUpdate,
  handleNewTask,
  handleAutoMerge,
  createNewTask
} from './processor/index.ts';

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