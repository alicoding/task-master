/**
 * Auto-merge functionality
 * Handles merging similar tasks automatically
 */
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../utils';
/**
 * Task with similarity metadata
 */
export interface SimilarTask {
    id: string;
    title: string;
    status: string;
    readiness?: string;
    tags: string[];
    metadata?: {
        similarityScore?: number;
        [key: string]: any;
    };
}
/**
 * Handle automatic merging of similar tasks
 * @param taskData Task data
 * @param filteredTasks Similar tasks
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
export declare function handleAutoMerge(taskData: TriageTask, filteredTasks: SimilarTask[], repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void>;
