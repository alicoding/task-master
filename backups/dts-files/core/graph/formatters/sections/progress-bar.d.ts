/**
 * Progress bar formatter for task display
 * Creates visual indicators for task status and completion
 */
import { Task } from '../../../types';
/**
 * Create a beautiful, styled progress bar
 * @param task The task to create a progress bar for
 * @param width The width of the progress bar
 * @param useColor Whether to use colors in the output
 * @returns Formatted progress bar string
 */
export declare function createProgressBar(task: Task, width?: number, useColor?: boolean): Promise<string>;
