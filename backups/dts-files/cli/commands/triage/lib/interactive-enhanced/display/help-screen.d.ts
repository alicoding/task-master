/**
 * Help screen display for interactive triage mode
 */
import { ChalkColor, ChalkStyle } from '../../utils';

/**
 * Display help screen with all available commands
 * @param colorize Colorize function for styling output
 */
export declare function displayHelpScreen(colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): void;
