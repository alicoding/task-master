/**
 * Task processor functionality
 *
 * This file serves as a backward compatibility wrapper around the modularized
 * implementation of the task processor.
 */
import { TaskRepository } from '../../../../core/repo';
import { NlpService } from '../../../../core/nlp-service';
import { ProcessingOptions, TriageResults, TriageTask } from './utils';
import { handleTaskUpdate, handleNewTask, handleAutoMerge, createNewTask } from './processor/index';
/**
 * Process a task from a plan file
 * @param taskData Task data from plan
 * @param repo Task repository
 * @param nlpService NLP service
 * @param results Results to track
 * @param options Processing options
 */
export declare function processPlanTask(taskData: TriageTask, repo: TaskRepository, nlpService: NlpService, results: TriageResults, options: ProcessingOptions): Promise<void>;
export { handleTaskUpdate, handleNewTask, handleAutoMerge, createNewTask };
