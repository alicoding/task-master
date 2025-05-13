/**
 * Toggle blocked status handler
 */

import readline from 'readline';
import { TaskRepository } from '@/core/repo';
import { TaskReadiness } from '@/core/types';
import { ProcessingOptions, TriageResults, TriageTask, colorizeReadiness } from '@/cli/commands/triage/lib/utils';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Handle toggling blocked status for a task
 * @param task Task to toggle blocked status
 * @param repo Task repository
 * @param results Triage results to update
 * @param options Processing options
 */
export async function handleToggleBlockedAction(
  task: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void> {
  const { dryRun, colorize } = options;
  
  if (dryRun) {
    console.log(colorize('Would toggle blocked status (dry run).', asChalkColor('yellow')));
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
  
  console.log(colorize(`\nToggling task from ${colorizeReadiness(task.readiness as string, colorize)} to ${colorizeReadiness(newReadiness, colorize)}...`, asChalkColor('magenta')));
  
  // For tasks being blocked, optionally add a reason
  let metadata = undefined;
  
  if (newReadiness === 'blocked') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const blockedReason = await new Promise<string>(resolve => {
      rl.question(colorize('Enter reason for blocking (optional): ', asChalkColor('magenta')), resolve);
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
    console.log(colorize('✓ Task marked as blocked', asChalkColor('red'), asChalkColor('bold')));
  } else {
    console.log(colorize('✓ Task unblocked', asChalkColor('green'), asChalkColor('bold')));
  }
}