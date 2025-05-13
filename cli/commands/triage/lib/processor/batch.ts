/**
 * Batch processing functionality
 * Handles processing multiple tasks in batch mode
 */

import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';
import { TaskRepository } from '../../../../../core/repo';
import { NlpService } from '../../../../../core/nlp-service-mock';
import { ProcessingOptions, TriageResults, TriageTask } from '../utils';
import { processPlanTask } from './task-processor';


/**
 * Process a plan with enhanced visual output
 * @param tasks Tasks to process
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
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
    console.log(colorize(`\n┌─ Processing Batch of ${tasks.length} Tasks`, asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')));
    console.log(colorize('│', asChalkColor((asChalkColor(('blue' as ChalkColor))))));
    
    if (dryRun) {
      console.log(colorize('│ DRY RUN MODE - No changes will be made', asChalkColor((asChalkColor(('yellow' as ChalkColor)))), asChalkColor('bold')));
      console.log(colorize('│', asChalkColor((asChalkColor(('blue' as ChalkColor))))));
    }
  }
  
  // Sort tasks to process updates before creates
  const updateTasks = tasks.filter(task => !!task.id);
  const createTasks = tasks.filter(task => !task.id);
  
  // Process in specific order: updates first, then creates
  let totalProcessed = 0;
  
  // First process updates
  if (updateTasks.length > 0 && !jsonOutput) {
    console.log(colorize(`├─ Processing ${updateTasks.length} Updates`, asChalkColor((asChalkColor(('yellow' as ChalkColor))))));
  }
  
  for (const task of updateTasks) {
    await processPlanTask(task, repo, nlpService, results, options);
    totalProcessed++;
    
    if (!jsonOutput && !options.autoMerge) {
      console.log(colorize(`│  Progress: ${totalProcessed}/${tasks.length} (${Math.round(totalProcessed/tasks.length*100)}%)`, asChalkColor((asChalkColor(('gray' as ChalkColor))))));
    }
  }
  
  // Then process creates
  if (createTasks.length > 0 && !jsonOutput) {
    console.log(colorize(`├─ Processing ${createTasks.length} New Tasks`, asChalkColor((asChalkColor(('green' as ChalkColor))))));
  }
  
  for (const task of createTasks) {
    await processPlanTask(task, repo, nlpService, results, options);
    totalProcessed++;
    
    if (!jsonOutput && !options.autoMerge) {
      console.log(colorize(`│  Progress: ${totalProcessed}/${tasks.length} (${Math.round(totalProcessed/tasks.length*100)}%)`, asChalkColor((asChalkColor(('gray' as ChalkColor))))));
    }
  }
  
  if (!jsonOutput) {
    console.log(colorize('│', asChalkColor((asChalkColor(('blue' as ChalkColor))))));
    console.log(colorize('└─ Batch Processing Complete', asChalkColor((asChalkColor(('blue' as ChalkColor)))), asChalkColor('bold')));
  }
}