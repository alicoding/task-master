/**
 * Merge task with similar task handler
 */
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';
/**
 * Handle merging task with a similar task
 * @param task Task to merge
 * @param filteredTasks Similar tasks to potentially merge with
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export declare function handleMergeTaskAction(task: TriageTask, filteredTasks: TriageTask[], repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void>;
