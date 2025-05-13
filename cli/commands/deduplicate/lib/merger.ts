import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { TaskRepository } from '../../../../core/repo';
import { DuplicateGroup, ColorizeFunction } from './utils';
import readline from 'readline';
/**
 * Handle merging tasks in a group
 * @param group Group of tasks to merge
 * @param repo Task repository
 * @param colorize Color function
 */
export async function handleMerge(group: DuplicateGroup, repo: TaskRepository, colorize: ColorizeFunction) {
    console.log(colorize('\nMerging tasks in group:', asChalkColor(1), 'bold'));
    // Display tasks
    for (let i = 0; i < group.tasks.length; i++) {
        const task = group.tasks[i];
        console.log(colorize(`[${i + 1}] `, asChalkColor(1), 'bold') + `${task.id}: ${task.title}`);
        console.log(`    Status: ${task.status}, Tags: ${formatTags(task.tags)}`);
    }
    // Get primary task
    const rl1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const primaryTaskInput = await new Promise<string>(resolve => {
        rl1.question(colorize('\nSelect the PRIMARY task to keep [1-' + group.tasks.length + ']: ', asChalkColor(1)), resolve);
    });
    rl1.close();
    const primaryTaskIdx = parseInt(primaryTaskInput) - 1;
    if (isNaN(primaryTaskIdx) || primaryTaskIdx < 0 || primaryTaskIdx >= group.tasks.length) {
        console.log(colorize('Invalid task selection. Merge cancelled.', asChalkColor(1)));
        return;
    }
    // Get secondary tasks
    const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const secondaryTasksInput = await new Promise<string>(resolve => {
        rl2.question(colorize('\nSelect tasks to merge INTO the primary task (comma-separated, e.g. "2,3" or "all"): ', asChalkColor(1)), resolve);
    });
    rl2.close();
    const secondaryTaskIndices: number[] = [];
    if (secondaryTasksInput.toLowerCase() === 'all') {
        // Add all except primary
        for (let i = 0; i < group.tasks.length; i++) {
            if (i !== primaryTaskIdx) {
                secondaryTaskIndices.push(i);
            }
        }
    }
    else {
        // Parse comma-separated indices
        const parts = secondaryTasksInput.split(',');
        for (const part of parts) {
            const idx = parseInt(part) - 1;
            if (!isNaN(idx) && idx >= 0 && idx < group.tasks.length && idx !== primaryTaskIdx) {
                secondaryTaskIndices.push(idx);
            }
        }
    }
    if (secondaryTaskIndices.length === 0) {
        console.log(colorize('No valid secondary tasks selected. Merge cancelled.', asChalkColor(1)));
        return;
    }
    // Prepare merge
    const primaryTask = group.tasks[primaryTaskIdx];
    const secondaryTasks = secondaryTaskIndices.map(idx => group.tasks[idx]);
    console.log(colorize('\nMerge preview:', asChalkColor(1), 'bold'));
    console.log(colorize('Primary Task: ', asChalkColor(1)) + `${primaryTask.id}: ${primaryTask.title}`);
    console.log(colorize('Will merge with:', asChalkColor(1)));
    for (const task of secondaryTasks) {
        console.log(`- ${task.id}: ${task.title}`);
    }
    // Collect all unique tags
    const allTags = new Set<string>(primaryTask.tags || []);
    for (const task of secondaryTasks) {
        if (task.tags) {
            for (const tag of task.tags) {
                allTags.add(tag);
            }
        }
    }
    // Prepare metadata
    const baseMetadata = primaryTask.metadata ? { ...JSON.parse(primaryTask.metadata as string) } : {};
    delete baseMetadata.similarityScore;
    const mergedMetadata = {
        ...baseMetadata,
        mergedFrom: secondaryTasks.map(t => t.id).join(','),
        mergedAt: new Date().toISOString(),
        mergedTaskTitles: secondaryTasks.map(t => t.title)
    };
    // Show merge details
    console.log(colorize('\nResults after merge:', asChalkColor(1)));
    console.log(colorize('Title: ', asChalkColor(1)) + primaryTask.title + ' (unchanged)');
    console.log(colorize('Tags: ', asChalkColor(1)) + Array.from(allTags).join(', '));
    console.log(colorize('Status: ', asChalkColor(1)) + primaryTask.status + ' (unchanged)');
    console.log(colorize('Readiness: ', asChalkColor(1)) + primaryTask.readiness + ' (unchanged)');
    // Confirm merge
    const rl3 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const confirmMerge = await new Promise<string>(resolve => {
        rl3.question(colorize('\nProceed with merge? [y/n]: ', asChalkColor(1)), resolve);
    });
    rl3.close();
    if (confirmMerge.toLowerCase() !== 'y') {
        console.log(colorize('Merge cancelled.', asChalkColor(1)));
        return;
    }
    // Execute merge
    try {
        // Update primary task
        const updateResult = await repo.updateTask({
            id: primaryTask.id,
            tags: Array.from(allTags),
            metadata: mergedMetadata
        });
        // Ask if secondary tasks should be deleted
        const rl4 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const deleteSecondary = await new Promise<string>(resolve => {
            rl4.question(colorize('\nDelete merged secondary tasks? [y/n]: ', asChalkColor(1)), resolve);
        });
        rl4.close();
        if (deleteSecondary.toLowerCase() === 'y') {
            for (const task of secondaryTasks) {
                await repo.removeTask(task.id);
                console.log(colorize(`Task ${task.id} deleted.`, asChalkColor(1)));
            }
        }
        else {
            // Mark as duplicates
            for (const task of secondaryTasks) {
                const taskMetadata = task.metadata ? { ...JSON.parse(task.metadata as string) } : {};
                await repo.updateTask({
                    id: task.id,
                    status: 'done',
                    readiness: 'blocked',
                    metadata: {
                        ...taskMetadata,
                        duplicateOf: primaryTask.id,
                        duplicateMarkedAt: new Date().toISOString()
                    }
                });
                console.log(colorize(`Task ${task.id} marked as duplicate of ${primaryTask.id}.`, asChalkColor(1)));
            }
        }
        console.log(colorize('\n✅ Merge completed successfully!', asChalkColor(1), 'bold'));
        if (updateResult?.success && updateResult?.data) {
            console.log(`Primary task ${updateResult?.data?.id} now contains merged data.`);
        }
        else {
            console.log(`Primary task update completed with issues.`);
        }
    }
    catch (error) {
        console?.error('Error during merge:', error);
        console.log(colorize('Merge failed. See error details above.', asChalkColor(1)));
    }
}
/**
 * Show auto-merge suggestion for a group
 * @param group Group of tasks
 * @param repo Task repository
 * @param colorize Color function
 */
export async function suggestMerge(group: DuplicateGroup, repo: TaskRepository, colorize: ColorizeFunction) {
    // Find the newest task (likely the most complete)
    const newestTask = group.tasks.reduce((newest, task) => {
        return new Date(task.updatedAt).getTime() > new Date(newest.updatedAt).getTime() ? task : newest;
    }, group.tasks[0]);
    // Display tasks in this group
    console.log(colorize(`Group with ${Math.round(group.maxSimilarity * 100)}% similarity:`, asChalkColor(1)));
    for (let i = 0; i < group.tasks.length; i++) {
        const task = group.tasks[i];
        const isNewest = task.id === newestTask.id;
        console.log((isNewest ? colorize('→ ', asChalkColor(1), 'bold') : '  ') +
            colorize(`[${i + 1}] `, asChalkColor(1)) +
            `${task.id}: ${task.title}`);
        console.log(`     Status: ${task.status}, Tags: ${formatTags(task.tags)}`);
        console.log(`     Updated: ${new Date(task.updatedAt).toLocaleString()}` +
            (isNewest ? colorize(' (newest)', asChalkColor(1)) : ''));
    }
    // Calculate combined tags
    const allTags = new Set<string>();
    for (const task of group.tasks) {
        if (task.tags) {
            for (const tag of task.tags) {
                allTags.add(tag);
            }
        }
    }
    // Show automatic suggestion
    console.log(colorize('\nSuggested action:', asChalkColor(1), 'bold'));
    console.log(`Merge all tasks into ${colorize(newestTask.id, asChalkColor(1))}: ${newestTask.title}`);
    console.log(`Combined tags: ${Array.from(allTags).join(', ') || 'none'}`);
    // Ask for confirmation
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const confirm = await new Promise<string>(resolve => {
        rl.question(colorize('Proceed with suggested merge? [y/n/s(skip)]: ', asChalkColor(1)), resolve);
    });
    rl.close();
    if (confirm.toLowerCase() === 's') {
        console.log(colorize('Skipped this group.', asChalkColor(1)));
        console.log(''); // Empty line
        return;
    }
    if (confirm.toLowerCase() !== 'y') {
        console.log(colorize('Merge cancelled for this group.', asChalkColor(1)));
        console.log(''); // Empty line
        return;
    }
    // Execute merge
    try {
        // Prepare metadata
        const secondaryTasks = group.tasks.filter(t => t.id !== newestTask.id);
        const baseMetadata = newestTask.metadata ? { ...JSON.parse(newestTask.metadata as string) } : {};
        delete baseMetadata.similarityScore;
        const mergedMetadata = {
            ...baseMetadata,
            mergedFrom: secondaryTasks.map(t => t.id).join(','),
            mergedAt: new Date().toISOString(),
            mergedTaskTitles: secondaryTasks.map(t => t.title)
        };
        // Update primary task
        const updateResult = await repo.updateTask({
            id: newestTask.id,
            tags: Array.from(allTags),
            metadata: mergedMetadata
        });
        // Ask what to do with secondary tasks
        const rl2 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const secondaryAction = await new Promise<string>(resolve => {
            rl2.question(colorize('What to do with secondary tasks? [d(delete)/m(mark as duplicates)]: ', asChalkColor(1)), resolve);
        });
        rl2.close();
        if (secondaryAction.toLowerCase() === 'd') {
            // Delete secondary tasks
            for (const task of secondaryTasks) {
                await repo.removeTask(task.id);
            }
            console.log(colorize(`${secondaryTasks.length} secondary tasks deleted.`, asChalkColor(1)));
        }
        else {
            // Mark as duplicates
            for (const task of secondaryTasks) {
                const taskMetadata = task.metadata ? { ...JSON.parse(task.metadata as string) } : {};
                await repo.updateTask({
                    id: task.id,
                    status: 'done',
                    readiness: 'blocked',
                    metadata: {
                        ...taskMetadata,
                        duplicateOf: newestTask.id,
                        duplicateMarkedAt: new Date().toISOString()
                    }
                });
            }
            console.log(colorize(`${secondaryTasks.length} tasks marked as duplicates.`, asChalkColor(1)));
        }
        console.log(colorize('✅ Merge completed successfully!', asChalkColor(1)));
        console.log(''); // Empty line
    }
    catch (error) {
        console?.error('Error during merge:', error);
        console.log(colorize('Merge failed. See error details above.', asChalkColor(1)));
        console.log(''); // Empty line
    }
}
