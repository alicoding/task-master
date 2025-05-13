/**
 * Update task status and readiness handler
 */
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';
/**
 * Handle updating task status and readiness
 * @param task Task to update
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export declare function handleUpdateTaskAction(task: TriageTask, repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void>;
