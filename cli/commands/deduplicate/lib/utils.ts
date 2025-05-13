import { Task } from '@/core/types';
import { ChalkColor, ChalkStyle, colorize } from '../../../utils/chalk-utils';
/**
 * Import ColorizeFunction type from chalk-utils
 * 
 * @deprecated - Use ColorizeFunction from '@/cli/utils/chalk-utils' directly
 */
import { ColorizeFunction as BaseColorizeFunction } from '@/cli/utils/chalk-utils';
export type ColorizeFunction = BaseColorizeFunction;
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
export function createColorize(useColors: boolean, jsonOutput: boolean): ColorizeFunction {
    return function colorizeText(text: string, color?: ChalkColor, style?: ChalkStyle): string {
        if (!useColors || jsonOutput)
            return text;
        return colorize(text, color, style);
    };
}
/**
 * Format output for JSON
 */
export function formatJsonOutput(duplicateGroups: DuplicateGroup[], totalGroups: number, minSimilarity: number, dryRun: boolean) {
    return JSON.stringify({
        duplicateGroups,
        totalGroups,
        minSimilarity: minSimilarity * 100,
        dryRun
    }, null, 2);
}
/**
 * Format empty results message
 */
export function getEmptyResultsMessage(minSimilarity: number, jsonOutput: boolean) {
    if (jsonOutput) {
        return JSON.stringify({
            duplicateGroups: [],
            message: `No duplicate tasks found with similarity >= ${minSimilarity * 100}%`
        });
    }
    else {
        return `No duplicate tasks found with similarity >= ${minSimilarity * 100}%.
Try lowering the min-similarity threshold to find more potential duplicates.`;
    }
}
/**
 * Format no tasks message
 */
export function getNoTasksMessage(jsonOutput: boolean) {
    if (jsonOutput) {
        return JSON.stringify({ duplicateGroups: [], message: 'No tasks found matching filters' });
    }
    else {
        return 'No tasks found matching the specified filters.';
    }
}
