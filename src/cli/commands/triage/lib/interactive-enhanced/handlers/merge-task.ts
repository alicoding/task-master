/**
 * Merge task with similar task handler
 */

import readline from 'readline';
import { TaskRepository } from '@/core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '@/cli/commands/triage/lib/utils';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

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
    console.log(colorize('Would merge tasks (dry run).', asChalkColor('yellow')));
    results.merged.push({
      id: task.id,
      title: task.title,
      dry_run: true
    });
    return;
  }
  
  console.log(colorize('\n┌─ Merge Tasks', asChalkColor('red'), asChalkColor('bold')));
  console.log(colorize('│', asChalkColor('red')));
  console.log(colorize('├─ Source Task: ', asChalkColor('red')) + 
              colorize(task.id || '', asChalkColor('red')) + ': ' + task.title);
  
  // Select merge target
  const rl1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(colorize('│', asChalkColor('red')));
  console.log(colorize('├─ Select target task to merge with:', asChalkColor('red')));
  
  filteredTasks.forEach((t, i) => {
    const score = t.metadata?.similarityScore || 0;
    const percentage = Math.round(score * 100);
    console.log(colorize(`│  ${i + 1}`, asChalkColor('white'), asChalkColor('bold')) + '. ' + 
                colorize(t.id || '', asChalkColor('yellow')) + ': ' + t.title + 
                colorize(` (${percentage}% similar)`, asChalkColor('yellow')));
  });
  
  const targetInput = await new Promise<string>(resolve => {
    rl1.question(colorize('├─ Enter number [1-' + filteredTasks.length + ']: ', asChalkColor('red')), resolve);
  });
  
  rl1.close();
  
  const targetIndex = parseInt(targetInput) - 1;
  
  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= filteredTasks.length) {
    console.log(colorize('└─ Invalid selection. Merge cancelled.', asChalkColor('red')));
    return;
  }
  
  const targetTask = filteredTasks[targetIndex];
  
  // Show merge preview
  console.log(colorize('│', asChalkColor('red')));
  console.log(colorize('├─ Merge Preview:', asChalkColor('red'), asChalkColor('bold')));
  console.log(colorize('│  ', asChalkColor('red')) + 'Tasks will be merged into: ' + 
              colorize(targetTask.id || '', asChalkColor('green')) + ': ' + targetTask.title);
  
  // Combine tags
  const combinedTagsSet = new Set([...(task.tags || []), ...(targetTask.tags || [])]);
  const combinedTags = Array.from(combinedTagsSet);
  
  console.log(colorize('│  ', asChalkColor('red')) + 'Combined tags: ' + 
              (combinedTags.length > 0 ? 
               combinedTags.map(tag => colorize(tag, asChalkColor('cyan'))).join(', ') : 
               colorize('none', asChalkColor('gray'))));
  
  // Confirm merge
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const confirmMerge = await new Promise<string>(resolve => {
    rl2.question(colorize('├─ Proceed with merge? [y/n]: ', asChalkColor('red')), resolve);
  });
  
  rl2.close();
  
  if (confirmMerge.toLowerCase() !== 'y') {
    console.log(colorize('└─ Merge cancelled.', asChalkColor('yellow')));
    return;
  }
  
  // Perform the merge
  console.log(colorize('│', asChalkColor('red')));
  console.log(colorize('├─ Performing merge...', asChalkColor('red')));
  
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
  
  results.merged.push({
    source: updatedSource,
    target: updatedTarget
  });
  
  console.log(colorize('└─ ✓ Tasks merged successfully', asChalkColor('green'), asChalkColor('bold')));
}