/**
 * DOT format generator for task graph visualization
 */
import { TaskWithChildren } from '../../types';
/**
 * Format tasks in DOT format for Graphviz
 */
export declare function formatHierarchyDot(tasks?: TaskWithChildren[]): string;
