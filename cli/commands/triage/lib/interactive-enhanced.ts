/**
 * Enhanced interactive mode for triage command
 * Provides an improved UI for working with tasks
 * 
 * This file is a wrapper around the modularized implementation
 * to maintain backward compatibility
 */

import { TaskRepository } from '../../../../core/repo.ts';
import { NlpService } from '../../../../core/nlp-service-mock.ts';
import { 
  ProcessingOptions, 
  TriageResults 
} from './utils.ts';

// Import the modularized implementation
import { runInteractiveMode as runModularizedInteractiveMode } from './interactive-enhanced/index.ts';

/**
 * Run enhanced interactive triage mode
 * This is a compatibility wrapper around the modularized implementation
 */
export async function runInteractiveMode(
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void> {
  return runModularizedInteractiveMode(repo, nlpService, results, options);
}