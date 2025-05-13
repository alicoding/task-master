/**
 * Merge task with similar task handler
 */

import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import readline from 'readline';
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';


/**
 * Handle merging task with a similar task
 * @param task Task to merge
 * @param filteredTasks Similar tasks to potentially merge with
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export async function handleMergeTaskAction(
  task: TriageTask,
  filteredTasks: TriageTask[],
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void> {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would merge tasks (dry run).', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    results?.merged.push({
      id: task.id,
      title: task.title,
      dry_run: true
    });
    return;
  }
  
  console.log(colorize('\n┌─ Merge Tasks', asChalkColor((asChalkColor(('red' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('│', asChalkColor((asChalkColor(('red' as ChalkColor))))));
  console.log(colorize('├─ Source Task: ', asChalkColor((asChalkColor(('red' as ChalkColor))))) + 
              colorize(task.id || '', asChalkColor((asChalkColor(('red' as ChalkColor))))) + ': ' + task.title);
  
  // Select merge target
  const rl1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(colorize('│', asChalkColor((asChalkColor(('red' as ChalkColor))))));
  console.log(colorize('├─ Select target task to merge with:', asChalkColor((asChalkColor(('red' as ChalkColor))))));
  
  filteredTasks.forEach((t, i) => {
    const score = t.metadata?.similarityScore || 0;
    const percentage = Math.round(score * 100);
    console.log(colorize(`│  ${i + 1}`, asChalkColor((asChalkColor(('white' as ChalkColor)))), asChalkColor('bold')) + '. ' + 
                colorize(t.id || '', asChalkColor((asChalkColor(('yellow' as ChalkColor))))) + ': ' + t.title + 
                colorize(` (${percentage}% similar)`, asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
  });
  
  const targetInput = await new Promise<string>(resolve => {
    rl1.question(colorize('├─ Enter number [1-' + filteredTasks.length + ']: ', asChalkColor((asChalkColor(('red' as ChalkColor))))), resolve);
  });
  
  rl1.close();
  
  const targetIndex = parseInt(targetInput) - 1;
  
  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= filteredTasks.length) {
    console.log(colorize('└─ Invalid selection. Merge cancelled.', asChalkColor((asChalkColor(('red' as ChalkColor))))));
    return;
  }
  
  const targetTask = filteredTasks[targetIndex];
  
  // Show merge preview
  console.log(colorize('│', asChalkColor((asChalkColor(('red' as ChalkColor))))));
  console.log(colorize('├─ Merge Preview:', asChalkColor((asChalkColor(('red' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('│  ', asChalkColor((asChalkColor(('red' as ChalkColor))))) + 'Tasks will be merged into: ' + 
              colorize(targetTask.id || '', asChalkColor((asChalkColor(('green' as ChalkColor))))) + ': ' + targetTask.title);
  
  // Combine tags
  const combinedTagsSet = new Set([...(task.tags || []), ...(targetTask.tags || [])]);
  const combinedTags = Array.from(combinedTagsSet);
  
  console.log(colorize('│  ', asChalkColor((asChalkColor(('red' as ChalkColor))))) + 'Combined tags: ' + 
              (combinedTags.length > 0 ? 
               combinedTags.map(tag => colorize(tag, asChalkColor((asChalkColor(('cyan' as ChalkColor)))))).join(', ') : 
               colorize('none', asChalkColor((asChalkColor(('gray' as ChalkColor)))))));
  
  // Confirm merge
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const confirmMerge = await new Promise<string>(resolve => {
    rl2.question(colorize('├─ Proceed with merge? [y/n]: ', asChalkColor((asChalkColor(('red' as ChalkColor))))), resolve);
  });
  
  rl2.close();
  
  if (confirmMerge.toLowerCase() !== 'y') {
    console.log(colorize('└─ Merge cancelled.', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    return;
  }
  
  // Perform the merge
  console.log(colorize('│', asChalkColor((asChalkColor(('red' as ChalkColor))))));
  console.log(colorize('├─ Performing merge...', asChalkColor((asChalkColor(('red' as ChalkColor))))));
  
  // Merge metadata
  const mergedMetadata = {
    ...(task.metadata || {}),
    ...(targetTask.metadata || {}),
    mergedFrom: task.id,
    mergedAt: new Date().toISOString(),
    mergedTitle: task.title
  };
  
  // Delete similarity score if present
  if (mergedMetadata && 'similarityScore' in mergedMetadata) {
    delete (mergedMetadata as any).similarityScore;
  }
  
  // Update the target task
  const updatedTarget = await repo.updateTask({
    id: targetTask.id,
    tags: combinedTags,
    metadata: mergedMetadata
  });
  
  // Mark the source task as merged
  const updatedSource = await repo.updateTask({
    id: task.id,
    status: 'done',
    readiness: 'blocked',
    metadata: {
      ...(task.metadata || {}),
      mergedInto: targetTask.id,
      mergedAt: new Date().toISOString()
    }
  });
  
  results?.merged.push({
    source: updatedSource,
    target: updatedTarget
  });
  
  console.log(colorize('└─ ✓ Tasks merged successfully', asChalkColor((asChalkColor(('green' as ChalkColor)))), asChalkColor('bold')));
}