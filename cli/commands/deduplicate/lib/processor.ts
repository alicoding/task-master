import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { TaskRepository } from '../../../../core/repo';
import { NlpService } from '../../../../core/nlp-service';
import { Task } from '@/core/types';
import { ColorizeFunction } from './utils';
import { findDuplicateGroups } from './finder';
/**
 * Process tasks and find duplicates
 */
export async function processTasks(repo: TaskRepository, nlpService: NlpService, options: {
    status?: string;
    tag?: string[];
}) {
    // Get all tasks
    const tasksResult = await repo.getAllTasks();
    // Handle the operation result pattern
    if (!tasksResult?.success || !tasksResult?.data) {
        return [];
    }
    let allTasks = tasksResult?.data;
    // Apply filters if provided
    if (options.status) {
        allTasks = allTasks.filter(task => task.status === options.status);
    }
    if (options.tag && options.tag.length > 0) {
        allTasks = allTasks.filter(task => task.tags ? options.tag!.some(tag => task.tags && task.tags.includes(tag)) : false);
    }
    return allTasks;
}
/**
 * Process duplicates in auto-merge mode
 */
export async function processAutoMerge(limitedGroups: Awaited<ReturnType<typeof findDuplicateGroups>>, repo: TaskRepository, colorize: ColorizeFunction) {
    // Get high similarity groups (80%+)
    const highSimilarityGroups = limitedGroups.filter(group => group.maxSimilarity >= 0.8);
    if (highSimilarityGroups.length === 0) {
        console.log(colorize('No groups with 80%+ similarity found for auto-merge.', asChalkColor((asChalkColor(('yellow'))))));
        return;
    }
    console.log(colorize(`\nAuto-merge suggestions for ${highSimilarityGroups.length} groups:\n`, asChalkColor((asChalkColor(('blue')))), 'bold'));
    // Import here to avoid circular dependencies
    const { suggestMerge } = await import('./merger');
    for (let i = 0; i < highSimilarityGroups.length; i++) {
        const group = highSimilarityGroups[i];
        await suggestMerge(group, repo, colorize);
    }
}
