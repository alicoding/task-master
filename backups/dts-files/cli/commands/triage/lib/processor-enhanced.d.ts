/**
 * Enhanced processor for batch triage mode
 *
 * This file serves as a backward compatibility wrapper around the modularized
 * implementation of the enhanced task processor.
 */
import { TaskRepository } from '../../../../core/repo';
import { NlpService } from '../../../../core/nlp-service-mock';
import { ProcessingOptions, TriageResults, TriageTask } from './utils';
/**
 * Process a plan with enhanced visual output
 * Delegates to the modularized implementation
 */
export declare function processPlanWithEnhancedUI(tasks: TriageTask[], repo: TaskRepository, nlpService: NlpService, results: TriageResults, options: ProcessingOptions): Promise<void>;
/**
 * Process a task from a plan file with enhanced UI
 * Delegates to the modularized implementation
 */
export declare function processPlanTask(taskData: TriageTask, repo: TaskRepository, nlpService: NlpService, results: TriageResults, options: ProcessingOptions): Promise<void>;
