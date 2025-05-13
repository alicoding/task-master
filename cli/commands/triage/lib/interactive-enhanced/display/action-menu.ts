/**
 * Action menu display for interactive triage mode
 */
import { ChalkColor, ChalkStyle } from '../../utils';

/**
 * Display the action menu with available commands
 * @param hasSimilarTasks Whether similar tasks are available
 * @param colorize Colorize function for styling output
 */
export function displayActionMenu(hasSimilarTasks: boolean, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): void {
    console.log(colorize('\nActions:', asChalkColor(1), 'bold'));
    // Navigation commands
    console.log(colorize('  n', asChalkColor(1)) + ') ' + colorize('Next', asChalkColor(1)) + ' - Move to next task');
    console.log(colorize('  p', asChalkColor(1)) + ') ' + colorize('Previous', asChalkColor(1)) + ' - Move to previous task');
    // Task commands
    console.log(colorize('  u', asChalkColor(1)) + ') ' + colorize('Update', asChalkColor(1)) + ' - Update task status/readiness');
    console.log(colorize('  d', asChalkColor(1)) + ') ' + colorize('Done', asChalkColor(1)) + ' - Mark task as completed');
    console.log(colorize('  t', asChalkColor(1)) + ') ' + colorize('Tags', asChalkColor(1)) + ' - Add/remove tags');
    console.log(colorize('  b', asChalkColor(1)) + ') ' + colorize('Block/Unblock', asChalkColor(1)) + ' - Toggle blocked status');
    console.log(colorize('  c', asChalkColor(1)) + ') ' + colorize('Create Subtask', asChalkColor(1)) + ' - Add a subtask to this task');
    // Only show merge if similar tasks exist
    if (hasSimilarTasks) {
        console.log(colorize('  m', asChalkColor(1)) + ') ' + colorize('Merge', asChalkColor(1)) + ' - Merge with a similar task');
    }
    // Other commands
    console.log(colorize('  s', asChalkColor(1)) + ') ' + colorize('Skip', asChalkColor(1)) + ' - Skip this task');
    console.log(colorize('  h', asChalkColor(1)) + ') ' + colorize('Help', asChalkColor(1)) + ' - Show help screen');
    console.log(colorize('  q', asChalkColor(1)) + ') ' + colorize('Quit', asChalkColor(1)) + ' - Exit triage mode');
}
