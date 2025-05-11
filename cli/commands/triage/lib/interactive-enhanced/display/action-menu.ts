/**
 * Action menu display for interactive triage mode
 */

import { ChalkColor, ChalkStyle } from '../../utils.ts';

/**
 * Display the action menu with available commands
 * @param hasSimilarTasks Whether similar tasks are available
 * @param colorize Colorize function for styling output
 */
export function displayActionMenu(
  hasSimilarTasks: boolean,
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): void {
  console.log(colorize('\nActions:', 'cyan', 'bold'));
  
  // Navigation commands
  console.log(colorize('  n', 'blue') + ') ' + colorize('Next', 'white') + ' - Move to next task');
  console.log(colorize('  p', 'blue') + ') ' + colorize('Previous', 'white') + ' - Move to previous task');
  
  // Task commands
  console.log(colorize('  u', 'yellow') + ') ' + colorize('Update', 'white') + ' - Update task status/readiness');
  console.log(colorize('  d', 'green') + ') ' + colorize('Done', 'white') + ' - Mark task as completed');
  console.log(colorize('  t', 'cyan') + ') ' + colorize('Tags', 'white') + ' - Add/remove tags');
  console.log(colorize('  b', 'magenta') + ') ' + colorize('Block/Unblock', 'white') + ' - Toggle blocked status');
  console.log(colorize('  c', 'green') + ') ' + colorize('Create Subtask', 'white') + ' - Add a subtask to this task');
  
  // Only show merge if similar tasks exist
  if (hasSimilarTasks) {
    console.log(colorize('  m', 'red') + ') ' + colorize('Merge', 'white') + ' - Merge with a similar task');
  }
  
  // Other commands
  console.log(colorize('  s', 'gray') + ') ' + colorize('Skip', 'white') + ' - Skip this task');
  console.log(colorize('  h', 'cyan') + ') ' + colorize('Help', 'white') + ' - Show help screen');
  console.log(colorize('  q', 'red') + ') ' + colorize('Quit', 'white') + ' - Exit triage mode');
}