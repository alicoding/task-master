/**
 * Toggle blocked status handler
 */
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';
/**
 * Handle toggling blocked status for a task
 * @param task Task to toggle blocked status
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export declare function handleToggleBlockedAction(task: TriageTask, repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void>;
