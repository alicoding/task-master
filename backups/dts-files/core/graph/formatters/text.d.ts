/**
 * Text formatters for task graph visualization
 */
import { Task, TaskWithChildren } from '../../types';
import { formatSimpleText } from './simple';
import { formatTreeText, formatHierarchyWithSymbols } from './tree';
import { formatDetailedText, formatCompactText } from './detailed';
import { formatEnhancedTree } from './enhanced-tree';
import { formatBoxedTask } from './boxed-task';
import { formatEnhancedTask } from './enhanced-boxed-task';
import { formatPolishedTask } from './polished-task';
import { formatTaskTable } from './table-list';
import { createUiConfig, parseCliOptions } from './ui-config';
/**
 * Format tasks for human-readable display
 */
export declare function formatHierarchyText(tasks?: TaskWithChildren[], format?: string, options?: any): Promise<string>;
/**
 * Format a single task with enhanced visual display
 */
export declare function formatTaskView(task: Task, format?: string, options?: any): Promise<string>;
/**
 * Format a list of tasks with table or list view
 */
export declare function formatTaskList(tasks: Task[], format?: string, options?: any): Promise<string>;
export { formatSimpleText, formatTreeText, formatDetailedText, formatCompactText, formatHierarchyWithSymbols, formatEnhancedTree, formatBoxedTask, formatEnhancedTask, formatPolishedTask, formatTaskTable, createUiConfig, parseCliOptions };
