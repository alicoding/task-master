/**
 * Simple text formatter for task graph visualization
 */
import { TaskWithChildren } from '../../types';
/**
 * Original simple format with indentation
 */
export declare function formatSimpleText(tasks: TaskWithChildren[], level?: number, options?: any): string;
