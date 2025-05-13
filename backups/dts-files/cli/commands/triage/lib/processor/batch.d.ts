/**
 * Batch processing functionality
 * Handles processing multiple tasks in batch mode
 */
import { TaskRepository } from '../../../../../core/repo';
import { NlpService } from '../../../../../core/nlp-service-mock';
import { ProcessingOptions, TriageResults, TriageTask } from '../utils';
/**
 * Process a plan with enhanced visual output
 * @param tasks Tasks to process
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
 */
export declare function processPlanWithEnhancedUI(tasks: TriageTask[], repo: TaskRepository, nlpService: NlpService, results: TriageResults, options: ProcessingOptions): Promise<void>;
