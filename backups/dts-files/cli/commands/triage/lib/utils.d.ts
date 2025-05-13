import { TaskReadiness, TaskStatus } from '../../../../core/types';
import { ChalkColor } from "@/cli/utils/chalk-utils";

export type ChalkColor = 'blue' | 'yellow' | 'green' | 'red' | 'magenta' | 'cyan' | 'gray' | 'white';
export type ChalkStyle = 'bold' | 'italic' | 'underline' | 'dim';
/**
 * Colorize status text
 * @param status Status value
 * @param colorize Color function
 * @returns Colorized status text
 */
export declare function colorizeStatus(status: string, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): string;
/**
 * Colorize readiness text
 * @param readiness Readiness value
 * @param colorize Color function
 * @returns Colorized readiness text
 */
export declare function colorizeReadiness(readiness: string, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): string;
/**
 * Create a colorize function that applies colors only if enabled
 * @param useColors Whether to use colors
 * @param jsonOutput Whether JSON output is enabled
 * @returns Colorize function
 */
export declare function createColorize(useColors: boolean, jsonOutput: boolean): (text: string, color?: ChalkColor, style?: ChalkStyle) => string;
/**
 * Define the processing options type
 */
export interface ProcessingOptions {
    dryRun: boolean;
    similarityThreshold: number;
    autoMerge: boolean;
    colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string;
    jsonOutput: boolean;
}
/**
 * Define the triage task type
 */
export interface TriageTask {
    id?: string;
    title: string;
    status?: TaskStatus;
    readiness?: TaskReadiness;
    tags?: string[];
    metadata?: Record<string, any>;
    parentId?: string;
    childOf?: string;
    after?: string;
    force?: boolean;
}
/**
 * Define the results tracking type
 */
export interface TriageResults {
    added: any[];
    updated: any[];
    merged: any[];
    skipped: any[];
    errors: string[];
}
/**
 * Initialize empty results object
 * @returns Empty results object
 */
export declare function createEmptyResults(): TriageResults;
