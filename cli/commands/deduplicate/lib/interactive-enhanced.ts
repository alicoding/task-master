/**
 * Enhanced interactive mode for deduplication tool
 */

import readline from 'readline';
import { TaskRepository } from '../../../../core/repo.js';
import { DuplicateGroup, ColorizeFunction } from './utils.js';
import { handleMerge } from './merger.js';
import { displayTaskComparison, displayTaskDetail, displayDetailedGroupView, displayInteractiveHelp } from './formatter-enhanced.js';

/**
 * Run enhanced interactive mode
 */
export async function runInteractiveMode(
  limitedGroups: DuplicateGroup[],
  repo: TaskRepository,
  colorize: ColorizeFunction
) {
  let running = true;
  let currentGroup: number | null = null;
  
  // Display initial help
  displayInteractiveHelp(colorize);
  
  // Main interaction loop
  while (running) {
    // Show prompt with context
    let prompt = colorize('\nEnter command', 'cyan');
    if (currentGroup !== null) {
      prompt += colorize(` (current group: ${currentGroup + 1})`, 'blue');
    }
    prompt += colorize(': ', 'cyan');
    
    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Get user input
    const answer = await new Promise<string>(resolve => {
      rl.question(prompt, resolve);
    });
    
    rl.close();
    
    // Process the command
    const command = answer.trim().toLowerCase();
    
    if (command === 'q') {
      console.log(colorize('Exiting deduplication tool.', 'blue'));
      running = false;
      continue;
    }
    
    if (command === 'h') {
      displayInteractiveHelp(colorize);
      continue;
    }
    
    if (command === 'r') {
      console.log(colorize('Refreshing duplicate list...', 'blue'));
      console.log(colorize('(Note: This would reload tasks and recalculate duplicates in a real implementation)', 'gray'));
      continue;
    }
    
    // Handle merge command (m <group>)
    if (command.startsWith('m ')) {
      const groupNum = parseInt(command.substring(2));
      
      if (isNaN(groupNum) || groupNum < 1 || groupNum > limitedGroups.length) {
        console.log(colorize(`Invalid group number. Must be between 1 and ${limitedGroups.length}.`, 'red'));
        continue;
      }
      
      const selectedGroup = limitedGroups[groupNum - 1];
      await handleMerge(selectedGroup, repo, colorize);
      continue;
    }
    
    // Handle view group command (v <group>)
    if (command.startsWith('v ')) {
      const groupNum = parseInt(command.substring(2));
      
      if (isNaN(groupNum) || groupNum < 1 || groupNum > limitedGroups.length) {
        console.log(colorize(`Invalid group number. Must be between 1 and ${limitedGroups.length}.`, 'red'));
        continue;
      }
      
      const selectedGroup = limitedGroups[groupNum - 1];
      displayDetailedGroupView(groupNum, selectedGroup, colorize);
      
      // Set current group for context
      currentGroup = groupNum - 1;
      continue;
    }
    
    // Handle compare tasks command (c <task1> <task2>)
    if (command.startsWith('c ')) {
      const parts = command.substring(2).split(' ').filter(p => p.trim() !== '');
      
      // If current group is not set, require a group first
      if (currentGroup === null) {
        console.log(colorize('Please select a group first using "v <group>" command.', 'yellow'));
        continue;
      }
      
      // If we have two numbers, compare those specific tasks
      if (parts.length === 2) {
        const task1 = parseInt(parts[0]) - 1;
        const task2 = parseInt(parts[1]) - 1;
        
        if (isNaN(task1) || isNaN(task2) || 
            task1 < 0 || task1 >= limitedGroups[currentGroup].tasks.length ||
            task2 < 0 || task2 >= limitedGroups[currentGroup].tasks.length ||
            task1 === task2) {
          console.log(colorize(`Invalid task numbers. Must be different and between 1 and ${limitedGroups[currentGroup].tasks.length}.`, 'red'));
          continue;
        }
        
        displayTaskComparison(task1, task2, limitedGroups[currentGroup], colorize);
      } else {
        console.log(colorize('Invalid compare command. Use "c <task1> <task2>" format.', 'red'));
      }
      
      continue;
    }
    
    // Handle show task command (s <task>)
    if (command.startsWith('s ')) {
      const taskNum = parseInt(command.substring(2));
      
      // If current group is not set, require a group first
      if (currentGroup === null) {
        console.log(colorize('Please select a group first using "v <group>" command.', 'yellow'));
        continue;
      }
      
      if (isNaN(taskNum) || taskNum < 1 || taskNum > limitedGroups[currentGroup].tasks.length) {
        console.log(colorize(`Invalid task number. Must be between 1 and ${limitedGroups[currentGroup].tasks.length}.`, 'red'));
        continue;
      }
      
      displayTaskDetail(taskNum - 1, limitedGroups[currentGroup], colorize);
      continue;
    }
    
    // Handle invalid commands
    console.log(colorize(`Unknown command: "${command}". Type "h" for help.`, 'red'));
  }
}

/**
 * Run auto-merge with enhanced UI
 */
export async function runAutoMergeSuggestions(
  highSimilarityGroups: DuplicateGroup[],
  repo: TaskRepository,
  colorize: ColorizeFunction
) {
  // Import merger function
  const { suggestMerge } = await import('./merger-enhanced.js');
  
  console.log(colorize(`\n🔍 Auto-merge suggestions for ${highSimilarityGroups.length} groups`, 'blue', 'bold'));
  console.log(colorize(`   Processing groups with 80%+ similarity...`, 'gray'));
  
  console.log(colorize(`\n┌${'─'.repeat(78)}┐`, 'green'));
  console.log(colorize(`│ AUTO-MERGE WIZARD ${' '.repeat(61)}│`, 'green', 'bold'));
  console.log(colorize(`└${'─'.repeat(78)}┘`, 'green'));
  
  // Create a statistics object to track results
  const stats = {
    processed: 0,
    merged: 0,
    skipped: 0,
    tasksDeleted: 0,
    tasksMarkedAsDuplicate: 0
  };
  
  // Process each high similarity group
  for (let i = 0; i < highSimilarityGroups.length; i++) {
    const group = highSimilarityGroups[i];
    const result = await suggestMerge(group, repo, colorize, i + 1, highSimilarityGroups.length);
    
    // Update statistics
    stats.processed++;
    
    if (result.action === 'merged') {
      stats.merged++;
      stats.tasksDeleted += result.tasksDeleted || 0;
      stats.tasksMarkedAsDuplicate += result.tasksMarkedAsDuplicate || 0;
    } else if (result.action === 'skipped') {
      stats.skipped++;
    }
    
    // Add separator between groups
    if (i < highSimilarityGroups.length - 1) {
      console.log(colorize(`\n${'─'.repeat(78)}`, 'gray'));
    }
  }
  
  // Display summary
  console.log(colorize(`\n┌${'─'.repeat(78)}┐`, 'green'));
  console.log(colorize(`│ AUTO-MERGE SUMMARY ${' '.repeat(60)}│`, 'green', 'bold'));
  console.log(colorize(`└${'─'.repeat(78)}┘`, 'green'));
  
  console.log(colorize(`\n● RESULTS OVERVIEW`, 'blue', 'bold'));
  console.log(`  Total groups processed: ${stats.processed}`);
  console.log(`  Groups merged: ${colorize(stats.merged.toString(), 'green')}`);
  console.log(`  Groups skipped: ${colorize(stats.skipped.toString(), 'yellow')}`);
  
  if (stats.merged > 0) {
    console.log(colorize(`\n● MERGE ACTIONS`, 'blue', 'bold'));
    console.log(`  Tasks deleted: ${colorize(stats.tasksDeleted.toString(), 'red')}`);
    console.log(`  Tasks marked as duplicates: ${colorize(stats.tasksMarkedAsDuplicate.toString(), 'yellow')}`);
  }
  
  console.log(colorize(`\n✅ Auto-merge process completed`, 'green', 'bold'));
}