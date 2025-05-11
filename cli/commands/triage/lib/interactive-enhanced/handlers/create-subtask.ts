/**
 * Create subtask handler
 */

import readline from 'readline';
import { TaskRepository } from '../../../../../core/repo.ts';
import { TaskStatus } from '../../../../../core/types.ts';
import { ProcessingOptions, TriageResults, TriageTask } from '../../utils.ts';

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
    console.log(colorize('Would create subtask (dry run).', 'yellow'));
    results.added.push({
      title: '[Subtask]',
      parentId: task.id,
      dry_run: true
    });
    return;
  }
  
  console.log(colorize('\n┌─ Create Subtask', 'green', 'bold'));
  console.log(colorize('│', 'green'));
  console.log(colorize('├─ Parent Task: ', 'green') + 
              colorize(task.id || '', 'green') + ': ' + task.title);
  
  // Get subtask details
  const rl1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const titleInput = await new Promise<string>(resolve => {
    rl1.question(colorize('├─ Subtask Title: ', 'green'), resolve);
  });
  
  rl1.close();
  
  if (!titleInput.trim()) {
    console.log(colorize('└─ Cancelled - title is required', 'yellow'));
    return;
  }
  
  // Get status
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const statusMenu = `
${colorize('1', 'blue')} - todo
${colorize('2', 'yellow')} - in-progress
${colorize('3', 'green')} - done
${colorize('0', 'gray')} - default (todo)
`;
  
  console.log(colorize('│', 'green'));
  console.log(colorize('├─ Status Options:', 'green'));
  console.log(statusMenu);
  
  const statusInput = await new Promise<string>(resolve => {
    rl2.question(colorize('├─ Select status [0-3]: ', 'green'), resolve);
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
  
  console.log(colorize('│', 'green'));
  console.log(colorize('├─ Enter tags (comma-separated) or leave empty:', 'green'));
  
  const tagsInput = await new Promise<string>(resolve => {
    rl3.question(colorize('├─ Tags: ', 'green'), resolve);
  });
  
  rl3.close();
  
  // Process tags
  const tags = tagsInput.trim() ? 
    tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0) : 
    [];
  
  // Create the subtask
  console.log(colorize('│', 'green'));
  console.log(colorize('├─ Creating subtask...', 'green'));
  
  const newTask = await repo.createTask({
    title: titleInput.trim(),
    status,
    readiness: 'draft',
    tags,
    childOf: task.id
  });
  
  results.added.push(newTask);
  console.log(colorize('└─ ✓ Subtask created with ID: ' + newTask.id, 'green', 'bold'));
}