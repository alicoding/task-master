/**
 * Similarity checking functionality
 * Handles checking for similar tasks when creating new tasks
 */
import { TaskRepository } from '../../../../../core/repo';
import { NlpService } from '../../../../../core/nlp-service-mock';
import { ProcessingOptions, TriageResults, TriageTask } from '../utils';
/**
 * Handle creating a new task with duplicate detection
 * @param taskData Task data
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
 */
export declare function handleNewTask(taskData: TriageTask, repo: TaskRepository, nlpService: NlpService, results: TriageResults, options: ProcessingOptions): Promise<void>;
