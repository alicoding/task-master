/**
 * Mark task as done handler
 */

import { TaskRepository } from '../../../../../core/repo.ts';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils.ts';

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
    console.log(colorize('Would mark task as done (dry run).', 'yellow'));
    results.updated.push({
      id: task.id,
      title: task.title,
      status: 'done',
      dry_run: true
    });
    return;
  }
  
  console.log(colorize('\nMarking task as done...', 'green'));
  
  // Mark as done
  const updatedTask = await repo.updateTask({
    id: task.id,
    status: 'done',
    readiness: 'ready' // Also ensure it's ready
  });
  
  results.updated.push(updatedTask);
  console.log(colorize('✓ Task marked as done', 'green', 'bold'));
}