/**
 * Enhanced processor for batch triage mode
 */

import { TaskRepository } from '../../../../core/repo.js';
import { NlpService } from '../../../../core/nlp-service-mock.js';
import { ProcessingOptions, TriageResults, TriageTask, ChalkColor } from './utils.js';

/**
 * Process a plan with enhanced visual output
 */
export async function processPlanWithEnhancedUI(
  tasks: TriageTask[],
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize, jsonOutput } = options;
  
  if (!jsonOutput) {
    console.log(colorize(`\n┌─ Processing Batch of ${tasks.length} Tasks`, 'blue', 'bold'));
    console.log(colorize('│', 'blue'));
    
    if (dryRun) {
      console.log(colorize('│ DRY RUN MODE - No changes will be made', 'yellow', 'bold'));
      console.log(colorize('│', 'blue'));
    }
  }
  
  // Sort tasks to process updates before creates
  const updateTasks = tasks.filter(task => !!task.id);
  const createTasks = tasks.filter(task => !task.id);
  
  // Process in specific order: updates first, then creates
  let totalProcessed = 0;
  
  // First process updates
  if (updateTasks.length > 0 && !jsonOutput) {
    console.log(colorize(`├─ Processing ${updateTasks.length} Updates`, 'yellow'));
  }
  
  for (const task of updateTasks) {
    await processPlanTask(task, repo, nlpService, results, options);
    totalProcessed++;
    
    if (!jsonOutput && !options.autoMerge) {
      console.log(colorize(`│  Progress: ${totalProcessed}/${tasks.length} (${Math.round(totalProcessed/tasks.length*100)}%)`, 'gray'));
    }
  }
  
  // Then process creates
  if (createTasks.length > 0 && !jsonOutput) {
    console.log(colorize(`├─ Processing ${createTasks.length} New Tasks`, 'green'));
  }
  
  for (const task of createTasks) {
    await processPlanTask(task, repo, nlpService, results, options);
    totalProcessed++;
    
    if (!jsonOutput && !options.autoMerge) {
      console.log(colorize(`│  Progress: ${totalProcessed}/${tasks.length} (${Math.round(totalProcessed/tasks.length*100)}%)`, 'gray'));
    }
  }
  
  if (!jsonOutput) {
    console.log(colorize('│', 'blue'));
    console.log(colorize('└─ Batch Processing Complete', 'blue', 'bold'));
  }
}

/**
 * Process a task from a plan file with enhanced UI
 */
export async function processPlanTask(
  taskData: TriageTask,
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, similarityThreshold, autoMerge, colorize, jsonOutput } = options;

  try {
    // Check if this is an update (has ID) or a new task
    const isUpdate = !!taskData.id;
    
    if (!jsonOutput) {
      // Show task being processed
      if (isUpdate) {
        console.log(colorize(`│  → Updating task ${taskData.id}: "${taskData.title || '[No title update]'}"`, 'yellow'));
      } else {
        console.log(colorize(`│  → Creating task: "${taskData.title}"`, 'green'));
      }
    }

    if (isUpdate) {
      await handleTaskUpdate(taskData, repo, results, options);
    } else {
      // For new tasks, we need a title
      if (!taskData.title) {
        const errorMsg = 'Task is missing required title field';
        results.errors.push(errorMsg);
        
        if (!jsonOutput) {
          console.log(colorize(`│    ✘ ERROR: ${errorMsg}`, 'red'));
        }
        return;
      }

      await handleNewTask(taskData, repo, nlpService, results, options);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.errors.push(`Error processing task: ${errorMessage}`);
    
    if (!jsonOutput) {
      console.log(colorize(`│    ✘ ERROR: ${errorMessage}`, 'red'));
    }
  }
}

/**
 * Handle updating an existing task
 */
async function handleTaskUpdate(
  taskData: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize, jsonOutput } = options;

  if (!taskData.id) {
    const errorMsg = 'Cannot update task: missing id';
    results.errors.push(errorMsg);
    
    if (!jsonOutput) {
      console.log(colorize(`│    ✘ ERROR: ${errorMsg}`, 'red'));
    }
    return;
  }

  // Check if the task exists
  const existingTask = await repo.getTask(taskData.id);
  if (!existingTask) {
    const errorMsg = `Task with ID ${taskData.id} not found. Cannot update.`;
    results.errors.push(errorMsg);
    
    if (!jsonOutput) {
      console.log(colorize(`│    ✘ ERROR: ${errorMsg}`, 'red'));
    }
    return;
  }

  // Don't actually update in dry run mode
  if (!dryRun) {
    const updatedTask = await repo.updateTask({
      id: taskData.id,
      title: taskData.title,
      status: taskData.status,
      readiness: taskData.readiness,
      tags: taskData.tags,
      metadata: taskData.metadata
    });

    results.updated.push(updatedTask);

    if (!jsonOutput) {
      // Show changes
      const changes = [];
      if (taskData.title && taskData.title !== existingTask.title) changes.push(`title: "${taskData.title}"`);
      if (taskData.status && taskData.status !== existingTask.status) changes.push(`status: ${taskData.status}`);
      if (taskData.readiness && taskData.readiness !== existingTask.readiness) changes.push(`readiness: ${taskData.readiness}`);
      if (taskData.tags) changes.push(`tags: [${taskData.tags.join(', ')}]`);
      
      console.log(colorize(`│    ✓ Updated task ${updatedTask.id}`, 'yellow'));
      
      if (changes.length > 0) {
        console.log(colorize(`│      Changed: ${changes.join(', ')}`, 'gray'));
      }
    }
  } else {
    const simTask = {
      id: taskData.id,
      title: taskData.title || '[unchanged]',
      status: taskData.status || '[unchanged]',
      readiness: taskData.readiness || '[unchanged]',
      tags: taskData.tags || '[unchanged]',
      dry_run: true
    };

    results.updated.push(simTask);

    if (!jsonOutput) {
      console.log(colorize(`│    ✓ Would update task ${simTask.id}`, 'yellow'));
    }
  }
}

/**
 * Handle creating a new task with duplicate detection
 */
async function handleNewTask(
  taskData: TriageTask,
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, similarityThreshold, autoMerge, colorize, jsonOutput } = options;

  // Handle potential duplication
  const similarTasks = await repo.findSimilarTasks(taskData.title);

  // Filter by threshold
  const filteredTasks = similarTasks.filter(task => {
    const score = task.metadata?.similarityScore || 0;
    return score >= similarityThreshold;
  });

  if (filteredTasks.length > 0) {
    if (!jsonOutput) {
      console.log(colorize(`│    ⚠ Found ${filteredTasks.length} similar tasks`, 'yellow'));
      
      // Show top matches
      const topTasks = filteredTasks.slice(0, 3); // Show max 3
      topTasks.forEach((t, i) => {
        const score = t.metadata?.similarityScore || 0;
        const percentage = Math.round(score * 100);
        
        let scoreColor: ChalkColor = 'green';
        if (percentage >= 80) scoreColor = 'red';
        else if (percentage >= 60) scoreColor = 'yellow';
        
        console.log(colorize(`│      ${i + 1}. ${t.id}: "${t.title}" (${percentage}% similar)`, scoreColor));
      });
      
      if (filteredTasks.length > 3) {
        console.log(colorize(`│      + ${filteredTasks.length - 3} more similar tasks...`, 'gray'));
      }
    }

    // Check for auto-merge
    if (autoMerge) {
      await handleAutoMerge(taskData, filteredTasks, repo, results, options);
      return;
    }

    // If not forced and not auto-merged, add to skipped
    if (!taskData.force) {
      results.skipped.push({
        title: taskData.title,
        reason: 'Similar task exists',
        similar_tasks: filteredTasks.map(t => ({
          id: t.id,
          title: t.title,
          similarity: t.metadata?.similarityScore
        }))
      });

      if (!jsonOutput) {
        console.log(colorize(`│    ⚠ Skipped due to similar existing tasks - use force: true to override`, 'yellow'));
      }
      return;
    } else if (!jsonOutput) {
      console.log(colorize(`│    ⚠ Force flag enabled - creating despite similar tasks`, 'yellow'));
    }
  }

  await createNewTask(taskData, repo, results, options);
}

/**
 * Handle auto-merge functionality with better UI
 */
async function handleAutoMerge(
  taskData: TriageTask,
  filteredTasks: {
    id: string;
    title: string;
    status: string;
    readiness?: string;
    tags: string[];
    metadata?: {
      similarityScore?: number;
      [key: string]: any;
    };
  }[],
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize, jsonOutput } = options;

  // Find highest similarity task
  const bestMatch = filteredTasks.reduce((best, current) => {
    const bestScore = best.metadata?.similarityScore || 0;
    const currentScore = current.metadata?.similarityScore || 0;
    return currentScore > bestScore ? current : best;
  }, filteredTasks[0]);

  const score = bestMatch.metadata?.similarityScore || 0;
  const percentage = Math.round(score * 100);

  // For very high similarity, do the merge
  if (score >= 0.8) {
    if (!jsonOutput) {
      console.log(colorize(`│    🔄 Auto-merging with ${bestMatch.id} (${percentage}% similarity)`, 'magenta'));
    }
    
    if (!dryRun) {
      // Combine tags (unique)
      const combinedTagsSet = new Set([...(bestMatch.tags || []), ...(taskData.tags || [])]);
      const combinedTags = Array.from(combinedTagsSet);

      // Merge metadata
      const mergedMetadata = {
        ...(taskData.metadata || {}),
        ...(bestMatch.metadata || {}),
        mergedFrom: taskData.title,
        mergedAt: new Date().toISOString()
      };

      // Delete similarity score if present
      if (mergedMetadata && 'similarityScore' in mergedMetadata) {
        delete (mergedMetadata as any).similarityScore;
      }

      // Update the task
      const mergeResult = await repo.updateTask({
        id: bestMatch.id,
        tags: combinedTags,
        metadata: mergedMetadata,
        status: (taskData.status || bestMatch.status) as any,
        readiness: (taskData.readiness || bestMatch.readiness) as any
      });

      results.merged.push({
        original: bestMatch,
        merged: mergeResult,
        source: taskData
      });

      if (!jsonOutput) {
        console.log(colorize(`│    ✓ Merged successfully with task ${bestMatch.id}`, 'green'));
        
        // Show what was merged
        if (combinedTags.length > bestMatch.tags.length) {
          const newTags = combinedTags.filter(t => !bestMatch.tags.includes(t));
          console.log(colorize(`│      Added tags: ${newTags.join(', ')}`, 'cyan'));
        }
      }
    } else {
      results.merged.push({
        original: bestMatch,
        source: taskData,
        dry_run: true
      });

      if (!jsonOutput) {
        console.log(colorize(`│    ✓ Would auto-merge with task ${bestMatch.id}`, 'magenta'));
      }
    }
  } else {
    // Similarity not high enough for auto-merge, create new task
    if (!jsonOutput) {
      console.log(colorize(`│    ℹ Similarity below threshold for auto-merge (${percentage}% < 80%)`, 'blue'));
    }
    await createNewTask(taskData, repo, results, options);
  }
}

/**
 * Create a new task with enhanced UI
 */
async function createNewTask(
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

    results.added.push(newTask);

    if (!jsonOutput) {
      console.log(colorize(`│    ✓ Created new task ${newTask.id}`, 'green'));
      
      // Show hierarchy info if applicable
      if (newTask.parentId) {
        console.log(colorize(`│      Child of task: ${newTask.parentId}`, 'blue'));
      }
      
      // Show key properties
      const properties = [];
      if (taskData.status) properties.push(`status: ${taskData.status}`);
      if (taskData.readiness) properties.push(`readiness: ${taskData.readiness}`);
      if (taskData.tags && taskData.tags.length > 0) properties.push(`tags: [${taskData.tags.join(', ')}]`);
      
      if (properties.length > 0) {
        console.log(colorize(`│      Properties: ${properties.join(', ')}`, 'gray'));
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

    results.added.push(simTask);

    if (!jsonOutput) {
      console.log(colorize(`│    ✓ Would create new task: "${taskData.title}"`, 'green'));
    }
  }
}