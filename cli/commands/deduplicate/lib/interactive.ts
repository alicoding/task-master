import readline from 'readline';
import { TaskRepository } from '../../../../core/repo.ts';
import { DuplicateGroup, ColorizeFunction } from './utils.ts';
import { handleMerge } from './merger.ts';
import { displayDetailedGroupView, displayInteractiveHelp } from './formatter.ts';

/**
 * Run interactive mode
 */
export async function runInteractiveMode(
  limitedGroups: DuplicateGroup[],
  repo: TaskRepository,
  colorize: ColorizeFunction
) {
  displayInteractiveHelp(colorize);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise<string>(resolve => {
    rl.question(colorize('\nEnter command: ', 'cyan'), resolve);
  });
  
  rl.close();
  
  const command = answer.trim().toLowerCase();
  
  if (command === 'q') {
    console.log(colorize('Exiting deduplication tool.', 'blue'));
    return;
  }
  
  // Handle merge command
  if (command.startsWith('m ')) {
    const groupNum = parseInt(command.substring(2));
    
    if (isNaN(groupNum) || groupNum < 1 || groupNum > limitedGroups.length) {
      console.log(colorize(`Invalid group number. Must be between 1 and ${limitedGroups.length}.`, 'red'));
      return;
    }
    
    const selectedGroup = limitedGroups[groupNum - 1];
    await handleMerge(selectedGroup, repo, colorize);
  }
  
  // Handle view command
  else if (command.startsWith('v ')) {
    const groupNum = parseInt(command.substring(2));
    
    if (isNaN(groupNum) || groupNum < 1 || groupNum > limitedGroups.length) {
      console.log(colorize(`Invalid group number. Must be between 1 and ${limitedGroups.length}.`, 'red'));
      return;
    }
    
    const selectedGroup = limitedGroups[groupNum - 1];
    displayDetailedGroupView(groupNum, selectedGroup, colorize);
  }
}