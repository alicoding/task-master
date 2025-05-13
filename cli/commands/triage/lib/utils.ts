import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import chalk from 'chalk';
import { TaskReadiness, TaskStatus } from '../../../../core/types';
// Define allowed color and style types
export type ChalkColor = 'blue' | 'yellow' | 'green' | 'red' | 'magenta' | 'cyan' | 'gray' | 'white';
export type ChalkStyle = 'bold' | 'italic' | 'underline' | 'dim';
/**
 * Colorize status text
 * @param status Status value
 * @param colorize Color function
 * @returns Colorized status text
 */
export function colorizeStatus(status: string, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): string {
    switch (status) {
        case 'todo':
            return colorize(status, asChalkColor((asChalkColor(('blue')))));
        case 'in-progress':
            return colorize(status, asChalkColor((asChalkColor(('yellow')))));
        case 'done':
            return colorize(status, asChalkColor((asChalkColor(('green')))));
        default:
            return status;
    }
}
/**
 * Colorize readiness text
 * @param readiness Readiness value
 * @param colorize Color function
 * @returns Colorized readiness text
 */
export function colorizeReadiness(readiness: string, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): string {
    switch (readiness) {
        case 'draft':
            return colorize(readiness, asChalkColor((asChalkColor(('gray')))));
        case 'ready':
            return colorize(readiness, asChalkColor((asChalkColor(('green')))));
        case 'blocked':
            return colorize(readiness, asChalkColor((asChalkColor(('red')))));
        default:
            return readiness;
    }
}
/**
 * Create a colorize function that applies colors only if enabled
 * @param useColors Whether to use colors
 * @param jsonOutput Whether JSON output is enabled
 * @returns Colorize function
 */
export function createColorize(useColors: boolean, jsonOutput: boolean) {
    return (text: string, color?: ChalkColor, style?: ChalkStyle) => {
        if (!useColors || jsonOutput)
            return text;
        let result = text;
        // Apply color if specified
        if (color) {
            // Type guards to make TypeScript happy
            switch (color) {
                case 'blue':
                    result = chalk.blue(result);
                    break;
                case 'yellow':
                    result = chalk.yellow(result);
                    break;
                case 'green':
                    result = chalk.green(result);
                    break;
                case 'red':
                    result = chalk.red(result);
                    break;
                case 'magenta':
                    result = chalk.magenta(result);
                    break;
                case 'cyan':
                    result = chalk.cyan(result);
                    break;
                case 'gray':
                    result = chalk.gray(result);
                    break;
                case 'white':
                    result = chalk.white(result);
                    break;
            }
        }
        // Apply style if specified
        if (style) {
            switch (style) {
                case 'bold':
                    result = chalk.bold(result);
                    break;
                case 'italic':
                    result = chalk.italic(result);
                    break;
                case 'underline':
                    result = chalk.underline(result);
                    break;
                case 'dim':
                    result = chalk.dim(result);
                    break;
            }
        }
        return result;
    };
}
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
export function createEmptyResults(): TriageResults {
    return {
        added: [],
        updated: [],
        merged: [],
        skipped: [],
        errors: []
    };
}
