/**
 * Action menu display for interactive triage mode
 */

import { ChalkStyle } from '@/cli/commands/triage/lib/utils';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Display the action menu with available commands
 * @param hasSimilarTasks Whether similar tasks are available
 * @param colorize Colorize function for styling output
 */
export function displayActionMenu(
  hasSimilarTasks: boolean,
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): void {
  console.log(colorize('\nActions:', asChalkColor('cyan'), asChalkColor('bold')));
  
  // Navigation commands
  console.log(colorize('  n', asChalkColor('blue')) + ') ' + colorize('Next', asChalkColor('white')) + ' - Move to next task');
  console.log(colorize('  p', asChalkColor('blue')) + ') ' + colorize('Previous', asChalkColor('white')) + ' - Move to previous task');
  
  // Task commands
  console.log(colorize('  u', asChalkColor('yellow')) + ') ' + colorize('Update', asChalkColor('white')) + ' - Update task status/readiness');
  console.log(colorize('  d', asChalkColor('green')) + ') ' + colorize('Done', asChalkColor('white')) + ' - Mark task as completed');
  console.log(colorize('  t', asChalkColor('cyan')) + ') ' + colorize('Tags', asChalkColor('white')) + ' - Add/remove tags');
  console.log(colorize('  b', asChalkColor('magenta')) + ') ' + colorize('Block/Unblock', asChalkColor('white')) + ' - Toggle blocked status');
  console.log(colorize('  c', asChalkColor('green')) + ') ' + colorize('Create Subtask', asChalkColor('white')) + ' - Add a subtask to this task');
  
  // Only show merge if similar tasks exist
  if (hasSimilarTasks) {
    console.log(colorize('  m', asChalkColor('red')) + ') ' + colorize('Merge', asChalkColor('white')) + ' - Merge with a similar task');
  }
  
  // Other commands
  console.log(colorize('  s', asChalkColor('gray')) + ') ' + colorize('Skip', asChalkColor('white')) + ' - Skip this task');
  console.log(colorize('  h', asChalkColor('cyan')) + ') ' + colorize('Help', asChalkColor('white')) + ' - Show help screen');
  console.log(colorize('  q', asChalkColor('red')) + ') ' + colorize('Quit', asChalkColor('white')) + ' - Exit triage mode');
}