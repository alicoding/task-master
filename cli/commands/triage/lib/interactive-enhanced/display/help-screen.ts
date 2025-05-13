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
    console.log(colorize('\n┌' + '─'.repeat(60) + '┐', asChalkColor((asChalkColor(('cyan'))))));
    console.log(colorize('│ TRIAGE MODE HELP', asChalkColor((asChalkColor(('cyan')))), 'bold') + colorize(' '.repeat(43) + '│', asChalkColor((asChalkColor(('cyan'))))));
    console.log(colorize('└' + '─'.repeat(60) + '┘', asChalkColor((asChalkColor(('cyan'))))));
    console.log(colorize('\nNavigation Commands:', asChalkColor((asChalkColor(('blue')))), 'bold'));
    console.log(colorize('  n', asChalkColor((asChalkColor(('blue'))))) + ') ' + colorize('Next', asChalkColor((asChalkColor(('white'))))) + ' - Move to the next task');
    console.log(colorize('  p', asChalkColor((asChalkColor(('blue'))))) + ') ' + colorize('Previous', asChalkColor((asChalkColor(('white'))))) + ' - Move to the previous task');
    console.log(colorize('  s', asChalkColor((asChalkColor(('gray'))))) + ') ' + colorize('Skip', asChalkColor((asChalkColor(('white'))))) + ' - Skip this task (won\'t be marked as processed)');
    console.log(colorize('  q', asChalkColor((asChalkColor(('red'))))) + ') ' + colorize('Quit', asChalkColor((asChalkColor(('white'))))) + ' - Exit triage mode');
    console.log(colorize('\nTask Management Commands:', asChalkColor((asChalkColor(('green')))), 'bold'));
    console.log(colorize('  u', asChalkColor((asChalkColor(('yellow'))))) + ') ' + colorize('Update', asChalkColor((asChalkColor(('white'))))) + ' - Update task status and readiness');
    console.log(colorize('  d', asChalkColor((asChalkColor(('green'))))) + ') ' + colorize('Done', asChalkColor((asChalkColor(('white'))))) + ' - Mark task as completed');
    console.log(colorize('  t', asChalkColor((asChalkColor(('cyan'))))) + ') ' + colorize('Tags', asChalkColor((asChalkColor(('white'))))) + ' - Add or remove tags');
    console.log(colorize('  b', asChalkColor((asChalkColor(('magenta'))))) + ') ' + colorize('Block/Unblock', asChalkColor((asChalkColor(('white'))))) + ' - Toggle blocked status');
    console.log(colorize('  c', asChalkColor((asChalkColor(('green'))))) + ') ' + colorize('Create Subtask', asChalkColor((asChalkColor(('white'))))) + ' - Add a subtask to this task');
    console.log(colorize('\nDuplication Management:', asChalkColor((asChalkColor(('yellow')))), 'bold'));
    console.log(colorize('  m', asChalkColor((asChalkColor(('red'))))) + ') ' + colorize('Merge', asChalkColor((asChalkColor(('white'))))) + ' - Merge with a similar task (only shown when similar tasks exist)');
    console.log(colorize('\nOther Commands:', asChalkColor((asChalkColor(('magenta')))), 'bold'));
    console.log(colorize('  h', asChalkColor((asChalkColor(('cyan'))))) + ') ' + colorize('Help', asChalkColor((asChalkColor(('white'))))) + ' - Show this help screen');
    console.log(colorize('\nTips:', asChalkColor((asChalkColor(('gray')))), 'bold'));
    console.log(colorize('  - Tasks are presented in order: todo, in-progress, done, with draft items first', asChalkColor((asChalkColor(('gray'))))));
    console.log(colorize('  - Similar tasks are shown when found, and can be merged to reduce duplication', asChalkColor((asChalkColor(('gray'))))));
    console.log(colorize('  - Use the "Block/Unblock" command to quickly toggle a task\'s blocked status', asChalkColor((asChalkColor(('gray'))))));
    console.log(colorize('  - Creating subtasks helps break down complex work into manageable pieces', asChalkColor((asChalkColor(('gray'))))));
    console.log(colorize('  - Press Ctrl+C at any time to force exit the program', asChalkColor((asChalkColor(('gray'))))));
    console.log(colorize('\nPress any key to continue...', asChalkColor((asChalkColor(('cyan'))))));
    // This would be better with a single key press, but we'll use readline for now
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('', () => {
        rl.close();
    });
}
