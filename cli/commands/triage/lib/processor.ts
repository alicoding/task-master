import { TaskRepository } from '../../../../core/repo.js';
import { NlpService } from '../../../../core/nlp-service.js';
import { ProcessingOptions, TriageResults, TriageTask } from './utils.js';

/**
 * Process a task from a plan file
 * @param taskData Task data from plan
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
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

    if (isUpdate) {
      await handleTaskUpdate(taskData, repo, results, options);
    } else {
      // For new tasks, we need a title
      if (!taskData.title) {
        results.errors.push(`Task is missing required title field`);
        return;
      }

      await handleNewTask(taskData, repo, nlpService, results, options);
    }
  } catch (error: unknown) {
    console.error('Error processing task:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.errors.push(`Error processing task: ${errorMessage}`);
  }
}

/**
 * Handle updating an existing task
 * @param taskData Task data
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
async function handleTaskUpdate(
  taskData: TriageTask,
  repo: TaskRepository,
  results: TriageResults,
  options: ProcessingOptions
) {
  const { dryRun, colorize, jsonOutput } = options;

  if (!taskData.id) {
    results.errors.push('Cannot update task: missing id');
    return;
  }

  // Check if the task exists
  const existingTask = await repo.getTask(taskData.id);
  if (!existingTask) {
    results.errors.push(`Task with ID ${taskData.id} not found. Cannot update.`);
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
      console.log(colorize(`✓ Updated task ${updatedTask.id}: ${updatedTask.title}`, 'yellow'));
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
      console.log(colorize(`✓ Would update task ${simTask.id}: ${taskData.title || existingTask.title}`, 'yellow'));
    }
  }
}

/**
 * Handle creating a new task with duplicate detection
 * @param taskData Task data
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
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
      console.log(colorize(`\nFound similar tasks for "${taskData.title}":`, 'yellow'));
      filteredTasks.forEach((t, i) => {
        const score = t.metadata?.similarityScore || 0;
        const percentage = Math.round(score * 100);
        let scoreColor: ChalkColor = 'green';
        if (percentage >= 80) scoreColor = 'red';
        else if (percentage >= 60) scoreColor = 'yellow';

        console.log(`  ${colorize(`[${i + 1}]`, 'blue')} ${t.id}: ${t.title}`);
        console.log(`     ${colorize(`Similarity: ${percentage}%`, scoreColor)}`);
      });
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
        console.log(colorize(`✗ Skipped due to similar existing tasks (use force:true to override)`, 'gray'));
      }
      return;
    }
  }

  await createNewTask(taskData, repo, results, options);
}

/**
 * Handle automatic merging of similar tasks
 * @param taskData Task data
 * @param filteredTasks Similar tasks
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
async function handleAutoMerge(
  taskData: TriageTask,
  filteredTasks: any[],
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

  // For very high similarity, do the merge
  if (score >= 0.8) {
    if (!dryRun) {
      // Combine tags (unique)
      const combinedTags = [...new Set([
        ...(bestMatch.tags || []),
        ...(taskData.tags || [])
      ])];

      // Merge metadata
      const mergedMetadata = {
        ...(taskData.metadata || {}),
        ...(bestMatch.metadata || {}),
        mergedFrom: taskData.title,
        mergedAt: new Date().toISOString()
      };

      // Delete similarity score if present
      delete mergedMetadata.similarityScore;

      // Update the task
      const mergeResult = await repo.updateTask({
        id: bestMatch.id,
        tags: combinedTags,
        metadata: mergedMetadata,
        status: taskData.status || bestMatch.status,
        readiness: taskData.readiness || bestMatch.readiness
      });

      results.merged.push({
        original: bestMatch,
        merged: mergeResult,
        source: taskData
      });

      if (!jsonOutput) {
        console.log(colorize(`✓ Auto-merged with existing task ${bestMatch.id}`, 'magenta'));
      }
    } else {
      results.merged.push({
        original: bestMatch,
        source: taskData,
        dry_run: true
      });

      if (!jsonOutput) {
        console.log(colorize(`✓ Would auto-merge with existing task ${bestMatch.id}`, 'magenta'));
      }
    }
  } else {
    // Similarity not high enough for auto-merge, create new task
    await createNewTask(taskData, repo, results, options);
  }
}

/**
 * Create a new task
 * @param taskData Task data
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
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
      console.log(colorize(`✓ Added new task ${newTask.id}: ${newTask.title}`, 'green'));
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
      console.log(colorize(`✓ Would add new task: ${taskData.title}`, 'green'));
    }
  }
}

// Import ChalkColor type
import { ChalkColor } from './utils.js';