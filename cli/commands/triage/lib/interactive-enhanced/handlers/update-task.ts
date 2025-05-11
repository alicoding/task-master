/**
 * Update task status and readiness handler
 */

import readline from 'readline';
import { TaskRepository } from '../../../../../core/repo.ts';
import { TaskStatus, TaskReadiness } from '../../../../../core/types.ts';
import { ChalkColor, ChalkStyle, ProcessingOptions, TriageResults, TriageTask, colorizeStatus, colorizeReadiness } from '../../utils.ts';

/**
 * Handle updating task status and readiness
 * @param task Task to update
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export async function handleUpdateTaskAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void> {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would update task (dry run).', 'yellow'));
    results.updated.push({
      id: task.id,
      title: task.title,
      dry_run: true
    });
    return;
  }
  
  // Status update
  console.log(colorize('\n┌─ Update Task Status/Readiness', 'yellow', 'bold'));
  console.log(colorize('│', 'yellow'));
  console.log(colorize('├─ Current Status: ', 'yellow') + colorizeStatus(task.status as string, colorize));
  
  const rl1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const statusMenu = `
${colorize('1', 'blue')} - todo
${colorize('2', 'yellow')} - in-progress
${colorize('3', 'green')} - done
${colorize('0', 'gray')} - keep current
`;
  
  console.log(colorize('│', 'yellow'));
  console.log(colorize('├─ Available Options:', 'yellow'));
  console.log(statusMenu);
  
  const statusInput = await new Promise<string>(resolve => {
    rl1.question(colorize('├─ Select new status [0-3]: ', 'yellow'), resolve);
  });
  
  rl1.close();
  
  // Map input to status
  let newStatus: TaskStatus | undefined = undefined;
  switch (statusInput) {
    case '1': newStatus = 'todo'; break;
    case '2': newStatus = 'in-progress'; break;
    case '3': newStatus = 'done'; break;
    default: console.log(colorize('│  Keeping current status', 'gray'));
  }
  
  // Readiness update
  console.log(colorize('│', 'yellow'));
  console.log(colorize('├─ Current Readiness: ', 'yellow') + colorizeReadiness(task.readiness as string, colorize));
  
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const readinessMenu = `
${colorize('1', 'yellow')} - draft
${colorize('2', 'green')} - ready
${colorize('3', 'red')} - blocked
${colorize('0', 'gray')} - keep current
`;
  
  console.log(colorize('│', 'yellow'));
  console.log(colorize('├─ Available Options:', 'yellow'));
  console.log(readinessMenu);
  
  const readinessInput = await new Promise<string>(resolve => {
    rl2.question(colorize('├─ Select new readiness [0-3]: ', 'yellow'), resolve);
  });
  
  rl2.close();
  
  // Map input to readiness
  let newReadiness: TaskReadiness | undefined = undefined;
  switch (readinessInput) {
    case '1': newReadiness = 'draft'; break;
    case '2': newReadiness = 'ready'; break;
    case '3': newReadiness = 'blocked'; break;
    default: console.log(colorize('│  Keeping current readiness', 'gray'));
  }
  
  // Only update if something changed
  if (newStatus !== undefined || newReadiness !== undefined) {
    const updateParams: any = { id: task.id };
    if (newStatus !== undefined) updateParams.status = newStatus;
    if (newReadiness !== undefined) updateParams.readiness = newReadiness;
    
    const updatedTask = await repo.updateTask(updateParams);
    
    results.updated.push(updatedTask);
    console.log(colorize('└─ ✓ Task updated successfully', 'green', 'bold'));
  } else {
    console.log(colorize('└─ No changes made', 'yellow'));
  }
}