/**
 * Auto-merge functionality
 * Handles merging similar tasks automatically
 */

import { TaskRepository } from '../../../../../core/repo';
import { ChalkColor, ProcessingOptions, TriageResults, TriageTask } from '../utils';
import { createNewTask } from './task-creation';
import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";

/**
 * Task with similarity metadata
 */
export interface SimilarTask {
  id: string;
  title: string;
  status: string;
  readiness?: string;
  tags: string[];
  metadata?: {
    similarityScore?: number;
    [key: string]: any;
  };
}

/**
 * Handle automatic merging of similar tasks
 * @param taskData Task data
 * @param filteredTasks Similar tasks
 * @param repo Task repository
 * @param results Results to track
 * @param options Processing options
 */
export async function handleAutoMerge(
  taskData: TriageTask,
  filteredTasks: SimilarTask[],
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
      console.log(colorize(`│    🔄 Auto-merging with ${bestMatch.id} (${percentage}% similarity)`, asChalkColor((asChalkColor(('magenta' as ChalkColor))))));
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

      results?.merged.push({
        original: bestMatch,
        merged: mergeResult,
        source: taskData
      });

      if (!jsonOutput) {
        console.log(colorize(`│    ✓ Merged successfully with task ${bestMatch.id}`, asChalkColor((asChalkColor(('green' as ChalkColor))))));
        
        // Show what was merged
        if (combinedTags.length > bestMatch.tags.length) {
          const newTags = combinedTags.filter(t => !bestMatch.tags.includes(t));
          console.log(colorize(`│      Added tags: ${newTags.join(', ')}`, asChalkColor((asChalkColor(('cyan' as ChalkColor))))));
        }
      }
    } else {
      results?.merged.push({
        original: bestMatch,
        source: taskData,
        dry_run: true
      });

      if (!jsonOutput) {
        console.log(colorize(`│    ✓ Would auto-merge with task ${bestMatch.id}`, asChalkColor((asChalkColor(('magenta' as ChalkColor))))));
      }
    }
  } else {
    // Similarity not high enough for auto-merge, create new task
    if (!jsonOutput) {
      console.log(colorize(`│    ℹ Similarity below threshold for auto-merge (${percentage}% < 80%)`, asChalkColor((asChalkColor(('blue' as ChalkColor))))));
    }
    await createNewTask(taskData, repo, results, options);
  }
}