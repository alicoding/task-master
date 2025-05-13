/**
 * Detailed text formatter for task graph visualization
 */
import { TaskWithChildren } from '../../types';
/**
 * Detailed text format with full information
 */
export declare function formatDetailedText(tasks: TaskWithChildren[], options?: any): string;
/**
 * Compact text format showing just essentials
 */
export declare function formatCompactText(tasks: TaskWithChildren[], options?: any): string;
