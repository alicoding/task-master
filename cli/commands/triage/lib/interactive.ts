import { TaskRepository } from '../../../../core/repo';
import { NlpService } from '../../../../core/nlp-service';
import readline from 'readline';
import { ProcessingOptions, TriageResults, colorizeStatus, colorizeReadiness, ChalkColor, ChalkStyle } from './utils';
import { TaskReadiness, TaskStatus } from '../../../../core/types';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Run interactive triage mode
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
 */
export async function runInteractiveMode(
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, similarityThreshold, autoMerge, colorize, jsonOutput } = options;

  // Get all tasks and filter for draft/todo tasks
  const allTasks = await repo.getAllTasks();

  // Get open tasks (not done and not blocked)
  const openTasks = allTasks.filter(task =>
    task.status !== 'done' && task.readiness !== 'blocked'
  );

  if (openTasks.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ message: 'No open tasks to triage' }));
    } else {
      console.log(colorize('No open tasks to triage.', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    }
    return;
  }

  if (!jsonOutput) {
    console.log(colorize(`Found ${openTasks.length} open tasks to triage.`, asChalkColor((asChalkColor(('green' as ChalkColor))))));
    console.log(colorize('Processing tasks one by one. Press Ctrl+C to exit at any time.\n', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
  }

  // Sort tasks by ID (which prioritizes parent tasks before children)
  openTasks.sort((a, b) => {
    const aParts = a.id.split('.').map(Number);
    const bParts = b.id.split('.').map(Number);

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      if (aParts[i] !== bParts[i]) {
        return aParts[i] - bParts[i];
      }
    }

    return aParts.length - bParts.length;
  });

  // Process each task interactively
  for (let i = 0; i < openTasks.length; i++) {
    const task = openTasks[i];

    if (!jsonOutput) {
      await displayTaskDetails(task, i, openTasks.length, allTasks, colorize);

      // Find similar tasks
      const similarTasks = await repo.findSimilarTasks(task.title);

      // Filter by threshold and exclude the current task
      const filteredTasks = similarTasks
        .filter(t => {
          const score = t.metadata?.similarityScore || 0;
          return score >= similarityThreshold && t.id !== task.id;
        });

      if (filteredTasks.length > 0) {
        await displaySimilarTasks(filteredTasks, colorize);
      }

      // Process the task based on user action
      const action = await promptForAction(filteredTasks, colorize);

      // Handle user actions
      if (action === 'q') {
        console.log(colorize('Exiting interactive mode.', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
        break;
      }

      if (action === 's') {
        console.log(colorize('Skipping this task.', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
        results?.skipped.push({
          id: task.id,
          title: task.title,
          reason: 'Manual skip in interactive mode'
        });
        continue;
      }

      if (action === 'u') {
        await handleUpdateAction(task, repo, results, options);
      }

      if (action === 'd') {
        await handleDoneAction(task, repo, results, options);
      }

      if (action === 't') {
        await handleTagsAction(task, repo, results, options);
      }

      if (action === 'm' && filteredTasks.length > 0) {
        await handleMergeAction(task, filteredTasks, repo, results, options);
      }
    } else {
      // JSON output mode - much simpler
      console.log(JSON.stringify({
        task_for_triage: {
          id: task.id,
          title: task.title,
          status: task.status,
          readiness: task.readiness,
          tags: task.tags,
          dry_run: dryRun
        }
      }));
    }
  }
}

/**
 * Display task details in interactive mode
 * @param task Task to display
 * @param index Current task index
 * @param total Total number of tasks
 * @param allTasks All tasks for reference
 * @param colorize Color function
 */
async function displayTaskDetails(
  task: any,
  index: number,
  total: number,
  allTasks: any[],
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
) {
  console.log(colorize(`\nTask ${index+1}/${total}:`, asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize(`ID: ${task.id}`, asChalkColor((asChalkColor(('blue' as ChalkColor))))));
  console.log(`Title: ${task.title}`);
  console.log(`Status: ${colorizeStatus(task.status, colorize)}`);
  console.log(`Readiness: ${colorizeReadiness(task.readiness, colorize)}`);
  console.log(`Tags: ${task.tags?.join(', ') || 'none'}`);

  // Show parent task if it exists
  if (task.parentId) {
    const parentTask = allTasks.find(t => t.id === task.parentId);
    if (parentTask) {
      console.log(`Parent: ${colorize(parentTask.id, asChalkColor((asChalkColor(('yellow' as ChalkColor)))))}: ${parentTask.title}`);
    }
  }

  // Find child tasks
  const childTasks = allTasks.filter(t => t.parentId === task.id);
  if (childTasks.length > 0) {
    console.log(colorize(`\nChild Tasks (${childTasks.length}):`, asChalkColor((asChalkColor(('magenta' as ChalkColor))))));
    childTasks.forEach(child => {
      console.log(`  ${colorize(child.id, asChalkColor((asChalkColor(('gray' as ChalkColor)))))}: ${child.title} [${child.status}]`);
    });
  }
}

/**
 * Display similar tasks
 * @param filteredTasks Similar tasks to display
 * @param colorize Color function
 */
async function displaySimilarTasks(
  filteredTasks: any[],
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
) {
  console.log(colorize(`\nSimilar Tasks Found (${filteredTasks.length}):`, asChalkColor((asChalkColor(('yellow' as ChalkColor))))));

  filteredTasks.forEach((t, idx) => {
    const score = t.metadata?.similarityScore || 0;
    const percentage = Math.round(score * 100);
    let scoreColor: ChalkColor = (asChalkColor((asChalkColor(('green' as ChalkColor)))));
    if (percentage >= 80) scoreColor = (asChalkColor((asChalkColor(('red' as ChalkColor)))));
    else if (percentage >= 60) scoreColor = (asChalkColor((asChalkColor(('yellow' as ChalkColor)))));

    console.log(`  ${colorize(`[${idx + 1}]`, asChalkColor((asChalkColor(('blue' as ChalkColor)))))} ${t.id}: ${t.title}`);
    console.log(`     ${colorize(`Similarity: ${percentage}%`, scoreColor)}`);
  });
}

/**
 * Prompt user for action
 * @param filteredTasks Similar tasks (for merge option)
 * @param colorize Color function
 * @returns Selected action
 */
async function promptForAction(
  filteredTasks: any[],
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): Promise<string> {
  // Show action menu
  console.log(colorize('\nActions:', asChalkColor((asChalkColor(('cyan' as ChalkColor)))), asChalkColor('bold')));
  console.log(colorize('  u', asChalkColor((asChalkColor(('yellow' as ChalkColor))))) + ') ' + colorize('Update', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Update task status/readiness');
  console.log(colorize('  d', asChalkColor((asChalkColor(('red' as ChalkColor))))) + ') ' + colorize('Done', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Mark task as completed');
  console.log(colorize('  t', asChalkColor((asChalkColor(('green' as ChalkColor))))) + ') ' + colorize('Tags', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Add/remove tags');

  if (filteredTasks.length > 0) {
    console.log(colorize('  m', asChalkColor((asChalkColor(('magenta' as ChalkColor))))) + ') ' + colorize('Merge', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Merge with a similar task');
  }

  console.log(colorize('  s', asChalkColor((asChalkColor(('gray' as ChalkColor))))) + ') ' + colorize('Skip', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Skip this task');
  console.log(colorize('  q', asChalkColor((asChalkColor(('red' as ChalkColor))))) + ') ' + colorize('Quit', asChalkColor((asChalkColor(('white' as ChalkColor))))) + ' - Exit interactive mode');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Get user action
  const action = await new Promise<string>(resolve => {
    rl.question(colorize('\nChoose an action: ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))), resolve);
  });

  rl.close();

  return action.toLowerCase();
}

/**
 * Handle update action
 * @param task Task to update
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
async function handleUpdateAction(
  task: any,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize } = options;

  if (dryRun) {
    console.log(colorize('Would update task (dry run).', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    results?.updated.push({
      id: task.id,
      title: task.title,
      dry_run: true
    });
    return;
  }

  // Get new status
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(colorize('\nCurrent status: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + colorizeStatus(task.status, colorize));
  const newStatusInput = await new Promise<string>(resolve => {
    rl2.question(colorize('New status [todo, in-progress, done] (leave empty to keep current): ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))), resolve);
  });

  rl2.close();

  // Validate and set new status
  let newStatus: TaskStatus | undefined = undefined;
  if (newStatusInput) {
    // Validate input is a valid TaskStatus
    if (['todo', 'in-progress', 'done'].includes(newStatusInput)) {
      newStatus = newStatusInput as TaskStatus;
    } else {
      console.log(colorize('Invalid status. Using current value.', asChalkColor((asChalkColor(('red' as ChalkColor))))));
    }
  }

  // Get new readiness
  const rl3 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(colorize('Current readiness: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + colorizeReadiness(task.readiness, colorize));
  const newReadinessInput = await new Promise<string>(resolve => {
    rl3.question(colorize('New readiness [draft, ready, blocked] (leave empty to keep current): ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))), resolve);
  });

  rl3.close();

  // Validate and set new readiness
  let newReadiness: TaskReadiness | undefined = undefined;
  if (newReadinessInput) {
    // Validate input is a valid TaskReadiness
    if (['draft', 'ready', 'blocked'].includes(newReadinessInput)) {
      newReadiness = newReadinessInput as TaskReadiness;
    } else {
      console.log(colorize('Invalid readiness. Using current value.', asChalkColor((asChalkColor(('red' as ChalkColor))))));
    }
  }

  // Update the task
  const updatedTask = await repo.updateTask({
    id: task.id,
    status: newStatus,
    readiness: newReadiness
  });

  results?.updated.push(updatedTask);
  console.log(colorize('✓ Task updated successfully.', asChalkColor((asChalkColor(('green' as ChalkColor))))));
}

/**
 * Handle done action
 * @param task Task to mark as done
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
async function handleDoneAction(
  task: any,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
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

  // Mark as done
  const updatedTask = await repo.updateTask({
    id: task.id,
    status: 'done'
  });

  results?.updated.push(updatedTask);
  console.log(colorize('✓ Task marked as done.', asChalkColor((asChalkColor(('green' as ChalkColor))))));
}

/**
 * Handle tags action
 * @param task Task to update tags
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
async function handleTagsAction(
  task: any,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
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

  // Get new tags
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(colorize('\nCurrent tags: ', asChalkColor((asChalkColor(('blue' as ChalkColor))))) + (task.tags?.join(', ') || 'none'));
  const tagsInput = await new Promise<string>(resolve => {
    rl2.question(colorize('New tags (comma-separated, leave empty to keep current): ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))), resolve);
  });

  rl2.close();

  if (tagsInput.trim()) {
    const newTags = tagsInput.split(',').map((t: string) => t.trim()).filter((t: string) => t);

    // Update the task
    const updatedTask = await repo.updateTask({
      id: task.id,
      tags: newTags
    });

    results?.updated.push(updatedTask);
    console.log(colorize('✓ Tags updated successfully.', asChalkColor((asChalkColor(('green' as ChalkColor))))));
  } else {
    console.log(colorize('Tags unchanged.', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
  }
}

/**
 * Handle merge action
 * @param task Source task
 * @param filteredTasks Similar tasks to potentially merge with
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
async function handleMergeAction(
  task: any,
  filteredTasks: any[],
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
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

  // Get merge target
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const mergeTarget = await new Promise<string>(resolve => {
    rl2.question(colorize(`Enter task number to merge with [1-${filteredTasks.length}]: `, asChalkColor((asChalkColor(('cyan' as ChalkColor))))), resolve);
  });

  rl2.close();

  const targetIndex = parseInt(mergeTarget) - 1;

  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= filteredTasks.length) {
    console.log(colorize('Invalid selection. Merge cancelled.', asChalkColor((asChalkColor(('red' as ChalkColor))))));
    return;
  }

  const targetTask = filteredTasks[targetIndex];

  // Confirm merge
  const rl3 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(colorize(`\nMerging:`));
  console.log(colorize(`Source: `, asChalkColor((asChalkColor(('yellow' as ChalkColor))))) + `${task.id}: ${task.title}`);
  console.log(colorize(`Target: `, asChalkColor((asChalkColor(('green' as ChalkColor))))) + `${targetTask.id}: ${targetTask.title}`);

  const confirmMerge = await new Promise<string>(resolve => {
    rl3.question(colorize('Proceed with merge? [y/n]: ', asChalkColor((asChalkColor(('cyan' as ChalkColor))))), resolve);
  });

  rl3.close();

  if (confirmMerge.toLowerCase() !== 'y') {
    console.log(colorize('Merge cancelled.', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    return;
  }

  // Perform the merge
  // Combine tags
  const combinedTags = [...new Set([
    ...(task.tags || []),
    ...(targetTask.tags || [])
  ])];

  // Merge metadata
  const mergedMetadata = {
    ...(task.metadata || {}),
    ...(targetTask.metadata || {}),
    mergedFrom: task.id,
    mergedAt: new Date().toISOString()
  };

  // Delete similarity score if present
  delete mergedMetadata.similarityScore;

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

  console.log(colorize('✓ Tasks merged successfully.', asChalkColor((asChalkColor(('green' as ChalkColor))))));
}