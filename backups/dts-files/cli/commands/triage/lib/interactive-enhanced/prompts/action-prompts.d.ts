/**
 * User action prompts for interactive triage mode
 */
import { ChalkColor, ChalkStyle } from '../../utils';

/**
 * Prompt user for action
 * @param colorize Colorize function for styling output
 * @returns User's action selection
 */
export declare function promptForAction(colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): Promise<string>;
