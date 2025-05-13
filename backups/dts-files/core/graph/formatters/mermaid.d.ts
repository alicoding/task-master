/**
 * Mermaid format generator for task graph visualization
 */
import { TaskWithChildren } from '../../types';
/**
 * Format tasks in Mermaid flowchart format
 */
export declare function formatHierarchyMermaid(tasks?: TaskWithChildren[]): string;
