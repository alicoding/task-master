import { TaskRepository } from '../../../../core/repo';
import { DuplicateGroup, ColorizeFunction } from './utils';
/**
 * Handle merging tasks in a group
 * @param group Group of tasks to merge
 * @param repo Task repository
 * @param colorize Color function
 */
export declare function handleMerge(group: DuplicateGroup, repo: TaskRepository, colorize: ColorizeFunction): Promise<void>;
/**
 * Show auto-merge suggestion for a group
 * @param group Group of tasks
 * @param repo Task repository
 * @param colorize Color function
 */
export declare function suggestMerge(group: DuplicateGroup, repo: TaskRepository, colorize: ColorizeFunction): Promise<void>;
