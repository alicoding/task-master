/**
 * Create subtask handler
 */
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';
/**
 * Handle creating a subtask for the current task
 * @param task Parent task
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export declare function handleCreateSubtaskAction(task: TriageTask, repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void>;
