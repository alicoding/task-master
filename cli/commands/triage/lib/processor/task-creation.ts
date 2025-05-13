/**
 * Task creation functionality
 * Handles creating new tasks
 */

import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { TaskRepository } from '../../../../../core/repo';
import { ProcessingOptions, TriageResults, TriageTask } from '../utils';


/**
 * Create a new task
 * @param taskData Task data
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
export async function createNewTask(
  taskData: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize, jsonOutput } = options;

  // Don't actually create in dry run mode
  if (!dryRun) {
    const newTask = await repo.createTask({
      title: taskData.title,
      status: taskData.status,
      readiness: taskData.readiness,
      tags: taskData.tags,
      childOf: taskData.parentId || taskData.childOf,
      after: taskData.after,
      metadata: taskData.metadata
    });

    results?.added.push(newTask);

    if (!jsonOutput) {
      console.log(colorize(`│    ✓ Created new task ${newTask.id}`, asChalkColor((asChalkColor(('green' as ChalkColor))))));
      
      // Show hierarchy info if applicable
      if (newTask.parentId) {
        console.log(colorize(`│      Child of task: ${newTask.parentId}`, asChalkColor((asChalkColor(('blue' as ChalkColor))))));
      }
      
      // Show key properties
      const properties = [];
      if (taskData.status) properties.push(`status: ${taskData.status}`);
      if (taskData.readiness) properties.push(`readiness: ${taskData.readiness}`);
      if (taskData.tags && taskData.tags.length > 0) properties.push(`tags: [${taskData.tags.join(', ')}]`);
      
      if (properties.length > 0) {
        console.log(colorize(`│      Properties: ${properties.join(', ')}`, asChalkColor((asChalkColor(('gray' as ChalkColor))))));
      }
    }
  } else {
    const simTask = {
      title: taskData.title,
      status: taskData.status || 'todo',
      readiness: taskData.readiness || 'draft',
      tags: taskData.tags || [],
      parentId: taskData.parentId || taskData.childOf,
      dry_run: true
    };

    results?.added.push(simTask);

    if (!jsonOutput) {
      console.log(colorize(`│    ✓ Would create new task: "${taskData.title}"`, asChalkColor((asChalkColor(('green' as ChalkColor))))));
    }
  }
}