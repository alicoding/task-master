/**
 * Task update functionality
 * Handles updating existing tasks
 */
import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../utils';
/**
 * Handle updating an existing task
 * @param taskData Task data
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
export async function handleTaskUpdate(taskData: TriageTask, repo: TaskRepository, results: TriageResults, options: ProcessingOptions) {
    const { dryRun, colorize, jsonOutput } = options;
    if (!taskData.id) {
        const errorMsg = 'Cannot update task: missing id';
        results?.errors?.push(errorMsg);
        if (!jsonOutput) {
            console.log(colorize(`│    ✘ ERROR: ${errorMsg}`, asChalkColor((asChalkColor(('red'))))));
        }
        return;
    }
    // Check if the task exists
    const existingTask = await repo.getTask(taskData.id);
    if (!existingTask) {
        const errorMsg = `Task with ID ${taskData.id} not found. Cannot update.`;
        results?.errors?.push(errorMsg);
        if (!jsonOutput) {
            console.log(colorize(`│    ✘ ERROR: ${errorMsg}`, asChalkColor((asChalkColor(('red'))))));
        }
        return;
    }
    // Don't actually update in dry run mode
    if (!dryRun) {
        const updatedTask = await repo.updateTask({
            id: taskData.id,
            title: taskData.title,
            status: taskData.status,
            readiness: taskData.readiness,
            tags: taskData.tags,
            metadata: taskData.metadata
        });
        results?.updated.push(updatedTask);
        if (!jsonOutput) {
            // Show changes
            const changes = [];
            if (taskData.title && taskData.title !== existingTask.title)
                changes.push(`title: "${taskData.title}"`);
            if (taskData.status && taskData.status !== existingTask.status)
                changes.push(`status: ${taskData.status}`);
            if (taskData.readiness && taskData.readiness !== existingTask.readiness)
                changes.push(`readiness: ${taskData.readiness}`);
            if (taskData.tags)
                changes.push(`tags: [${taskData.tags.join(', ')}]`);
            console.log(colorize(`│    ✓ Updated task ${updatedTask.id}`, asChalkColor((asChalkColor(('yellow'))))));
            if (changes.length > 0) {
                console.log(colorize(`│      Changed: ${changes.join(', ')}`, asChalkColor((asChalkColor(('gray'))))));
            }
        }
    }
    else {
        const simTask = {
            id: taskData.id,
            title: taskData.title || '[unchanged]',
            status: taskData.status || '[unchanged]',
            readiness: taskData.readiness || '[unchanged]',
            tags: taskData.tags || '[unchanged]',
            dry_run: true
        };
        results?.updated.push(simTask);
        if (!jsonOutput) {
            console.log(colorize(`│    ✓ Would update task ${simTask.id}`, asChalkColor((asChalkColor(('yellow'))))));
        }
    }
}
