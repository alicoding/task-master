/**
 * Core task processing functionality
 * Handles processing of individual task entries from a plan
 */
import { TaskRepository } from '../../../../../core/repo';
import { NlpService } from '../../../../../core/nlp-service-mock';
import { ProcessingOptions, TriageResults, TriageTask } from '../utils';
/**
 * Process a task from a plan file
 * @param taskData Task data from plan
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
 */
export declare function processPlanTask(taskData: TriageTask, repo: TaskRepository, nlpService: NlpService, results: TriageResults, options: ProcessingOptions): Promise<void>;
