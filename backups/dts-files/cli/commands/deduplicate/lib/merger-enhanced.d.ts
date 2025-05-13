/**
 * Enhanced merger functionality with improved UX
 */
import { TaskRepository } from '../../../../core/repo';
import { DuplicateGroup, ColorizeFunction } from './utils';
/**
 * Result of a merge operation
 */
interface MergeResult {
    action: 'merged' | 'skipped' | 'cancelled';
    primaryTaskId?: string;
    tasksDeleted?: number;
    tasksMarkedAsDuplicate?: number;
}
/**
 * Handle merging tasks in a group with improved UX
 */
export declare function handleMerge(group: DuplicateGroup, repo: TaskRepository, colorize: ColorizeFunction): Promise<MergeResult>;
/**
 * Show auto-merge suggestion with enhanced UI
 */
export declare function suggestMerge(group: DuplicateGroup, repo: TaskRepository, colorize: ColorizeFunction, groupNumber: number, totalGroups: number): Promise<MergeResult>;
export {};
