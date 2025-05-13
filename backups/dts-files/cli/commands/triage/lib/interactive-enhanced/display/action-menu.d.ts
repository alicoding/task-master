/**
 * Action menu display for interactive triage mode
 */
import { ChalkColor, ChalkStyle } from '../../utils';

/**
 * Display the action menu with available commands
 * @param hasSimilarTasks Whether similar tasks are available
 * @param colorize Colorize function for styling output
 */
export declare function displayActionMenu(hasSimilarTasks: boolean, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): void;
