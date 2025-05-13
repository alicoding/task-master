/**
 * Update task status and readiness handler
 */

import readline from 'readline';
import { TaskRepository } from '../../../../../core/repo';
import { TaskStatus, TaskReadiness } from '../../../../../core/types';
import { ChalkColor, ChalkStyle, ProcessingOptions, TriageResults, TriageTask, colorizeStatus, colorizeReadiness } from '../../utils';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

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
    console.log(colorize('Would update task (dry run).', asChalkColor((asChalkColor((asChalkColor('yellow')))))));
    results?.updated.push({
      id: task.id,
      title: task.title,
      dry_run: true
    });
    return;
  }
  
  // Status update
  console.log(colorize('\n┌─ Update Task Status/Readiness', asChalkColor((asChalkColor((asChalkColor('yellow'))))), asChalkColor('bold')));
  console.log(colorize('│', asChalkColor((asChalkColor((asChalkColor('yellow')))))));
  console.log(colorize('├─ Current Status: ', asChalkColor((asChalkColor((asChalkColor('yellow')))))) + colorizeStatus(task.status as string, colorize));
  
  const rl1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const statusMenu = `
${colorize('1', asChalkColor((asChalkColor((asChalkColor('blue'))))))} - todo
${colorize('2', asChalkColor((asChalkColor((asChalkColor('yellow'))))))} - in-progress
${colorize('3', asChalkColor((asChalkColor((asChalkColor('green'))))))} - done
${colorize('0', asChalkColor((asChalkColor((asChalkColor('gray'))))))} - keep current
`;
  
  console.log(colorize('│', asChalkColor((asChalkColor((asChalkColor('yellow')))))));
  console.log(colorize('├─ Available Options:', asChalkColor((asChalkColor((asChalkColor('yellow')))))));
  console.log(statusMenu);
  
  const statusInput = await new Promise<string>(resolve => {
    rl1.question(colorize('├─ Select new status [0-3]: ', asChalkColor((asChalkColor((asChalkColor('yellow')))))), resolve);
  });
  
  rl1.close();
  
  // Map input to status
  let newStatus: TaskStatus | undefined = undefined;
  switch (statusInput) {
    case '1': newStatus = 'todo'; break;
    case '2': newStatus = 'in-progress'; break;
    case '3': newStatus = 'done'; break;
    default: console.log(colorize('│  Keeping current status', asChalkColor((asChalkColor((asChalkColor('gray')))))));
  }
  
  // Readiness update
  console.log(colorize('│', asChalkColor((asChalkColor((asChalkColor('yellow')))))));
  console.log(colorize('├─ Current Readiness: ', asChalkColor((asChalkColor((asChalkColor('yellow')))))) + colorizeReadiness(task.readiness as string, colorize));
  
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const readinessMenu = `
${colorize('1', asChalkColor((asChalkColor((asChalkColor('yellow'))))))} - draft
${colorize('2', asChalkColor((asChalkColor((asChalkColor('green'))))))} - ready
${colorize('3', asChalkColor((asChalkColor((asChalkColor('red'))))))} - blocked
${colorize('0', asChalkColor((asChalkColor((asChalkColor('gray'))))))} - keep current
`;
  
  console.log(colorize('│', asChalkColor((asChalkColor((asChalkColor('yellow')))))));
  console.log(colorize('├─ Available Options:', asChalkColor((asChalkColor((asChalkColor('yellow')))))));
  console.log(readinessMenu);
  
  const readinessInput = await new Promise<string>(resolve => {
    rl2.question(colorize('├─ Select new readiness [0-3]: ', asChalkColor((asChalkColor((asChalkColor('yellow')))))), resolve);
  });
  
  rl2.close();
  
  // Map input to readiness
  let newReadiness: TaskReadiness | undefined = undefined;
  switch (readinessInput) {
    case '1': newReadiness = 'draft'; break;
    case '2': newReadiness = 'ready'; break;
    case '3': newReadiness = 'blocked'; break;
    default: console.log(colorize('│  Keeping current readiness', asChalkColor((asChalkColor((asChalkColor('gray')))))));
  }
  
  // Only update if something changed
  if (newStatus !== undefined || newReadiness !== undefined) {
    const updateParams: any = { id: task.id };
    if (newStatus !== undefined) updateParams.status = newStatus;
    if (newReadiness !== undefined) updateParams.readiness = newReadiness;
    
    const updatedTask = await repo.updateTask(updateParams);
    
    results?.updated.push(updatedTask);
    console.log(colorize('└─ ✓ Task updated successfully', asChalkColor((asChalkColor((asChalkColor('green'))))), asChalkColor('bold')));
  } else {
    console.log(colorize('└─ No changes made', asChalkColor((asChalkColor((asChalkColor('yellow')))))));
  }
}