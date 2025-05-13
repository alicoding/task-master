/**
 * Task creation functionality
 * Handles creating new tasks
 */
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../utils';
/**
 * Create a new task
 * @param taskData Task data
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
export declare function createNewTask(taskData: TriageTask, repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void>;
