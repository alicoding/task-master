/**
 * Update task tags handler
 */
import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import readline from 'readline';
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';
/**
 * Handle updating task tags
 * @param task Task to update tags for
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export async function handleUpdateTagsAction(task: TriageTask, repo: TaskRepository, results: TriageResults, options: ProcessingOptions): Promise<void> {
    const { dryRun, colorize } = options;
    if (dryRun) {
        console.log(colorize('Would update tags (dry run).', asChalkColor(1)));
        results?.updated.push({
            id: task.id,
            title: task.title,
            dry_run: true
        });
        return;
    }
    // Current tags
    console.log(colorize('\n┌─ Update Task Tags', asChalkColor(1), 'bold'));
    console.log(colorize('│', asChalkColor(1)));
    console.log(colorize('├─ Current Tags: ', asChalkColor(1)) +
        (task.tags && task.tags.length > 0 ?
            task.tags.map((tag) => colorize(tag, asChalkColor(1))).join(', ') :
            colorize('none', asChalkColor(1))));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    console.log(colorize('│', asChalkColor(1)));
    console.log(colorize('├─ Enter new tags (comma-separated) or:', asChalkColor(1)));
    console.log(colorize('│  ', asChalkColor(1)) + colorize('- Enter "clear" to remove all tags', asChalkColor(1)));
    console.log(colorize('│  ', asChalkColor(1)) + colorize('- Leave empty to keep current tags', asChalkColor(1)));
    const tagsInput = await new Promise<string>(resolve => {
        rl.question(colorize('├─ Tags: ', asChalkColor(1)), resolve);
    });
    rl.close();
    // Process input
    let newTags: string[] | undefined = undefined;
    if (tagsInput.trim().toLowerCase() === 'clear') {
        newTags = [];
        console.log(colorize('│  Clearing all tags', asChalkColor(1)));
    }
    else if (tagsInput.trim()) {
        newTags = tagsInput.split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
        console.log(colorize('│  Setting new tags: ', asChalkColor(1)) +
            newTags.map(tag => colorize(tag, asChalkColor(1))).join(', '));
    }
    else {
        console.log(colorize('│  Keeping current tags', asChalkColor(1)));
    }
    // Update if tags changed
    if (newTags !== undefined) {
        const updatedTask = await repo.updateTask({
            id: task.id,
            tags: newTags
        });
        results?.updated.push(updatedTask);
        console.log(colorize('└─ ✓ Tags updated successfully', asChalkColor(1), 'bold'));
    }
    else {
        console.log(colorize('└─ No changes made', asChalkColor(1)));
    }
}
