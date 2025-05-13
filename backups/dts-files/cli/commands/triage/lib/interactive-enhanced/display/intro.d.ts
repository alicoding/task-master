/**
 * Introduction display for interactive triage mode
 */
import { ChalkColor, ChalkStyle } from '../../utils';

/**
 * Display intro message for interactive mode
 * @param taskCount Number of pending tasks to triage
 * @param colorize Colorize function for styling output
 */
export declare function displayInteractiveIntro(taskCount: number, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): void;
