/**
 * Enhanced interactive mode for deduplication tool
 */
import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import readline from 'readline';
import { TaskRepository } from '../../../../core/repo';
import { DuplicateGroup, ColorizeFunction } from './utils';
import { handleMerge } from './merger';
import { displayTaskComparison, displayTaskDetail, displayDetailedGroupView, displayInteractiveHelp } from './formatter-enhanced';
/**
 * Run enhanced interactive mode
 */
export async function runInteractiveMode(limitedGroups: DuplicateGroup[], repo: TaskRepository, colorize: ColorizeFunction) {
    let running = true;
    let currentGroup: number | null = null;
    // Display initial help
    displayInteractiveHelp(colorize);
    // Main interaction loop
    while (running) {
        // Show prompt with context
        let prompt = colorize('\nEnter command', asChalkColor(1));
        if (currentGroup !== null) {
            prompt += colorize(` (current group: ${currentGroup + 1})`, asChalkColor(1));
        }
        prompt += colorize(': ', asChalkColor(1));
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
            console.log(colorize('Exiting deduplication tool.', asChalkColor(1)));
            running = false;
            continue;
        }
        if (command === 'h') {
            displayInteractiveHelp(colorize);
            continue;
        }
        if (command === 'r') {
            console.log(colorize('Refreshing duplicate list...', asChalkColor(1)));
            console.log(colorize('(Note: This would reload tasks and recalculate duplicates in a real implementation)', asChalkColor(1)));
            continue;
        }
        // Handle merge command (m <group>)
        if (command.startsWith('m ')) {
            const groupNum = parseInt(command.substring(2));
            if (isNaN(groupNum) || groupNum < 1 || groupNum > limitedGroups.length) {
                console.log(colorize(`Invalid group number. Must be between 1 and ${limitedGroups.length}.`, asChalkColor(1)));
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
                console.log(colorize(`Invalid group number. Must be between 1 and ${limitedGroups.length}.`, asChalkColor(1)));
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
                console.log(colorize('Please select a group first using "v <group>" command.', asChalkColor(1)));
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
                    console.log(colorize(`Invalid task numbers. Must be different and between 1 and ${limitedGroups[currentGroup].tasks.length}.`, asChalkColor(1)));
                    continue;
                }
                displayTaskComparison(task1, task2, limitedGroups[currentGroup], colorize);
            }
            else {
                console.log(colorize('Invalid compare command. Use "c <task1> <task2>" format.', asChalkColor(1)));
            }
            continue;
        }
        // Handle show task command (s <task>)
        if (command.startsWith('s ')) {
            const taskNum = parseInt(command.substring(2));
            // If current group is not set, require a group first
            if (currentGroup === null) {
                console.log(colorize('Please select a group first using "v <group>" command.', asChalkColor(1)));
                continue;
            }
            if (isNaN(taskNum) || taskNum < 1 || taskNum > limitedGroups[currentGroup].tasks.length) {
                console.log(colorize(`Invalid task number. Must be between 1 and ${limitedGroups[currentGroup].tasks.length}.`, asChalkColor(1)));
                continue;
            }
            displayTaskDetail(taskNum - 1, limitedGroups[currentGroup], colorize);
            continue;
        }
        // Handle invalid commands
        console.log(colorize(`Unknown command: "${command}". Type "h" for help.`, asChalkColor(1)));
    }
}
/**
 * Run auto-merge with enhanced UI
 */
export async function runAutoMergeSuggestions(highSimilarityGroups: DuplicateGroup[], repo: TaskRepository, colorize: ColorizeFunction) {
    // Import merger function
    const { suggestMerge } = await import('./merger-enhanced');
    console.log(colorize(`\n🔍 Auto-merge suggestions for ${highSimilarityGroups.length} groups`, asChalkColor(1), 'bold'));
    console.log(colorize(`   Processing groups with 80%+ similarity...`, asChalkColor(1)));
    console.log(colorize(`\n┌${'─'.repeat(78)}┐`, asChalkColor(1)));
    console.log(colorize(`│ AUTO-MERGE WIZARD ${' '.repeat(61)}│`, asChalkColor(1), 'bold'));
    console.log(colorize(`└${'─'.repeat(78)}┘`, asChalkColor(1)));
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
        }
        else if (result.action === 'skipped') {
            stats.skipped++;
        }
        // Add separator between groups
        if (i < highSimilarityGroups.length - 1) {
            console.log(colorize(`\n${'─'.repeat(78)}`, asChalkColor(1)));
        }
    }
    // Display summary
    console.log(colorize(`\n┌${'─'.repeat(78)}┐`, asChalkColor(1)));
    console.log(colorize(`│ AUTO-MERGE SUMMARY ${' '.repeat(60)}│`, asChalkColor(1), 'bold'));
    console.log(colorize(`└${'─'.repeat(78)}┘`, asChalkColor(1)));
    console.log(colorize(`\n● RESULTS OVERVIEW`, asChalkColor(1), 'bold'));
    console.log(`  Total groups processed: ${stats.processed}`);
    console.log(`  Groups merged: ${colorize(stats.merged.toString(), asChalkColor(1))}`);
    console.log(`  Groups skipped: ${colorize(stats.skipped.toString(), asChalkColor(1))}`);
    if (stats.merged > 0) {
        console.log(colorize(`\n● MERGE ACTIONS`, asChalkColor(1), 'bold'));
        console.log(`  Tasks deleted: ${colorize(stats.tasksDeleted.toString(), asChalkColor(1))}`);
        console.log(`  Tasks marked as duplicates: ${colorize(stats.tasksMarkedAsDuplicate.toString(), asChalkColor(1))}`);
    }
    console.log(colorize(`\n✅ Auto-merge process completed`, asChalkColor(1), 'bold'));
}
