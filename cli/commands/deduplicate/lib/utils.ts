import { Task } from '../../../../db/schema.ts';
import { ChalkColor, ChalkStyle, colorize } from '../../../utils/chalk-utils.ts';

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
export function createColorize(useColors: boolean, jsonOutput: boolean): ColorizeFunction {
  return function colorizeText(text: string, color?: ChalkColor, style?: ChalkStyle): string {
    if (!useColors || jsonOutput) return text;
    return colorize(text, color, style);
  };
}

/**
 * Format output for JSON
 */
export function formatJsonOutput(
  duplicateGroups: DuplicateGroup[],
  totalGroups: number,
  minSimilarity: number,
  dryRun: boolean
) {
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
  } else {
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
  } else {
    return 'No tasks found matching the specified filters.';
  }
}