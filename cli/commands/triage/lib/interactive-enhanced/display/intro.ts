/**
 * Introduction display for interactive triage mode
 */

import { ChalkColor, ChalkStyle } from '../../utils';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Display intro message for interactive mode
 * @param taskCount Number of pending tasks to triage
 * @param colorize Colorize function for styling output
 */
export function displayInteractiveIntro(
  taskCount: number, 
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): void {
  console.log(colorize('\n┌' + '─'.repeat(60) + '┐', asChalkColor((asChalkColor((asChalkColor('blue')))))));
  console.log(colorize('│ INTERACTIVE TASK TRIAGE', asChalkColor((asChalkColor((asChalkColor('blue'))))), asChalkColor('bold')) + colorize(' '.repeat(37) + '│', asChalkColor((asChalkColor((asChalkColor('blue')))))));
  console.log(colorize('└' + '─'.repeat(60) + '┘', asChalkColor((asChalkColor((asChalkColor('blue')))))));
  
  console.log(colorize(`\nFound ${taskCount} pending tasks to triage.`, asChalkColor((asChalkColor((asChalkColor('green')))))));
  console.log(colorize('Tasks will be presented one by one for review and action.', asChalkColor((asChalkColor((asChalkColor('gray')))))));
  console.log(colorize('Navigate with "n" for next and "p" for previous.', asChalkColor((asChalkColor((asChalkColor('gray')))))));
  console.log(colorize('Press "h" at any time to see all available commands.', asChalkColor((asChalkColor((asChalkColor('gray')))))));
  console.log(colorize('Press Ctrl+C to exit at any time.\n', asChalkColor((asChalkColor((asChalkColor('gray')))))));
}