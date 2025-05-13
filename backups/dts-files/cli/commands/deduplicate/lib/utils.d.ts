import { Task } from '../../../../db/schema';
import { ChalkColor, ChalkStyle } from '../../../utils/chalk-utils';
/**
 * Type for colorize function
 */
export type ColorizeFunction = (text: string, color?: ChalkColor, style?: ChalkStyle) => string;
/**
 * Options for processing duplicates
 */
export interface DeduplicateOptions {
    dryRun: boolean;
    minSimilarity: number;
    limit: number;
    useColors: boolean;
    jsonOutput: boolean;
    autoMerge: boolean;
}
/**
 * Structure for duplicate group
 */
export interface DuplicateGroup {
    tasks: Task[];
    maxSimilarity: number;
    similarityMatrix: number[][];
}
/**
 * Create a colorize function for consistent output styling
 */
export declare function createColorize(useColors: boolean, jsonOutput: boolean): ColorizeFunction;
/**
 * Format output for JSON
 */
export declare function formatJsonOutput(duplicateGroups: DuplicateGroup[], totalGroups: number, minSimilarity: number, dryRun: boolean): string;
/**
 * Format empty results message
 */
export declare function getEmptyResultsMessage(minSimilarity: number, jsonOutput: boolean): string;
/**
 * Format no tasks message
 */
export declare function getNoTasksMessage(jsonOutput: boolean): string;
