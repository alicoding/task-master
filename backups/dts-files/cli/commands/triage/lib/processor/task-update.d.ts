/**
 * Task update functionality
 * Handles updating existing tasks
 */
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../utils';
/**
 * Handle updating an existing task
 * @param taskData Task data
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
export declare function handleTaskUpdate(taskData: TriageTask, repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void>;
