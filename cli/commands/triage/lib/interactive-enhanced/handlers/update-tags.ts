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
export async function handleUpdateTagsAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void> {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would update tags (dry run).', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    results?.updated.push({
      id: task.id,
      title: task.title,
      dry_run: true
    });
    return;
  }
  
  // Current tags
  console.log(colorize('\n┌─ Update Task Tags', asChalkColor((asChalkColor(('cyan' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('│', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
  console.log(colorize('├─ Current Tags: ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))) + 
              (task.tags && task.tags.length > 0 ? 
               task.tags.map((tag) => colorize(tag, asChalkColor((asChalkColor(('cyan' as ChalkColor)))))).join(', ') : 
               colorize('none', asChalkColor((asChalkColor(('gray' as ChalkColor)))))));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(colorize('│', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
  console.log(colorize('├─ Enter new tags (comma-separated) or:', asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
  console.log(colorize('│  ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))) + colorize('- Enter "clear" to remove all tags', asChalkColor((asChalkColor(('white' as ChalkColor))))));
  console.log(colorize('│  ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))) + colorize('- Leave empty to keep current tags', asChalkColor((asChalkColor(('white' as ChalkColor))))));
  
  const tagsInput = await new Promise<string>(resolve => {
    rl.question(colorize('├─ Tags: ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))), resolve);
  });
  
  rl.close();
  
  // Process input
  let newTags: string[] | undefined = undefined;
  
  if (tagsInput.trim().toLowerCase() === 'clear') {
    newTags = [];
    console.log(colorize('│  Clearing all tags', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
  } else if (tagsInput.trim()) {
    newTags = tagsInput.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    console.log(colorize('│  Setting new tags: ', asChalkColor((asChalkColor(('green' as ChalkColor))))) + 
                newTags.map(tag => colorize(tag, asChalkColor((asChalkColor(('cyan' as ChalkColor)))))).join(', '));
  } else {
    console.log(colorize('│  Keeping current tags', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
  }
  
  // Update if tags changed
  if (newTags !== undefined) {
    const updatedTask = await repo.updateTask({
      id: task.id,
      tags: newTags
    });
    
    results?.updated.push(updatedTask);
    console.log(colorize('└─ ✓ Tags updated successfully', asChalkColor((asChalkColor(('green' as ChalkColor)))), asChalkColor('bold')));
  } else {
    console.log(colorize('└─ No changes made', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
  }
}