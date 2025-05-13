/**
 * Similar tasks display for interactive triage mode
 */
import { ChalkColor, ChalkStyle, TriageTask } from '../../utils';

/**
 * Display similar tasks with enhanced formatting
 * @param filteredTasks Array of similar tasks
 * @param colorize Colorize function for styling output
 */
export declare function displaySimilarTasksEnhanced(filteredTasks: TriageTask[] & {
    metadata?: {
        similarityScore?: number;
        [key: string]: any;
    };
}[], colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): Promise<void>;
