/**
 * Enhanced merger functionality with improved UX
 */

import { TaskRepository } from '@/core/repo';
import { DuplicateGroup, ColorizeFunction } from '@/cli/commands/deduplicate/lib/utils';
import readline from 'readline';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Result of a merge operation
 */
interface MergeResult {
  action: 'merged' | 'skipped' | 'cancelled';
  primaryTaskId?: string;
  tasksDeleted?: number;
  tasksMarkedAsDuplicate?: number;
}

/**
 * Handle merging tasks in a group with improved UX
 */
export async function handleMerge(
  group: DuplicateGroup,
  repo: TaskRepository,
  colorize: ColorizeFunction
): Promise<MergeResult> {
  // Header
  console.log(colorize(`\n┌${'─'.repeat(78)}┐`, asChalkColor('green')));
  console.log(colorize(`│ TASK MERGE WIZARD ${' '.repeat(62)}│`, asChalkColor('green'), asChalkColor('bold')));
  console.log(colorize(`└${'─'.repeat(78)}┘`, asChalkColor('green')));
  
  console.log(colorize('\n● TASKS TO MERGE', asChalkColor('blue'), asChalkColor('bold')));
  
  // Display tasks with clear numbering
  for (let i = 0; i < group.tasks.length; i++) {
    const task = group.tasks[i];
    const taskNumber = i + 1;
    
    // Determine latest task visually
    const isLatest = task.updatedAt === 
      Math.max(...group.tasks.map(t => new Date(t.updatedAt).getTime()));
    
    console.log(
      colorize(`  [${taskNumber}] `, asChalkColor('blue'), asChalkColor('bold')) + 
      colorize(task.id, asChalkColor('blue')) + ': ' +
      task.title +
      (isLatest ? colorize(' (latest)', asChalkColor('green')) : '')
    );
    
    console.log(
      `     Status: ${colorizeStatus(task.status, colorize)}, ` +
      `Readiness: ${colorizeReadiness(task.readiness, colorize)}, ` +
      `Tags: ${task.tags.length > 0 ? task.tags.map(tag => colorize(tag, asChalkColor('cyan'))).join(', ') : colorize('none', asChalkColor('gray'))}`
    );
    
    console.log(`     Updated: ${new Date(task.updatedAt).toLocaleString()}`);
  }
  
  // Step 1: Select primary task to keep
  console.log(colorize('\n● STEP 1: SELECT PRIMARY TASK', asChalkColor('blue'), asChalkColor('bold')));
  console.log(colorize('  Choose the primary task that you want to keep.', asChalkColor('gray')));
  console.log(colorize('  All metadata from other tasks will be merged into this task.', asChalkColor('gray')));
  
  const rl1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const primaryTaskInput = await new Promise<string>(resolve => {
    rl1.question(colorize('  Select the PRIMARY task [1-' + group.tasks.length + '] or "q" to cancel: ', asChalkColor('cyan')), resolve);
  });
  
  rl1.close();
  
  // Handle cancellation
  if (primaryTaskInput.toLowerCase() === 'q') {
    console.log(colorize('\n✖ Merge cancelled.', asChalkColor('yellow')));
    return { action: 'cancelled' };
  }
  
  const primaryTaskIdx = parseInt(primaryTaskInput) - 1;
  
  if (isNaN(primaryTaskIdx) || primaryTaskIdx < 0 || primaryTaskIdx >= group.tasks.length) {
    console.log(colorize('\n✖ Invalid task selection. Merge cancelled.', asChalkColor('red')));
    return { action: 'cancelled' };
  }
  
  // Step 2: Select secondary tasks to merge
  console.log(colorize('\n● STEP 2: SELECT TASKS TO MERGE', asChalkColor('blue'), asChalkColor('bold')));
  console.log(colorize('  Choose which tasks to merge into the primary task.', asChalkColor('gray')));
  console.log(colorize('  You can enter multiple tasks separated by commas or "all" for all tasks.', asChalkColor('gray')));
  
  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const secondaryTasksInput = await new Promise<string>(resolve => {
    rl2.question(
      colorize('  Tasks to merge (comma-separated, "all", or "q" to cancel): ', asChalkColor('cyan')),
      resolve
    );
  });
  
  rl2.close();
  
  // Handle cancellation
  if (secondaryTasksInput.toLowerCase() === 'q') {
    console.log(colorize('\n✖ Merge cancelled.', asChalkColor('yellow')));
    return { action: 'cancelled' };
  }
  
  const secondaryTaskIndices: number[] = [];
  
  if (secondaryTasksInput.toLowerCase() === 'all') {
    // Add all except primary
    for (let i = 0; i < group.tasks.length; i++) {
      if (i !== primaryTaskIdx) {
        secondaryTaskIndices.push(i);
      }
    }
  } else {
    // Parse comma-separated indices
    const parts = secondaryTasksInput.split(',').map(p => p.trim());
    for (const part of parts) {
      const idx = parseInt(part) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < group.tasks.length && idx !== primaryTaskIdx) {
        secondaryTaskIndices.push(idx);
      }
    }
  }
  
  if (secondaryTaskIndices.length === 0) {
    console.log(colorize('\n✖ No valid secondary tasks selected. Merge cancelled.', asChalkColor('red')));
    return { action: 'cancelled' };
  }
  
  // Prepare merge
  const primaryTask = group.tasks[primaryTaskIdx];
  const secondaryTasks = secondaryTaskIndices.map(idx => group.tasks[idx]);
  
  // Display merge preview with better formatting
  console.log(colorize('\n● MERGE PREVIEW', asChalkColor('blue'), asChalkColor('bold')));
  
  console.log(colorize('  Primary Task:', asChalkColor('green'), asChalkColor('bold')));
  console.log(`    ${colorize(primaryTask.id, asChalkColor('blue'))}: ${primaryTask.title}`);
  console.log(`    Status: ${colorizeStatus(primaryTask.status, colorize)}`);
  console.log(`    Readiness: ${colorizeReadiness(primaryTask.readiness, colorize)}`);
  
  console.log(colorize('  Secondary Tasks:', asChalkColor('yellow'), asChalkColor('bold')));
  for (const task of secondaryTasks) {
    console.log(`    ${colorize(task.id, asChalkColor('blue'))}: ${task.title}`);
  }
  
  // Collect all unique tags
  const allTags = new Set<string>(primaryTask.tags);
  for (const task of secondaryTasks) {
    for (const tag of task.tags) {
      allTags.add(tag);
    }
  }
  
  // Prepare metadata
  const primaryMetadata = typeof primaryTask.metadata === 'string' ? 
    JSON.parse(primaryTask.metadata) : primaryTask.metadata || {};
  
  // Clone and clean primary metadata
  const baseMetadata = { ...primaryMetadata };
  delete baseMetadata.similarityScore;
  
  const mergedMetadata = {
    ...baseMetadata,
    mergedFrom: secondaryTasks.map(t => t.id).join(','),
    mergedAt: new Date().toISOString(),
    mergedTaskTitles: secondaryTasks.map(t => t.title)
  };
  
  // Show resulting task preview
  console.log(colorize('  Result After Merge:', asChalkColor('blue'), asChalkColor('bold')));
  console.log(`    Title: ${primaryTask.title} ${colorize('(unchanged)', asChalkColor('gray'))}`);
  console.log(`    Status: ${colorizeStatus(primaryTask.status, colorize)} ${colorize('(unchanged)', asChalkColor('gray'))}`);
  console.log(`    Readiness: ${colorizeReadiness(primaryTask.readiness, colorize)} ${colorize('(unchanged)', asChalkColor('gray'))}`);
  console.log(`    Tags: ${Array.from(allTags).map(tag => colorize(tag, asChalkColor('cyan'))).join(', ')}`);
  console.log(`    Metadata will include merge history and details`);
  
  // Confirm merge
  console.log(colorize('\n● STEP 3: CONFIRM MERGE', asChalkColor('blue'), asChalkColor('bold')));
  
  const rl3 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const confirmMerge = await new Promise<string>(resolve => {
    rl3.question(colorize('  Proceed with merge? [y/n]: ', asChalkColor('cyan')), resolve);
  });
  
  rl3.close();
  
  if (confirmMerge.toLowerCase() !== 'y') {
    console.log(colorize('\n✖ Merge cancelled.', asChalkColor('yellow')));
    return { action: 'cancelled' };
  }
  
  // Execute merge
  console.log(colorize('\n● MERGING TASKS', asChalkColor('blue'), asChalkColor('bold')));
  console.log(colorize('  Updating primary task with merged data...', asChalkColor('gray')));
  
  try {
    // Update primary task
    const updateResult = await repo.updateTask({
      id: primaryTask.id,
      tags: Array.from(allTags),
      metadata: mergedMetadata
    });

    if (updateResult.success && updateResult.data) {
      console.log(colorize(`  ✅ Primary task updated: ${updateResult.data.id}`, asChalkColor('green')));
    } else {
      console.log(colorize(`  ❌ Error updating primary task: ${updateResult.error?.message || 'Unknown error'}`, asChalkColor('red')));
    }
    
    // Ask what to do with secondary tasks
    console.log(colorize('\n● STEP 4: SECONDARY TASKS', asChalkColor('blue'), asChalkColor('bold')));
    console.log(colorize('  Choose what to do with the merged tasks:', asChalkColor('gray')));
    console.log(colorize('    d = Delete secondary tasks', asChalkColor('gray')));
    console.log(colorize('    m = Mark as duplicates (update status to "done" and add reference)', asChalkColor('gray')));
    
    const rl4 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const secondaryAction = await new Promise<string>(resolve => {
      rl4.question(colorize('  Action for secondary tasks [d/m]: ', asChalkColor('cyan')), resolve);
    });
    
    rl4.close();
    
    let tasksDeleted = 0;
    let tasksMarkedAsDuplicate = 0;
    
    if (secondaryAction.toLowerCase() === 'd') {
      // Delete secondary tasks
      console.log(colorize('  Deleting secondary tasks...', asChalkColor('gray')));
      
      for (const task of secondaryTasks) {
        await repo.removeTask(task.id);
        console.log(colorize(`  ✅ Deleted task ${task.id}`, asChalkColor('green')));
        tasksDeleted++;
      }
    } else {
      // Mark as duplicates
      console.log(colorize('  Marking secondary tasks as duplicates...', asChalkColor('gray')));
      
      for (const task of secondaryTasks) {
        const taskMetadata = task.metadata ? 
          (typeof task.metadata === 'string' ? JSON.parse(task.metadata) : task.metadata) : 
          {};
          
        await repo.updateTask({
          id: task.id,
          status: 'done',
          readiness: 'blocked',
          metadata: {
            ...taskMetadata,
            duplicateOf: primaryTask.id,
            duplicateMarkedAt: new Date().toISOString()
          }
        });
        
        console.log(colorize(`  ✅ Marked task ${task.id} as duplicate of ${primaryTask.id}`, asChalkColor('green')));
        tasksMarkedAsDuplicate++;
      }
    }
    
    // Summary
    console.log(colorize('\n✅ MERGE COMPLETED SUCCESSFULLY', asChalkColor('green'), asChalkColor('bold')));
    console.log(colorize(`  Primary task: ${primaryTask.id}`, asChalkColor('green')));
    console.log(`  Tasks processed: ${secondaryTasks.length + 1}`);
    
    if (tasksDeleted > 0) {
      console.log(`  Tasks deleted: ${tasksDeleted}`);
    }
    
    if (tasksMarkedAsDuplicate > 0) {
      console.log(`  Tasks marked as duplicates: ${tasksMarkedAsDuplicate}`);
    }
    
    return { 
      action: 'merged', 
      primaryTaskId: primaryTask.id,
      tasksDeleted,
      tasksMarkedAsDuplicate
    };
    
  } catch (error) {
    console.error('Error during merge:', error);
    console.log(colorize('\n✖ MERGE FAILED', asChalkColor('red'), asChalkColor('bold')));
    console.log(colorize('  See error details above.', asChalkColor('red')));
    return { action: 'cancelled' };
  }
}

/**
 * Show auto-merge suggestion with enhanced UI
 */
export async function suggestMerge(
  group: DuplicateGroup,
  repo: TaskRepository,
  colorize: ColorizeFunction,
  groupNumber: number,
  totalGroups: number
): Promise<MergeResult> {
  // Find the task to suggest as primary (newest task)
  const newestTask = group.tasks.reduce((newest, task) => {
    return new Date(task.updatedAt).getTime() > new Date(newest.updatedAt).getTime() ? task : newest;
  }, group.tasks[0]);
  
  const newestIndex = group.tasks.findIndex(t => t.id === newestTask.id);
  const similarity = Math.round(group.maxSimilarity * 100);
  
  // Header with group number and progress
  console.log(colorize(`\n● GROUP ${groupNumber}/${totalGroups} - ${similarity}% SIMILARITY`, asChalkColor('blue'), asChalkColor('bold')));
  
  // Display tasks
  for (let i = 0; i < group.tasks.length; i++) {
    const task = group.tasks[i];
    const isNewest = task.id === newestTask.id;
    
    console.log(
      (isNewest ? colorize('  ► ', asChalkColor('green'), asChalkColor('bold')) : '    ') + 
      colorize(`[${i + 1}] `, asChalkColor('blue')) + 
      colorize(task.id, asChalkColor('blue')) + ': ' + 
      task.title + 
      (isNewest ? colorize(' (newest)', asChalkColor('green')) : '')
    );
    
    console.log(
      '      ' + 
      `Status: ${colorizeStatus(task.status, colorize)}, ` +
      `Tags: ${task.tags.length > 0 ? task.tags.map(tag => colorize(tag, asChalkColor('cyan'))).join(', ') : colorize('none', asChalkColor('gray'))}`
    );
    
    console.log(
      '      ' + 
      `Updated: ${new Date(task.updatedAt).toLocaleString()}`
    );
  }
  
  // Calculate combined tags
  const allTags = new Set<string>();
  for (const task of group.tasks) {
    for (const tag of task.tags) {
      allTags.add(tag);
    }
  }
  
  // Show automatic suggestion
  console.log(colorize('\n  Suggestion:', asChalkColor('yellow'), asChalkColor('bold')));
  console.log(`    Merge all tasks into ${colorize(newestTask.id, asChalkColor('green'))}: ${newestTask.title}`);
  console.log(`    Combined tags: ${Array.from(allTags).map(tag => colorize(tag, asChalkColor('cyan'))).join(', ') || colorize('none', asChalkColor('gray'))}`);
  
  // Ask for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const confirm = await new Promise<string>(resolve => {
    rl.question(colorize('  Proceed with suggested merge? [y/n/s] (s=skip): ', asChalkColor('cyan')), resolve);
  });
  
  rl.close();
  
  if (confirm.toLowerCase() === 's') {
    console.log(colorize('  Group skipped', asChalkColor('yellow')));
    return { action: 'skipped' };
  }
  
  if (confirm.toLowerCase() !== 'y') {
    console.log(colorize('  Merge cancelled for this group', asChalkColor('yellow')));
    return { action: 'cancelled' };
  }
  
  // Execute merge
  try {
    console.log(colorize('  Processing merge...', asChalkColor('gray')));
    
    // Prepare metadata
    const secondaryTasks = group.tasks.filter(t => t.id !== newestTask.id);
    const primaryMetadata = typeof newestTask.metadata === 'string' ? 
      JSON.parse(newestTask.metadata) : newestTask.metadata || {};
    
    // Clone and clean
    const baseMetadata = { ...primaryMetadata };
    delete baseMetadata.similarityScore;
    
    const mergedMetadata = {
      ...baseMetadata,
      mergedFrom: secondaryTasks.map(t => t.id).join(','),
      mergedAt: new Date().toISOString(),
      mergedTaskTitles: secondaryTasks.map(t => t.title)
    };
    
    // Update primary task
    await repo.updateTask({
      id: newestTask.id,
      tags: Array.from(allTags),
      metadata: mergedMetadata
    });
    
    console.log(colorize(`  ✅ Primary task ${newestTask.id} updated`, asChalkColor('green')));
    
    // Ask what to do with secondary tasks
    const rl2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const secondaryAction = await new Promise<string>(resolve => {
      rl2.question(colorize('  What to do with secondary tasks? [d/m] (d=delete, m=mark as duplicates): ', asChalkColor('cyan')), resolve);
    });
    
    rl2.close();
    
    let tasksDeleted = 0;
    let tasksMarkedAsDuplicate = 0;
    
    if (secondaryAction.toLowerCase() === 'd') {
      // Delete secondary tasks
      for (const task of secondaryTasks) {
        await repo.removeTask(task.id);
        tasksDeleted++;
      }
      console.log(colorize(`  ✅ ${tasksDeleted} secondary tasks deleted`, asChalkColor('green')));
    } else {
      // Mark as duplicates
      for (const task of secondaryTasks) {
        const taskMetadata = task.metadata ? 
          (typeof task.metadata === 'string' ? JSON.parse(task.metadata) : task.metadata) : 
          {};
          
        await repo.updateTask({
          id: task.id,
          status: 'done',
          readiness: 'blocked',
          metadata: {
            ...taskMetadata,
            duplicateOf: newestTask.id,
            duplicateMarkedAt: new Date().toISOString()
          }
        });
        tasksMarkedAsDuplicate++;
      }
      console.log(colorize(`  ✅ ${tasksMarkedAsDuplicate} tasks marked as duplicates`, asChalkColor('green')));
    }
    
    console.log(colorize('  Merge completed successfully', asChalkColor('green')));
    
    return { 
      action: 'merged', 
      primaryTaskId: newestTask.id,
      tasksDeleted,
      tasksMarkedAsDuplicate
    };
  } catch (error) {
    console.error('Error during merge:', error);
    console.log(colorize('  ✖ Merge failed. See error details above.', asChalkColor('red')));
    return { action: 'cancelled' };
  }
}

/**
 * Helper to colorize task status
 */
function colorizeStatus(status: string, colorize: ColorizeFunction): string {
  switch (status) {
    case 'todo':
      return colorize(status, asChalkColor('yellow'));
    case 'in-progress':
      return colorize(status, asChalkColor('blue'));
    case 'done':
      return colorize(status, asChalkColor('green'));
    default:
      return status;
  }
}

/**
 * Helper to format tags for display
 */
function formatTags(tags: string[] | null, color: string): string {
  if (!tags || tags.length === 0) {
    return colorize('none', asChalkColor('gray'));
  }
  return tags.map(tag => colorize(tag, asChalkColor('cyan'))).join(', ');
}


/**
 * Helper to colorize task readiness
 */
function colorizeReadiness(readiness: string, colorize: ColorizeFunction): string {
  switch (readiness) {
    case 'draft':
      return colorize(readiness, asChalkColor('yellow'));
    case 'ready':
      return colorize(readiness, asChalkColor('green'));
    case 'blocked':
      return colorize(readiness, asChalkColor('red'));
    default:
      return readiness;
  }
}