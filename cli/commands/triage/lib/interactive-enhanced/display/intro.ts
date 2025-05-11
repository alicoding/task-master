/**
 * Introduction display for interactive triage mode
 */

import { ChalkColor, ChalkStyle } from '../../utils.ts';

/**
 * Display intro message for interactive mode
 * @param taskCount Number of pending tasks to triage
 * @param colorize Colorize function for styling output
 */
export function displayInteractiveIntro(
  taskCount: number, 
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): void {
  console.log(colorize('\n┌' + '─'.repeat(60) + '┐', 'blue'));
  console.log(colorize('│ INTERACTIVE TASK TRIAGE', 'blue', 'bold') + colorize(' '.repeat(37) + '│', 'blue'));
  console.log(colorize('└' + '─'.repeat(60) + '┘', 'blue'));
  
  console.log(colorize(`\nFound ${taskCount} pending tasks to triage.`, 'green'));
  console.log(colorize('Tasks will be presented one by one for review and action.', 'gray'));
  console.log(colorize('Navigate with "n" for next and "p" for previous.', 'gray'));
  console.log(colorize('Press "h" at any time to see all available commands.', 'gray'));
  console.log(colorize('Press Ctrl+C to exit at any time.\n', 'gray'));
}