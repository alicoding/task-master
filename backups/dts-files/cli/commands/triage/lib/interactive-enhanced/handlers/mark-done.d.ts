/**
 * Mark task as done handler
 */
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';
/**
 * Handle marking a task as done
 * @param task Task to mark as done
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export declare function handleMarkAsDoneAction(task: TriageTask, repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void>;
