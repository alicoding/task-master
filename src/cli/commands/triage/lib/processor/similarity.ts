/**
 * Similarity checking functionality
 * Handles checking for similar tasks when creating new tasks
 */

import { TaskRepository } from '@/core/repo';
import { NlpService } from '@/core/nlp-service-mock';
import { ChalkColor, ProcessingOptions, TriageResults, TriageTask } from '@/cli/commands/triage/lib/utils';
import { createNewTask } from '@/cli/commands/triage/lib/processor/task-creation';
import { handleAutoMerge } from '@/cli/commands/triage/lib/processor/auto-merge';
import { asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Handle creating a new task with duplicate detection
 * @param taskData Task data
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
 */
export async function handleNewTask(
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
      console.log(colorize(`│    ⚠ Found ${filteredTasks.length} similar tasks`, asChalkColor('yellow')));
      
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
        console.log(colorize(`│      + ${filteredTasks.length - 3} more similar tasks...`, asChalkColor('gray')));
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
        console.log(colorize(`│    ⚠ Skipped due to similar existing tasks - use force: true to override`, asChalkColor('yellow')));
      }
      return;
    } else if (!jsonOutput) {
      console.log(colorize(`│    ⚠ Force flag enabled - creating despite similar tasks`, asChalkColor('yellow')));
    }
  }

  await createNewTask(taskData, repo, results, options);
}