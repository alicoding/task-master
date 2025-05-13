/**
 * Action menu display for interactive triage mode
 */

import { ChalkColor, ChalkStyle } from '../../utils';
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
  console.log(colorize('\nActions:', asChalkColor((asChalkColor((asChalkColor('cyan'))))), asChalkColor('bold')));

  // Navigation commands
  console.log(colorize('  n', asChalkColor((asChalkColor((asChalkColor('blue')))))) + ') ' + colorize('Next', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Move to next task');
  console.log(colorize('  p', asChalkColor((asChalkColor((asChalkColor('blue')))))) + ') ' + colorize('Previous', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Move to previous task');

  // Task commands
  console.log(colorize('  u', asChalkColor((asChalkColor((asChalkColor('yellow')))))) + ') ' + colorize('Update', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Update task status/readiness');
  console.log(colorize('  d', asChalkColor((asChalkColor((asChalkColor('green')))))) + ') ' + colorize('Done', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Mark task as completed');
  console.log(colorize('  t', asChalkColor((asChalkColor((asChalkColor('cyan')))))) + ') ' + colorize('Tags', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Add/remove tags');
  console.log(colorize('  b', asChalkColor((asChalkColor((asChalkColor('magenta')))))) + ') ' + colorize('Block/Unblock', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Toggle blocked status');
  console.log(colorize('  c', asChalkColor((asChalkColor((asChalkColor('green')))))) + ') ' + colorize('Create Subtask', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Add a subtask to this task');

  // Only show merge if similar tasks exist
  if (hasSimilarTasks) {
    console.log(colorize('  m', asChalkColor((asChalkColor((asChalkColor('red')))))) + ') ' + colorize('Merge', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Merge with a similar task');
  }

  // Other commands
  console.log(colorize('  s', asChalkColor((asChalkColor((asChalkColor('gray')))))) + ') ' + colorize('Skip', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Skip this task');
  console.log(colorize('  h', asChalkColor((asChalkColor((asChalkColor('cyan')))))) + ') ' + colorize('Help', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Show help screen');
  console.log(colorize('  q', asChalkColor((asChalkColor((asChalkColor('red')))))) + ') ' + colorize('Quit', asChalkColor((asChalkColor((asChalkColor('white')))))) + ' - Exit triage mode');
}