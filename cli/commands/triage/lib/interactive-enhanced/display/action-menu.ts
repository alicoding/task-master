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
  console.log(colorize('\nActions:', asChalkColor((asChalkColor(('cyan' as ChalkColor)))), asChalkColor('bold')));

  // Navigation commands
  console.log(colorize('  n', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + ') ' + colorize('Next', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Move to next task');
  console.log(colorize('  p', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + ') ' + colorize('Previous', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Move to previous task');

  // Task commands
  console.log(colorize('  u', asChalkColor((asChalkColor(('yellow' as ChalkColor))))) + ') ' + colorize('Update', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Update task status/readiness');
  console.log(colorize('  d', asChalkColor((asChalkColor(('green' as ChalkColor))))) + ') ' + colorize('Done', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Mark task as completed');
  console.log(colorize('  t', asChalkColor((asChalkColor(('cyan' as ChalkColor))))) + ') ' + colorize('Tags', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Add/remove tags');
  console.log(colorize('  b', asChalkColor((asChalkColor(('magenta' as ChalkColor))))) + ') ' + colorize('Block/Unblock', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Toggle blocked status');
  console.log(colorize('  c', asChalkColor((asChalkColor(('green' as ChalkColor))))) + ') ' + colorize('Create Subtask', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Add a subtask to this task');

  // Only show merge if similar tasks exist
  if (hasSimilarTasks) {
    console.log(colorize('  m', asChalkColor((asChalkColor(('red' as ChalkColor))))) + ') ' + colorize('Merge', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Merge with a similar task');
  }

  // Other commands
  console.log(colorize('  s', asChalkColor((asChalkColor(('gray' as ChalkColor))))) + ') ' + colorize('Skip', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Skip this task');
  console.log(colorize('  h', asChalkColor((asChalkColor(('cyan' as ChalkColor))))) + ') ' + colorize('Help', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Show help screen');
  console.log(colorize('  q', asChalkColor((asChalkColor(('red' as ChalkColor))))) + ') ' + colorize('Quit', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Exit triage mode');
}