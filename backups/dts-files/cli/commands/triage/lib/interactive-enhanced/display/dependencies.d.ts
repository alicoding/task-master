/**
 * Task dependencies display for interactive triage mode
 */
import { ChalkColor, ChalkStyle } from '../../utils';

/**
 * Display dependencies for the current task
 * @param dependencies Array of task dependencies
 * @param colorize Colorize function for styling output
 */
export declare function displayDependencies(dependencies: {
    direction: 'blocked' | 'blocking';
    task: {
        id: string;
        title: string;
        status: string;
    };
}[], colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): void;
