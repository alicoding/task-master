/**
 * Core task processing functionality
 * Handles processing of individual task entries from a plan
 */

import { TaskRepository } from '@/core/repo';
import { NlpService } from '@/core/nlp-service-mock';
import { ProcessingOptions, TriageResults, TriageTask } from '@/cli/commands/triage/lib/utils';
import { handleTaskUpdate } from '@/cli/commands/triage/lib/processor/task-update';
import { handleNewTask } from '@/cli/commands/triage/lib/processor/similarity';
import { asChalkColor } from "@/cli/utils/chalk-utils";

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
    
    if (!jsonOutput) {
      // Show task being processed
      if (isUpdate) {
        console.log(colorize(`│  → Updating task ${taskData.id}: "${taskData.title || '[No title update]'}"`, asChalkColor('yellow')));
      } else {
        console.log(colorize(`│  → Creating task: "${taskData.title}"`, asChalkColor('green')));
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
          console.log(colorize(`│    ✘ ERROR: ${errorMsg}`, asChalkColor('red')));
        }
        return;
      }

      await handleNewTask(taskData, repo, nlpService, results, options);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.errors.push(`Error processing task: ${errorMessage}`);
    
    if (!jsonOutput) {
      console.log(colorize(`│    ✘ ERROR: ${errorMessage}`, asChalkColor('red')));
    }
  }
}