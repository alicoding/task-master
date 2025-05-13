/**
 * Mark task as done handler
 */

import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';


/**
 * Handle marking a task as done
 * @param task Task to mark as done
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export async function handleMarkAsDoneAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void> {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would mark task as done (dry run).', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    results?.updated.push({
      id: task.id,
      title: task.title,
      status: 'done',
      dry_run: true
    });
    return;
  }
  
  console.log(colorize('\nMarking task as done...', asChalkColor((asChalkColor(('green' as ChalkColor))))));
  
  // Mark as done
  const updatedTask = await repo.updateTask({
    id: task.id,
    status: 'done',
    readiness: 'ready' // Also ensure it's ready
  });
  
  results?.updated.push(updatedTask);
  console.log(colorize('✓ Task marked as done', asChalkColor((asChalkColor(('green' as ChalkColor)))), asChalkColor('bold')));
}