/**
 * Enhanced interactive mode for triage command
 * Provides an improved UI for working with tasks
 */

import { TaskRepository } from '../../../../core/repo.js';
import { NlpService } from '../../../../core/nlp-service-mock.js';
import { TaskGraph } from '../../../../core/graph.js';
import readline from 'readline';
import { 
  ProcessingOptions, 
  TriageResults, 
  TriageTask, 
  colorizeStatus, 
  colorizeReadiness, 
  ChalkColor, 
  ChalkStyle 
} from './utils.js';
import { TaskReadiness, TaskStatus } from '../../../../core/types.js';

/**
 * Run enhanced interactive triage mode
 */
export async function runInteractiveMode(
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, similarityThreshold, autoMerge, colorize, jsonOutput } = options;
  const graph = new TaskGraph(repo);

  // Get all tasks
  const allTasks = await repo.getAllTasks();

  // Get pending tasks (open tasks that need triage)
  // Focus on tasks that are not done or are in draft state
  const pendingTasks = allTasks.filter(task => 
    task.status !== 'done' || task.readiness === 'draft'
  );
  
  if (pendingTasks.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ message: 'No pending tasks to triage' }));
    } else {
      console.log(colorize('No pending tasks to triage.', 'yellow'));
    }
    return;
  }

  // Sort tasks by status, readiness, and then by ID
  pendingTasks.sort((a, b) => {
    // First by status priority (todo > in-progress > done)
    const statusOrder: Record<string, number> = { 'todo': 0, 'in-progress': 1, 'done': 2 };
    const statusDiff = statusOrder[a.status as string] - statusOrder[b.status as string];
    if (statusDiff !== 0) return statusDiff;

    // Then by readiness (draft > ready > blocked)
    const readinessOrder: Record<string, number> = { 'draft': 0, 'ready': 1, 'blocked': 2 };
    const readinessDiff = readinessOrder[a.readiness as string] - readinessOrder[b.readiness as string];
    if (readinessDiff !== 0) return readinessDiff;

    // Finally by ID
    return a.id.localeCompare(b.id);
  });
  
  if (!jsonOutput) {
    displayInteractiveIntro(pendingTasks.length, colorize);
  }
  
  // Process each task interactively
  let taskIndex = 0;
  let running = true;
  
  while (running && taskIndex < pendingTasks.length) {
    const task = pendingTasks[taskIndex];
    
    if (jsonOutput) {
      // Simple JSON output
      console.log(JSON.stringify({
        current_task: {
          id: task.id,
          title: task.title,
          status: task.status,
          readiness: task.readiness,
          tags: task.tags,
          index: taskIndex + 1,
          total: pendingTasks.length
        }
      }));
    } else {
      // Enhanced UI display
      await displayEnhancedTaskDetails(task, taskIndex, pendingTasks.length, allTasks, graph, colorize);
      
      // Find similar tasks
      const similarTasks = await repo.findSimilarTasks(task.title);
      
      // Filter by threshold and exclude the current task
      const filteredTasks = similarTasks
        .filter(t => {
          const score = t.metadata?.similarityScore || 0;
          return score >= similarityThreshold && t.id !== task.id;
        });
      
      if (filteredTasks.length > 0) {
        await displaySimilarTasksEnhanced(filteredTasks, colorize);
      }
      
      // Get dependencies - using a direct call to the repo since TaskGraph might not have this method
      const dependencies = []; // Placeholder for dependencies - would need proper implementation
      if (dependencies.length > 0) {
        displayDependencies(dependencies, colorize);
      }
      
      // Display available actions
      displayActionMenu(filteredTasks.length > 0, colorize);
      
      // Get user action
      const action = await promptForAction(colorize);
      
      // Process the action
      switch (action) {
        case 'q': // Quit
          console.log(colorize('Exiting triage mode.', 'yellow'));
          running = false;
          break;
          
        case 'n': // Next task
          taskIndex++;
          break;
          
        case 'p': // Previous task
          taskIndex = Math.max(0, taskIndex - 1);
          break;
          
        case 's': // Skip
          console.log(colorize('Skipping this task.', 'gray'));
          results.skipped.push({
            id: task.id,
            title: task.title,
            reason: 'Manual skip in interactive mode'
          });
          taskIndex++;
          break;
          
        case 'u': // Update
          await handleUpdateTaskAction(task, repo, results, options);
          taskIndex++;
          break;
          
        case 'd': // Done
          await handleMarkAsDoneAction(task, repo, results, options);
          taskIndex++;
          break;
          
        case 't': // Tags
          await handleUpdateTagsAction(task, repo, results, options);
          taskIndex++;
          break;
          
        case 'm': // Merge (if similar tasks exist)
          if (filteredTasks.length > 0) {
            await handleMergeTaskAction(task, filteredTasks, repo, results, options);
          } else {
            console.log(colorize('No similar tasks available for merging.', 'yellow'));
          }
          taskIndex++;
          break;
          
        case 'c': // Create subtask
          await handleCreateSubtaskAction(task, repo, results, options);
          // Don't advance to next task after creating a subtask
          break;
          
        case 'b': // Block/unblock
          await handleToggleBlockedAction(task, repo, results, options);
          taskIndex++;
          break;
          
        case 'h': // Help
          displayHelpScreen(colorize);
          break;
          
        default:
          console.log(colorize('Invalid option. Press h for help.', 'red'));
          break;
      }
    }
  }
  
  if (!jsonOutput && running) {
    console.log(colorize('\n✅ All pending tasks have been triaged!', 'green', 'bold'));
  }
}

/**
 * Display intro message for interactive mode
 */
function displayInteractiveIntro(taskCount: number, colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string) {
  console.log(colorize('\n┌' + '─'.repeat(60) + '┐', 'blue'));
  console.log(colorize('│ INTERACTIVE TASK TRIAGE', 'blue', 'bold') + colorize(' '.repeat(37) + '│', 'blue'));
  console.log(colorize('└' + '─'.repeat(60) + '┘', 'blue'));
  
  console.log(colorize(`\nFound ${taskCount} pending tasks to triage.`, 'green'));
  console.log(colorize('Tasks will be presented one by one for review and action.', 'gray'));
  console.log(colorize('Navigate with "n" for next and "p" for previous.', 'gray'));
  console.log(colorize('Press "h" at any time to see all available commands.', 'gray'));
  console.log(colorize('Press Ctrl+C to exit at any time.\n', 'gray'));
}

/**
 * Display enhanced task details with hierarchy and metadata
 */
async function displayEnhancedTaskDetails(
  task: {
    id: string,
    title: string,
    status: string,
    readiness: string,
    tags: string[],
    parentId?: string,
    createdAt: string,
    updatedAt: string,
    metadata?: Record<string, any>
  },
  index: number,
  total: number,
  allTasks: {
    id: string,
    title: string,
    status: string,
    readiness: string,
    tags: string[],
    parentId?: string
  }[],
  graph: TaskGraph,
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
) {
  // Get task hierarchy information
  const childTasks = allTasks.filter(t => t.parentId === task.id);
  const parentTask = task.parentId ? allTasks.find(t => t.id === task.parentId) : null;
  
  // Header with progress
  console.log(colorize(`\n┌─ Task ${index+1}/${total} `, 'blue', 'bold') + 
              colorize(`(${task.status}`, getStatusColor(task.status)) + 
              colorize(' / ', 'gray') + 
              colorize(`${task.readiness})`, getReadinessColor(task.readiness)));
  
  console.log(colorize('│', 'blue'));
  console.log(colorize('├─ ID: ', 'blue') + colorize(task.id, 'blue', 'bold'));
  
  // Task title with status indicators
  console.log(colorize('├─ Title: ', 'blue') + task.title);
  
  // Tags with better formatting
  if (task.tags && task.tags.length > 0) {
    console.log(colorize('├─ Tags: ', 'blue') +
                task.tags.map((tag) => colorize(tag, 'cyan')).join(', '));
  } else {
    console.log(colorize('├─ Tags: ', 'blue') + colorize('none', 'gray'));
  }
  
  // Show status with color
  console.log(colorize('├─ Status: ', 'blue') + colorizeStatus(task.status, colorize));
  
  // Show readiness with color
  console.log(colorize('├─ Readiness: ', 'blue') + colorizeReadiness(task.readiness, colorize));
  
  // Show creation/update dates
  console.log(colorize('├─ Created: ', 'blue') + new Date(task.createdAt).toLocaleString());
  console.log(colorize('├─ Updated: ', 'blue') + new Date(task.updatedAt).toLocaleString());
  
  // Show parentage information if any
  if (parentTask) {
    console.log(colorize('│', 'blue'));
    console.log(colorize('├─ Parent Task:', 'magenta'));
    console.log(colorize('│  ', 'blue') + colorize(parentTask.id + ': ', 'magenta') + parentTask.title);
  }
  
  // Show child tasks if any
  if (childTasks.length > 0) {
    console.log(colorize('│', 'blue'));
    console.log(colorize(`├─ Child Tasks (${childTasks.length}):`, 'green'));
    childTasks.forEach((child, idx) => {
      const statusColor = getStatusColor(child.status);
      console.log(colorize('│  ', 'blue') + 
                  colorize(`[${idx + 1}] `, 'green') + 
                  colorize(child.id + ': ', 'green') + 
                  child.title + ' ' + 
                  colorize(`(${child.status})`, statusColor));
    });
  }
  
  // Show metadata if any
  if (task.metadata && Object.keys(task.metadata).length > 0) {
    console.log(colorize('│', 'blue'));
    console.log(colorize('├─ Metadata:', 'yellow'));
    
    for (const [key, value] of Object.entries(task.metadata)) {
      // Skip similarity score
      if (key === 'similarityScore') continue;
      
      console.log(colorize('│  ', 'blue') + 
                  colorize(key + ': ', 'yellow') + 
                  JSON.stringify(value));
    }
  }
  
  // Footer
  console.log(colorize('└' + '─'.repeat(60), 'blue'));
}

/**
 * Display similar tasks with enhanced formatting
 */
async function displaySimilarTasksEnhanced(
  filteredTasks: {
    id: string,
    title: string,
    status: string,
    tags: string[],
    metadata?: {
      similarityScore?: number;
      [key: string]: any;
    }
  }[],
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
) {
  console.log(colorize(`\n┌─ Similar Tasks Found (${filteredTasks.length})`, 'yellow', 'bold'));
  
  filteredTasks.forEach((task, idx) => {
    const score = task.metadata?.similarityScore || 0;
    const percentage = Math.round(score * 100);
    
    // Determine color based on similarity
    let simColor: ChalkColor = 'green';
    if (percentage >= 90) simColor = 'red';
    else if (percentage >= 80) simColor = 'red';
    else if (percentage >= 70) simColor = 'magenta';
    else if (percentage >= 60) simColor = 'yellow';
    
    // Generate a similarity bar
    const barLength = Math.round(percentage / 5); // 20 chars = 100%
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    
    console.log(colorize(`├─ [${idx + 1}] `, 'yellow') + 
                colorize(task.id + ': ', 'yellow') + 
                task.title);
    
    console.log(colorize('│  ', 'yellow') + 
                colorize(`Similarity: ${percentage}%  `, simColor) + 
                colorize(bar, simColor));
    
    // Status and tags
    console.log(colorize('│  ', 'yellow') + 
                `Status: ${colorizeStatus(task.status, colorize)}, ` + 
                `Tags: ${task.tags.length > 0 ? 
                        task.tags.map((tag) => colorize(tag, 'cyan')).join(', ') : 
                        colorize('none', 'gray')}`);
  });
  
  // Footer
  console.log(colorize('└' + '─'.repeat(60), 'yellow'));
}

/**
 * Display dependencies for the current task
 */
function displayDependencies(
  dependencies: {
    direction: 'blocked' | 'blocking';
    task: {
      id: string;
      title: string;
      status: string;
    }
  }[],
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
) {
  console.log(colorize(`\n┌─ Task Dependencies (${dependencies.length})`, 'cyan', 'bold'));
  
  // Process and categorize dependencies
  const blocked = dependencies.filter(d => d.direction === 'blocked');
  const blocking = dependencies.filter(d => d.direction === 'blocking');
  
  if (blocked.length > 0) {
    console.log(colorize('├─ Blocked by:', 'cyan'));
    blocked.forEach((dep, idx) => {
      console.log(colorize('│  ', 'cyan') + 
                  colorize(`${dep.task.id}: `, 'red') + 
                  dep.task.title + ' ' + 
                  colorize(`(${dep.task.status})`, getStatusColor(dep.task.status)));
    });
  }
  
  if (blocking.length > 0) {
    console.log(colorize('├─ Blocking:', 'cyan'));
    blocking.forEach((dep, idx) => {
      console.log(colorize('│  ', 'cyan') + 
                  colorize(`${dep.task.id}: `, 'yellow') + 
                  dep.task.title + ' ' + 
                  colorize(`(${dep.task.status})`, getStatusColor(dep.task.status)));
    });
  }
  
  // Footer
  console.log(colorize('└' + '─'.repeat(60), 'cyan'));
}

/**
 * Display the action menu
 */
function displayActionMenu(
  hasSimilarTasks: boolean,
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
) {
  console.log(colorize('\nActions:', 'cyan', 'bold'));
  
  // Navigation commands
  console.log(colorize('  n', 'blue') + ') ' + colorize('Next', 'white') + ' - Move to next task');
  console.log(colorize('  p', 'blue') + ') ' + colorize('Previous', 'white') + ' - Move to previous task');
  
  // Task commands
  console.log(colorize('  u', 'yellow') + ') ' + colorize('Update', 'white') + ' - Update task status/readiness');
  console.log(colorize('  d', 'green') + ') ' + colorize('Done', 'white') + ' - Mark task as completed');
  console.log(colorize('  t', 'cyan') + ') ' + colorize('Tags', 'white') + ' - Add/remove tags');
  console.log(colorize('  b', 'magenta') + ') ' + colorize('Block/Unblock', 'white') + ' - Toggle blocked status');
  console.log(colorize('  c', 'green') + ') ' + colorize('Create Subtask', 'white') + ' - Add a subtask to this task');
  
  // Only show merge if similar tasks exist
  if (hasSimilarTasks) {
    console.log(colorize('  m', 'red') + ') ' + colorize('Merge', 'white') + ' - Merge with a similar task');
  }
  
  // Other commands
  console.log(colorize('  s', 'gray') + ') ' + colorize('Skip', 'white') + ' - Skip this task');
  console.log(colorize('  h', 'cyan') + ') ' + colorize('Help', 'white') + ' - Show help screen');
  console.log(colorize('  q', 'red') + ') ' + colorize('Quit', 'white') + ' - Exit triage mode');
}

/**
 * Display help screen with all commands
 */
function displayHelpScreen(
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
) {
  console.log(colorize('\n┌' + '─'.repeat(60) + '┐', 'cyan'));
  console.log(colorize('│ TRIAGE MODE HELP', 'cyan', 'bold') + colorize(' '.repeat(43) + '│', 'cyan'));
  console.log(colorize('└' + '─'.repeat(60) + '┘', 'cyan'));
  
  console.log(colorize('\nNavigation Commands:', 'blue', 'bold'));
  console.log(colorize('  n', 'blue') + ') ' + colorize('Next', 'white') + ' - Move to the next task');
  console.log(colorize('  p', 'blue') + ') ' + colorize('Previous', 'white') + ' - Move to the previous task');
  console.log(colorize('  s', 'gray') + ') ' + colorize('Skip', 'white') + ' - Skip this task (won\'t be marked as processed)');
  console.log(colorize('  q', 'red') + ') ' + colorize('Quit', 'white') + ' - Exit triage mode');
  
  console.log(colorize('\nTask Management Commands:', 'green', 'bold'));
  console.log(colorize('  u', 'yellow') + ') ' + colorize('Update', 'white') + ' - Update task status and readiness');
  console.log(colorize('  d', 'green') + ') ' + colorize('Done', 'white') + ' - Mark task as completed');
  console.log(colorize('  t', 'cyan') + ') ' + colorize('Tags', 'white') + ' - Add or remove tags');
  console.log(colorize('  b', 'magenta') + ') ' + colorize('Block/Unblock', 'white') + ' - Toggle blocked status');
  console.log(colorize('  c', 'green') + ') ' + colorize('Create Subtask', 'white') + ' - Add a subtask to this task');
  
  console.log(colorize('\nDuplication Management:', 'yellow', 'bold'));
  console.log(colorize('  m', 'red') + ') ' + colorize('Merge', 'white') + ' - Merge with a similar task (only shown when similar tasks exist)');
  
  console.log(colorize('\nOther Commands:', 'magenta', 'bold'));
  console.log(colorize('  h', 'cyan') + ') ' + colorize('Help', 'white') + ' - Show this help screen');
  
  console.log(colorize('\nTips:', 'gray', 'bold'));
  console.log(colorize('  - Tasks are presented in order: todo, in-progress, done, with draft items first', 'gray'));
  console.log(colorize('  - Similar tasks are shown when found, and can be merged to reduce duplication', 'gray'));
  console.log(colorize('  - Use the "Block/Unblock" command to quickly toggle a task\'s blocked status', 'gray'));
  console.log(colorize('  - Creating subtasks helps break down complex work into manageable pieces', 'gray'));
  console.log(colorize('  - Press Ctrl+C at any time to force exit the program', 'gray'));
  
  console.log(colorize('\nPress any key to continue...', 'cyan'));
  
  // This would be better with a single key press, but we'll use readline for now
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('', () => {
    rl.close();
  });
}

/**
 * Prompt user for action
 */
async function promptForAction(
  colorize: (text: string, color?: ChalkColor, style?: ChalkStyle) => string
): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const action = await new Promise<string>(resolve => {
    rl.question(colorize('Choose an action: ', 'cyan'), resolve);
  });
  
  rl.close();
  
  return action.toLowerCase();
}

/**
 * Update task status and readiness
 */
async function handleUpdateTaskAction(
  task: {
    id: string;
    title: string;
    status: string;
    readiness: string;
  },
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
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
  console.log(colorize('├─ Current Status: ', 'yellow') + colorizeStatus(task.status, colorize));
  
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
  console.log(colorize('├─ Current Readiness: ', 'yellow') + colorizeReadiness(task.readiness, colorize));
  
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

/**
 * Mark task as done
 */
async function handleMarkAsDoneAction(
  task: {
    id: string;
    title: string;
  },
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
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

/**
 * Update task tags
 */
async function handleUpdateTagsAction(
  task: {
    id: string;
    title: string;
    tags: string[];
  },
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would update tags (dry run).', 'yellow'));
    results.updated.push({
      id: task.id,
      title: task.title,
      dry_run: true
    });
    return;
  }
  
  // Current tags
  console.log(colorize('\n┌─ Update Task Tags', 'cyan', 'bold'));
  console.log(colorize('│', 'cyan'));
  console.log(colorize('├─ Current Tags: ', 'cyan') + 
              (task.tags.length > 0 ? 
               task.tags.map((tag) => colorize(tag, 'cyan')).join(', ') : 
               colorize('none', 'gray')));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(colorize('│', 'cyan'));
  console.log(colorize('├─ Enter new tags (comma-separated) or:', 'cyan'));
  console.log(colorize('│  ', 'cyan') + colorize('- Enter "clear" to remove all tags', 'white'));
  console.log(colorize('│  ', 'cyan') + colorize('- Leave empty to keep current tags', 'white'));
  
  const tagsInput = await new Promise<string>(resolve => {
    rl.question(colorize('├─ Tags: ', 'cyan'), resolve);
  });
  
  rl.close();
  
  // Process input
  let newTags: string[] | undefined = undefined;
  
  if (tagsInput.trim().toLowerCase() === 'clear') {
    newTags = [];
    console.log(colorize('│  Clearing all tags', 'yellow'));
  } else if (tagsInput.trim()) {
    newTags = tagsInput.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    console.log(colorize('│  Setting new tags: ', 'green') + 
                newTags.map(tag => colorize(tag, 'cyan')).join(', '));
  } else {
    console.log(colorize('│  Keeping current tags', 'gray'));
  }
  
  // Update if tags changed
  if (newTags !== undefined) {
    const updatedTask = await repo.updateTask({
      id: task.id,
      tags: newTags
    });
    
    results.updated.push(updatedTask);
    console.log(colorize('└─ ✓ Tags updated successfully', 'green', 'bold'));
  } else {
    console.log(colorize('└─ No changes made', 'yellow'));
  }
}

/**
 * Merge task with a similar task
 */
async function handleMergeTaskAction(
  task: {
    id: string;
    title: string;
    status: string;
    tags: string[];
    metadata?: Record<string, any>;
  },
  filteredTasks: {
    id: string;
    title: string;
    status: string;
    tags: string[];
    metadata?: Record<string, any>;
  }[],
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would merge tasks (dry run).', 'yellow'));
    results.merged.push({
      id: task.id,
      title: task.title,
      dry_run: true
    });
    return;
  }
  
  console.log(colorize('\n┌─ Merge Tasks', 'red', 'bold'));
  console.log(colorize('│', 'red'));
  console.log(colorize('├─ Source Task: ', 'red') + 
              colorize(task.id, 'red') + ': ' + task.title);
  
  // Select merge target
  const rl1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log(colorize('│', 'red'));
  console.log(colorize('├─ Select target task to merge with:', 'red'));
  
  filteredTasks.forEach((t, i) => {
    const score = t.metadata?.similarityScore || 0;
    const percentage = Math.round(score * 100);
    console.log(colorize(`│  ${i + 1}`, 'white', 'bold') + '. ' + 
                colorize(t.id, 'yellow') + ': ' + t.title + 
                colorize(` (${percentage}% similar)`, 'yellow'));
  });
  
  const targetInput = await new Promise<string>(resolve => {
    rl1.question(colorize('├─ Enter number [1-' + filteredTasks.length + ']: ', 'red'), resolve);
  });
  
  rl1.close();
  
  const targetIndex = parseInt(targetInput) - 1;
  
  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= filteredTasks.length) {
    console.log(colorize('└─ Invalid selection. Merge cancelled.', 'red'));
    return;
  }
  
  const targetTask = filteredTasks[targetIndex];
  
  // Show merge preview
  console.log(colorize('│', 'red'));
  console.log(colorize('├─ Merge Preview:', 'red', 'bold'));
  console.log(colorize('│  ', 'red') + 'Tasks will be merged into: ' + 
              colorize(targetTask.id, 'green') + ': ' + targetTask.title);
  
  // Combine tags
  const combinedTagsSet = new Set([...(task.tags || []), ...(targetTask.tags || [])]);
  const combinedTags = Array.from(combinedTagsSet);
  
  console.log(colorize('│  ', 'red') + 'Combined tags: ' + 
              (combinedTags.length > 0 ? 
               combinedTags.map(tag => colorize(tag, 'cyan')).join(', ') : 
               colorize('none', 'gray')));
  
  // Confirm merge
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const confirmMerge = await new Promise<string>(resolve => {
    rl2.question(colorize('├─ Proceed with merge? [y/n]: ', 'red'), resolve);
  });
  
  rl2.close();
  
  if (confirmMerge.toLowerCase() !== 'y') {
    console.log(colorize('└─ Merge cancelled.', 'yellow'));
    return;
  }
  
  // Perform the merge
  console.log(colorize('│', 'red'));
  console.log(colorize('├─ Performing merge...', 'red'));
  
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
  
  console.log(colorize('└─ ✓ Tasks merged successfully', 'green', 'bold'));
}

/**
 * Create a subtask for the current task
 */
async function handleCreateSubtaskAction(
  task: {
    id: string;
    title: string;
  },
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
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
              colorize(task.id, 'green') + ': ' + task.title);
  
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

/**
 * Toggle blocked status
 */
async function handleToggleBlockedAction(
  task: {
    id: string;
    title: string;
    readiness: string;
    metadata?: Record<string, any>;
  },
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would toggle blocked status (dry run).', 'yellow'));
    results.updated.push({
      id: task.id,
      title: task.title,
      readiness: task.readiness === 'blocked' ? 'ready' : 'blocked',
      dry_run: true
    });
    return;
  }
  
  // Determine new readiness based on current value
  const newReadiness: TaskReadiness = task.readiness === 'blocked' ? 'ready' : 'blocked';
  
  console.log(colorize(`\nToggling task from ${colorizeReadiness(task.readiness, colorize)} to ${colorizeReadiness(newReadiness, colorize)}...`, 'magenta'));
  
  // For tasks being blocked, optionally add a reason
  let metadata = undefined;
  
  if (newReadiness === 'blocked') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const blockedReason = await new Promise<string>(resolve => {
      rl.question(colorize('Enter reason for blocking (optional): ', 'magenta'), resolve);
    });
    
    rl.close();
    
    if (blockedReason.trim()) {
      metadata = {
        ...(task.metadata || {}),
        blockedReason: blockedReason.trim(),
        blockedAt: new Date().toISOString()
      };
    }
  } else if (task.metadata?.blockedReason) {
    // Remove blocked reason when unblocking
    metadata = { ...(task.metadata || {}) };
    delete metadata.blockedReason;
    delete metadata.blockedAt;
  }
  
  // Update the task
  const updatedTask = await repo.updateTask({
    id: task.id,
    readiness: newReadiness,
    metadata
  });
  
  results.updated.push(updatedTask);
  
  if (newReadiness === 'blocked') {
    console.log(colorize('✓ Task marked as blocked', 'red', 'bold'));
  } else {
    console.log(colorize('✓ Task unblocked', 'green', 'bold'));
  }
}

/**
 * Get a color for a status
 */
function getStatusColor(status: string): ChalkColor {
  switch (status) {
    case 'todo': return 'blue';
    case 'in-progress': return 'yellow';
    case 'done': return 'green';
    default: return 'gray';
  }
}

/**
 * Get a color for a readiness
 */
function getReadinessColor(readiness: string): ChalkColor {
  switch (readiness) {
    case 'draft': return 'gray';
    case 'ready': return 'green';
    case 'blocked': return 'red';
    default: return 'gray';
  }
}