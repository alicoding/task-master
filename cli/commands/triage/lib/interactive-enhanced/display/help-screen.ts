/**
 * Help screen display for interactive triage mode
 */
import readline from 'readline';
import { ChalkColor, ChalkStyle } from '../../utils';

/**
 * Display help screen with all available commands
 * @param colorize Colorize function for styling output
 */
export function displayHelpScreen(colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string): void {
    console.log(colorize('\n┌' + '─'.repeat(60) + '┐', asChalkColor(1)));
    console.log(colorize('│ TRIAGE MODE HELP', asChalkColor(1), 'bold') + colorize(' '.repeat(43) + '│', asChalkColor(1)));
    console.log(colorize('└' + '─'.repeat(60) + '┘', asChalkColor(1)));
    console.log(colorize('\nNavigation Commands:', asChalkColor(1), 'bold'));
    console.log(colorize('  n', asChalkColor(1)) + ') ' + colorize('Next', asChalkColor(1)) + ' - Move to the next task');
    console.log(colorize('  p', asChalkColor(1)) + ') ' + colorize('Previous', asChalkColor(1)) + ' - Move to the previous task');
    console.log(colorize('  s', asChalkColor(1)) + ') ' + colorize('Skip', asChalkColor(1)) + ' - Skip this task (won\'t be marked as processed)');
    console.log(colorize('  q', asChalkColor(1)) + ') ' + colorize('Quit', asChalkColor(1)) + ' - Exit triage mode');
    console.log(colorize('\nTask Management Commands:', asChalkColor(1), 'bold'));
    console.log(colorize('  u', asChalkColor(1)) + ') ' + colorize('Update', asChalkColor(1)) + ' - Update task status and readiness');
    console.log(colorize('  d', asChalkColor(1)) + ') ' + colorize('Done', asChalkColor(1)) + ' - Mark task as completed');
    console.log(colorize('  t', asChalkColor(1)) + ') ' + colorize('Tags', asChalkColor(1)) + ' - Add or remove tags');
    console.log(colorize('  b', asChalkColor(1)) + ') ' + colorize('Block/Unblock', asChalkColor(1)) + ' - Toggle blocked status');
    console.log(colorize('  c', asChalkColor(1)) + ') ' + colorize('Create Subtask', asChalkColor(1)) + ' - Add a subtask to this task');
    console.log(colorize('\nDuplication Management:', asChalkColor(1), 'bold'));
    console.log(colorize('  m', asChalkColor(1)) + ') ' + colorize('Merge', asChalkColor(1)) + ' - Merge with a similar task (only shown when similar tasks exist)');
    console.log(colorize('\nOther Commands:', asChalkColor(1), 'bold'));
    console.log(colorize('  h', asChalkColor(1)) + ') ' + colorize('Help', asChalkColor(1)) + ' - Show this help screen');
    console.log(colorize('\nTips:', asChalkColor(1), 'bold'));
    console.log(colorize('  - Tasks are presented in order: todo, in-progress, done, with draft items first', asChalkColor(1)));
    console.log(colorize('  - Similar tasks are shown when found, and can be merged to reduce duplication', asChalkColor(1)));
    console.log(colorize('  - Use the "Block/Unblock" command to quickly toggle a task\'s blocked status', asChalkColor(1)));
    console.log(colorize('  - Creating subtasks helps break down complex work into manageable pieces', asChalkColor(1)));
    console.log(colorize('  - Press Ctrl+C at any time to force exit the program', asChalkColor(1)));
    console.log(colorize('\nPress any key to continue...', asChalkColor(1)));
    // This would be better with a single key press, but we'll use readline for now
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('', () => {
        rl.close();
    });
}
