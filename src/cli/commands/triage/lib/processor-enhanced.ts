/**
 * Enhanced processor for batch triage mode
 * 
 * This file serves as a backward compatibility wrapper around the modularized
 * implementation of the enhanced task processor.
 */

import { TaskRepository } from '@/core/repo';
import { NlpService } from '@/core/nlp-service-mock';
import { ProcessingOptions, TriageResults, TriageTask, ChalkColor } from '@/cli/commands/triage/lib/utils';

// Import from the modularized implementation
import {
  processPlanTask as processPlanTaskModular,
  processPlanWithEnhancedUI as processPlanWithEnhancedUIModular
} from '@/cli/commands/triage/lib/processor/index';

/**
 * Process a plan with enhanced visual output
 * Delegates to the modularized implementation
 */
export async function processPlanWithEnhancedUI(
  tasks: TriageTask[],
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
) {
  return processPlanWithEnhancedUIModular(tasks, repo, nlpService, results, options);
}

/**
 * Process a task from a plan file with enhanced UI
 * Delegates to the modularized implementation
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