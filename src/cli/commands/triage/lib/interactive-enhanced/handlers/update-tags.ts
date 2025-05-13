/**
 * Update task tags handler
 */

import readline from 'readline';
import { TaskRepository } from '@/core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '@/cli/commands/triage/lib/utils';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Handle updating task tags
 * @param task Task to update tags for
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export async function handleUpdateTagsAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void> {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would update tags (dry run).', asChalkColor('yellow')));
    results.updated.push({
      id: task.id,
      title: task.title,
      dry_run: true
    });
    return;
  }
  
  // Current tags
  console.log(colorize('\n┌─ Update Task Tags', asChalkColor('cyan'), asChalkColor('bold')));
  console.log(colorize('│', asChalkColor('cyan')));
  console.log(colorize('├─ Current Tags: ', asChalkColor('cyan')) + 
              (task.tags && task.tags.length > 0 ? 
               task.tags.map((tag) => colorize(tag, asChalkColor('cyan'))).join(', ') : 
               colorize('none', asChalkColor('gray'))));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(colorize('│', asChalkColor('cyan')));
  console.log(colorize('├─ Enter new tags (comma-separated) or:', asChalkColor('cyan')));
  console.log(colorize('│  ', asChalkColor('cyan')) + colorize('- Enter "clear" to remove all tags', asChalkColor('white')));
  console.log(colorize('│  ', asChalkColor('cyan')) + colorize('- Leave empty to keep current tags', asChalkColor('white')));
  
  const tagsInput = await new Promise<string>(resolve => {
    rl.question(colorize('├─ Tags: ', asChalkColor('cyan')), resolve);
  });
  
  rl.close();
  
  // Process input
  let newTags: string[] | undefined = undefined;
  
  if (tagsInput.trim().toLowerCase() === 'clear') {
    newTags = [];
    console.log(colorize('│  Clearing all tags', asChalkColor('yellow')));
  } else if (tagsInput.trim()) {
    newTags = tagsInput.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    console.log(colorize('│  Setting new tags: ', asChalkColor('green')) + 
                newTags.map(tag => colorize(tag, asChalkColor('cyan'))).join(', '));
  } else {
    console.log(colorize('│  Keeping current tags', asChalkColor('gray')));
  }
  
  // Update if tags changed
  if (newTags !== undefined) {
    const updatedTask = await repo.updateTask({
      id: task.id,
      tags: newTags
    });
    
    results.updated.push(updatedTask);
    console.log(colorize('└─ ✓ Tags updated successfully', asChalkColor('green'), asChalkColor('bold')));
  } else {
    console.log(colorize('└─ No changes made', asChalkColor('yellow')));
  }
}