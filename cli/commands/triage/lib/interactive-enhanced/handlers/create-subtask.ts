/**
 * Create subtask handler
 */

import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import readline from 'readline';
import { TaskRepository } from '../../../../../core/repo';
import { TaskStatus } from '../../../../../core/types';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils';


/**
 * Handle creating a subtask for the current task
 * @param task Parent task 
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export async function handleCreateSubtaskAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void> {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would create subtask (dry run).', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    results?.added.push({
      title: '[Subtask]',
      parentId: task.id,
      dry_run: true
    });
    return;
  }
  
  console.log(colorize('\n┌─ Create Subtask', asChalkColor((asChalkColor(('green' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('│', asChalkColor((asChalkColor(('green' as ChalkColor))))));
  console.log(colorize('├─ Parent Task: ', asChalkColor((asChalkColor(('green' as ChalkColor))))) + 
              colorize(task.id || '', asChalkColor((asChalkColor(('green' as ChalkColor))))) + ': ' + task.title);
  
  // Get subtask details
  const rl1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const titleInput = await new Promise<string>(resolve => {
    rl1.question(colorize('├─ Subtask Title: ', asChalkColor((asChalkColor(('green' as ChalkColor))))), resolve);
  });
  
  rl1.close();
  
  if (!titleInput.trim()) {
    console.log(colorize('└─ Cancelled - title is required', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    return;
  }
  
  // Get status
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const statusMenu = `
${colorize('1', asChalkColor((asChalkColor(('blue' as ChalkColor)))))} - todo
${colorize('2', asChalkColor((asChalkColor(('yellow' as ChalkColor)))))} - in-progress
${colorize('3', asChalkColor((asChalkColor(('green' as ChalkColor)))))} - done
${colorize('0', asChalkColor((asChalkColor(('gray' as ChalkColor)))))} - default (todo)
`;
  
  console.log(colorize('│', asChalkColor((asChalkColor(('green' as ChalkColor))))));
  console.log(colorize('├─ Status Options:', asChalkColor((asChalkColor(('green' as ChalkColor))))));
  console.log(statusMenu);
  
  const statusInput = await new Promise<string>(resolve => {
    rl2.question(colorize('├─ Select status [0-3]: ', asChalkColor((asChalkColor(('green' as ChalkColor))))), resolve);
  });
  
  rl2.close();
  
  // Map input to status
  let status: TaskStatus = 'todo';  // Default
  switch (statusInput) {
    case '1': status = 'todo'; break;
    case '2': status = 'in-progress'; break;
    case '3': status = 'done'; break;
  }
  
  // Get tags
  const rl3 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(colorize('│', asChalkColor((asChalkColor(('green' as ChalkColor))))));
  console.log(colorize('├─ Enter tags (comma-separated) or leave empty:', asChalkColor((asChalkColor(('green' as ChalkColor))))));
  
  const tagsInput = await new Promise<string>(resolve => {
    rl3.question(colorize('├─ Tags: ', asChalkColor((asChalkColor(('green' as ChalkColor))))), resolve);
  });
  
  rl3.close();
  
  // Process tags
  const tags = tagsInput.trim() ? 
    tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0) : 
    [];
  
  // Create the subtask
  console.log(colorize('│', asChalkColor((asChalkColor(('green' as ChalkColor))))));
  console.log(colorize('├─ Creating subtask...', asChalkColor((asChalkColor(('green' as ChalkColor))))));
  
  const newTask = await repo.createTask({
    title: titleInput.trim(),
    status,
    readiness: 'draft',
    tags,
    childOf: task.id
  });
  
  results?.added.push(newTask);
  console.log(colorize('└─ ✓ Subtask created with ID: ' + newTask.id, asChalkColor((asChalkColor(('green' as ChalkColor)))), asChalkColor('bold')));
}