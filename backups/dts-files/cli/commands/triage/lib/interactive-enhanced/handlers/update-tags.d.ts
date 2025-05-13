/**
 * Update task tags handler
 */
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';
/**
 * Handle updating task tags
 * @param task Task to update tags for
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export declare function handleUpdateTagsAction(task: TriageTask, repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void>;
