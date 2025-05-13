/**
 * Tree text formatter for task graph visualization
 */
import { TaskWithChildren } from '../../types';
/**
 * Get status symbol for visual display
 */
export declare function getStatusSymbol(status: string): string;
/**
 * Get readiness symbol for visual display
 */
export declare function getReadinessSymbol(readiness: string): string;
/**
 * ASCII tree format with lines and symbols
 */
export declare function formatTreeText(tasks: TaskWithChildren[], options?: any): string;
/**
 * Original formatHierarchyWithSymbols function from CLI for backward compatibility
 */
export declare function formatHierarchyWithSymbols(tasks: TaskWithChildren[], compact?: boolean, showMetadata?: boolean, useColor?: boolean, level?: number, prefix?: string): string;
