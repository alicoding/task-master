/**
 * Enhanced interactive mode for triage command
 * Provides an improved UI for working with tasks
 */

import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { TaskRepository } from '../../../../../core/repo';
import { NlpService } from '../../../../../core/nlp-service-mock';
import { TaskGraph } from '../../../../../core/graph';
import { ProcessingOptions, TriageResults } from '../utils';
import { sortPendingTasks } from './utils/sorting';

// Import display components
import {
  displayInteractiveIntro,
  displayEnhancedTaskDetails,
  displaySimilarTasksEnhanced,
  displayDependencies,
  displayActionMenu,
  displayHelpScreen
} from './display/index';

// Import handlers
import {
  handleUpdateTaskAction,
  handleMarkAsDoneAction,
  handleUpdateTagsAction,
  handleMergeTaskAction,
  handleCreateSubtaskAction,
  handleToggleBlockedAction
} from './handlers/index';

// Import prompts
import { promptForAction } from './prompts/index';


/**
 * Run enhanced interactive triage mode
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Triage results to update
 * @param options Processing options
 */
export async function runInteractiveMode(
  repo: TaskRepository,
  nlpService: NlpService,
  results: TriageResults,
  options: ProcessingOptions
): Promise<void> {
  const { dryRun, similarityThreshold, autoMerge, colorize, jsonOutput } = options;
  const graph = new TaskGraph(repo);

  // Get all tasks
  const tasksResult = await repo.getAllTasks();
  // Check if result has data property and it's an array
  const allTasks = tasksResult?.success && Array.isArray(tasksResult?.data) ? tasksResult?.data : [];

  // Get pending tasks (open tasks that need triage)
  // Focus on tasks that are not done or are in draft state
  const pendingTasks = allTasks.filter(task =>
    task.status !== 'done' || task.readiness === 'draft'
  );
  
  if (pendingTasks.length === 0) {
    if (jsonOutput) {
      console.log(JSON.stringify({ message: 'No pending tasks to triage' }));
    } else {
      console.log(colorize('No pending tasks to triage.', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
    }
    return;
  }

  // Sort tasks by status, readiness, and then by ID
  const sortedTasks = sortPendingTasks(pendingTasks);
  
  if (!jsonOutput) {
    displayInteractiveIntro(sortedTasks.length, colorize);
  }
  
  // Process each task interactively
  let taskIndex = 0;
  let running = true;
  
  while (running && taskIndex < sortedTasks.length) {
    const task = sortedTasks[taskIndex];
    
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
          total: sortedTasks.length
        }
      }));
    } else {
      // Enhanced UI display
      await displayEnhancedTaskDetails(task, taskIndex, sortedTasks.length, allTasks, graph, colorize);
      
      // Find similar tasks
      const similarTasksResult = await repo.findSimilarTasks(task.title);
      const similarTasks = similarTasksResult?.success && Array.isArray(similarTasksResult?.data)
        ? similarTasksResult?.data
        : [];

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
          console.log(colorize('Exiting triage mode.', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
          running = false;
          break;
          
        case 'n': // Next task
          taskIndex++;
          break;
          
        case 'p': // Previous task
          taskIndex = Math.max(0, taskIndex - 1);
          break;
          
        case 's': // Skip
          console.log(colorize('Skipping this task.', asChalkColor((asChalkColor(('gray' as ChalkColor))))));
          results?.skipped.push({
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
            console.log(colorize('No similar tasks available for merging.', asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
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
          console.log(colorize('Invalid option. Press h for help.', asChalkColor((asChalkColor(('red' as ChalkColor))))));
          break;
      }
    }
  }
  
  if (!jsonOutput && running) {
    console.log(colorize('\n✅ All pending tasks have been triaged!', asChalkColor((asChalkColor(('green' as ChalkColor)))), asChalkColor('bold')));
  }
}