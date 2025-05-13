/**
 * Help screen display for interactive triage mode
 */

import readline from 'readline';
import { ChalkColor, ChalkStyle } from '../../utils';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Display help screen with all available commands
 * @param colorize Colorize function for styling output
 */
export function displayHelpScreen(
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): void {
  console.log(colorize('\n┌' + '─'.repeat(60) + '┐', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
  console.log(colorize('│ TRIAGE MODE HELP', asChalkColor((asChalkColor(('cyan' as ChalkColor)))), asChalkColor('bold')) + colorize(' '.repeat(43) + '│', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
  console.log(colorize('└' + '─'.repeat(60) + '┘', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));

  console.log(colorize('\nNavigation Commands:', asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('  n', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + ') ' + colorize('Next', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Move to the next task');
  console.log(colorize('  p', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + ') ' + colorize('Previous', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Move to the previous task');
  console.log(colorize('  s', asChalkColor((asChalkColor(('gray' as ChalkColor))))) + ') ' + colorize('Skip', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Skip this task (won\'t be marked as processed)');
  console.log(colorize('  q', asChalkColor((asChalkColor(('red' as ChalkColor))))) + ') ' + colorize('Quit', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Exit triage mode');

  console.log(colorize('\nTask Management Commands:', asChalkColor((asChalkColor(('green' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('  u', asChalkColor((asChalkColor(('yellow' as ChalkColor))))) + ') ' + colorize('Update', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Update task status and readiness');
  console.log(colorize('  d', asChalkColor((asChalkColor(('green' as ChalkColor))))) + ') ' + colorize('Done', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Mark task as completed');
  console.log(colorize('  t', asChalkColor((asChalkColor(('cyan' as ChalkColor))))) + ') ' + colorize('Tags', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Add or remove tags');
  console.log(colorize('  b', asChalkColor((asChalkColor(('magenta' as ChalkColor))))) + ') ' + colorize('Block/Unblock', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Toggle blocked status');
  console.log(colorize('  c', asChalkColor((asChalkColor(('green' as ChalkColor))))) + ') ' + colorize('Create Subtask', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Add a subtask to this task');

  console.log(colorize('\nDuplication Management:', asChalkColor((asChalkColor(('yellow' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('  m', asChalkColor((asChalkColor(('red' as ChalkColor))))) + ') ' + colorize('Merge', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Merge with a similar task (only shown when similar tasks exist)');

  console.log(colorize('\nOther Commands:', asChalkColor((asChalkColor(('magenta' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('  h', asChalkColor((asChalkColor(('cyan' as ChalkColor))))) + ') ' + colorize('Help', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Show this help screen');

  console.log(colorize('\nTips:', asChalkColor((asChalkColor(('gray' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('  - Tasks are presented in order: todo, in-progress, done, with draft items first', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
  console.log(colorize('  - Similar tasks are shown when found, and can be merged to reduce duplication', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
  console.log(colorize('  - Use the "Block/Unblock" command to quickly toggle a task\'s blocked status', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
  console.log(colorize('  - Creating subtasks helps break down complex work into manageable pieces', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
  console.log(colorize('  - Press Ctrl+C at any time to force exit the program', asChalkColor((asChalkColor(('gray' as ChalkColor))))));

  console.log(colorize('\nPress any key to continue...', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));

  // This would be better with a single key press, but we'll use readline for now
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('', () => {
    rl.close();
  });
}