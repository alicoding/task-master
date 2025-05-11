/**
 * Help screen display for interactive triage mode
 */

import readline from 'readline';
import { ChalkColor, ChalkStyle } from '../../utils.ts';

/**
 * Display help screen with all available commands
 * @param colorize Colorize function for styling output
 */
export function displayHelpScreen(
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): void {
  console.log(colorize('\n┌' + '─'.repeat(60) + '┐', 'cyan'));
  console.log(colorize('│ TRIAGE MODE HELP', 'cyan', 'bold') + colorize(' '.repeat(43) + '│', 'cyan'));
  console.log(colorize('└' + '─'.repeat(60) + '┘', 'cyan'));
  
  console.log(colorize('\nNavigation Commands:', 'blue', 'bold'));
  console.log(colorize('  n', 'blue') + ') ' + colorize('Next', 'white') + ' - Move to the next task');
  console.log(colorize('  p', 'blue') + ') ' + colorize('Previous', 'white') + ' - Move to the previous task');
  console.log(colorize('  s', 'gray') + ') ' + colorize('Skip', 'white') + ' - Skip this task (won\'t be marked as processed)');
  console.log(colorize('  q', 'red') + ') ' + colorize('Quit', 'white') + ' - Exit triage mode');
  
  console.log(colorize('\nTask Management Commands:', 'green', 'bold'));
  console.log(colorize('  u', 'yellow') + ') ' + colorize('Update', 'white') + ' - Update task status and readiness');
  console.log(colorize('  d', 'green') + ') ' + colorize('Done', 'white') + ' - Mark task as completed');
  console.log(colorize('  t', 'cyan') + ') ' + colorize('Tags', 'white') + ' - Add or remove tags');
  console.log(colorize('  b', 'magenta') + ') ' + colorize('Block/Unblock', 'white') + ' - Toggle blocked status');
  console.log(colorize('  c', 'green') + ') ' + colorize('Create Subtask', 'white') + ' - Add a subtask to this task');
  
  console.log(colorize('\nDuplication Management:', 'yellow', 'bold'));
  console.log(colorize('  m', 'red') + ') ' + colorize('Merge', 'white') + ' - Merge with a similar task (only shown when similar tasks exist)');
  
  console.log(colorize('\nOther Commands:', 'magenta', 'bold'));
  console.log(colorize('  h', 'cyan') + ') ' + colorize('Help', 'white') + ' - Show this help screen');
  
  console.log(colorize('\nTips:', 'gray', 'bold'));
  console.log(colorize('  - Tasks are presented in order: todo, in-progress, done, with draft items first', 'gray'));
  console.log(colorize('  - Similar tasks are shown when found, and can be merged to reduce duplication', 'gray'));
  console.log(colorize('  - Use the "Block/Unblock" command to quickly toggle a task\'s blocked status', 'gray'));
  console.log(colorize('  - Creating subtasks helps break down complex work into manageable pieces', 'gray'));
  console.log(colorize('  - Press Ctrl+C at any time to force exit the program', 'gray'));
  
  console.log(colorize('\nPress any key to continue...', 'cyan'));
  
  // This would be better with a single key press, but we'll use readline for now
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('', () => {
    rl.close();
  });
}