/**
 * Help screen display for interactive triage mode
 */

import readline from 'readline';
import { ChalkStyle } from '@/cli/commands/triage/lib/utils';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Display help screen with all available commands
 * @param colorize Colorize function for styling output
 */
export function displayHelpScreen(
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): void {
  console.log(colorize('\n┌' + '─'.repeat(60) + '┐', asChalkColor('cyan')));
  console.log(colorize('│ TRIAGE MODE HELP', asChalkColor('cyan'), asChalkColor('bold')) + colorize(' '.repeat(43) + '│', asChalkColor('cyan')));
  console.log(colorize('└' + '─'.repeat(60) + '┘', asChalkColor('cyan')));
  
  console.log(colorize('\nNavigation Commands:', asChalkColor('blue'), asChalkColor('bold')));
  console.log(colorize('  n', asChalkColor('blue')) + ') ' + colorize('Next', asChalkColor('white')) + ' - Move to the next task');
  console.log(colorize('  p', asChalkColor('blue')) + ') ' + colorize('Previous', asChalkColor('white')) + ' - Move to the previous task');
  console.log(colorize('  s', asChalkColor('gray')) + ') ' + colorize('Skip', asChalkColor('white')) + ' - Skip this task (won\'t be marked as processed)');
  console.log(colorize('  q', asChalkColor('red')) + ') ' + colorize('Quit', asChalkColor('white')) + ' - Exit triage mode');
  
  console.log(colorize('\nTask Management Commands:', asChalkColor('green'), asChalkColor('bold')));
  console.log(colorize('  u', asChalkColor('yellow')) + ') ' + colorize('Update', asChalkColor('white')) + ' - Update task status and readiness');
  console.log(colorize('  d', asChalkColor('green')) + ') ' + colorize('Done', asChalkColor('white')) + ' - Mark task as completed');
  console.log(colorize('  t', asChalkColor('cyan')) + ') ' + colorize('Tags', asChalkColor('white')) + ' - Add or remove tags');
  console.log(colorize('  b', asChalkColor('magenta')) + ') ' + colorize('Block/Unblock', asChalkColor('white')) + ' - Toggle blocked status');
  console.log(colorize('  c', asChalkColor('green')) + ') ' + colorize('Create Subtask', asChalkColor('white')) + ' - Add a subtask to this task');
  
  console.log(colorize('\nDuplication Management:', asChalkColor('yellow'), asChalkColor('bold')));
  console.log(colorize('  m', asChalkColor('red')) + ') ' + colorize('Merge', asChalkColor('white')) + ' - Merge with a similar task (only shown when similar tasks exist)');
  
  console.log(colorize('\nOther Commands:', asChalkColor('magenta'), asChalkColor('bold')));
  console.log(colorize('  h', asChalkColor('cyan')) + ') ' + colorize('Help', asChalkColor('white')) + ' - Show this help screen');
  
  console.log(colorize('\nTips:', asChalkColor('gray'), asChalkColor('bold')));
  console.log(colorize('  - Tasks are presented in order: todo, in-progress, done, with draft items first', asChalkColor('gray')));
  console.log(colorize('  - Similar tasks are shown when found, and can be merged to reduce duplication', asChalkColor('gray')));
  console.log(colorize('  - Use the "Block/Unblock" command to quickly toggle a task\'s blocked status', asChalkColor('gray')));
  console.log(colorize('  - Creating subtasks helps break down complex work into manageable pieces', asChalkColor('gray')));
  console.log(colorize('  - Press Ctrl+C at any time to force exit the program', asChalkColor('gray')));
  
  console.log(colorize('\nPress any key to continue...', asChalkColor('cyan')));
  
  // This would be better with a single key press, but we'll use readline for now
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('', () => {
    rl.close();
  });
}