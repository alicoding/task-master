import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import readline from 'readline';
import { TaskRepository } from '../../../../core/repo';
import { DuplicateGroup, ColorizeFunction } from './utils';
import { handleMerge } from './merger';
import { displayDetailedGroupView, displayInteractiveHelp } from './formatter';
/**
 * Run interactive mode
 */
export async function runInteractiveMode(limitedGroups: DuplicateGroup[], repo: TaskRepository, colorize: ColorizeFunction) {
    displayInteractiveHelp(colorize);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const answer = await new Promise<string>(resolve => {
        rl.question(colorize('\nEnter command: ', asChalkColor(1)), resolve);
    });
    rl.close();
    const command = answer.trim().toLowerCase();
    if (command === 'q') {
        console.log(colorize('Exiting deduplication tool.', asChalkColor(1)));
        return;
    }
    // Handle merge command
    if (command.startsWith('m ')) {
        const groupNum = parseInt(command.substring(2));
        if (isNaN(groupNum) || groupNum < 1 || groupNum > limitedGroups.length) {
            console.log(colorize(`Invalid group number. Must be between 1 and ${limitedGroups.length}.`, asChalkColor(1)));
            return;
        }
        const selectedGroup = limitedGroups[groupNum - 1];
        await handleMerge(selectedGroup, repo, colorize);
    }
    // Handle view command
    else if (command.startsWith('v ')) {
        const groupNum = parseInt(command.substring(2));
        if (isNaN(groupNum) || groupNum < 1 || groupNum > limitedGroups.length) {
            console.log(colorize(`Invalid group number. Must be between 1 and ${limitedGroups.length}.`, asChalkColor(1)));
            return;
        }
        const selectedGroup = limitedGroups[groupNum - 1];
        displayDetailedGroupView(groupNum, selectedGroup, colorize);
    }
}
