/**
 * JSON formatters for task graph visualization
 */
import { TaskWithChildren } from '../../types';
/**
 * Format tasks for machine-readable JSON
 */
export declare function formatHierarchyJson(tasks: TaskWithChildren[], format?: string): any;
/**
 * Format as flat array (original format)
 */
export declare function formatFlatJson(tasks: TaskWithChildren[]): any[];
/**
 * Format preserving tree hierarchy for visualization
 */
export declare function formatTreeJson(tasks: TaskWithChildren[]): any[];
/**
 * Format as nodes and edges for graph visualization tools
 */
export declare function formatGraphJson(tasks: TaskWithChildren[]): any;
/**
 * Format with rich metadata for AI processing
 */
export declare function formatAiJson(tasks: TaskWithChildren[]): any;
