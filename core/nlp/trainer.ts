/**
 * Trainer module for NLP service
 * Handles training the NLP model with task-specific examples
 */
import { NlpManager } from 'node-nlp-typescript';
import fs from 'fs/promises';

/**
 * Default model file path
 */
export const DEFAULT_MODEL_PATH = './nlp-model.json';

/**
 * Try to load a pre-existing model
 * @param nlpManager NLP manager instance
 * @param modelPath Path to model file
 * @returns Whether the model was successfully loaded
 */
export async function tryLoadModel(
  nlpManager: NlpManager,
  modelPath: string = DEFAULT_MODEL_PATH
): Promise<boolean> {
  try {
    await nlpManager.load(modelPath);
    console.log('Loaded existing NLP model');
    return true;
  } catch (error) {
    console.log('No existing model found, will train a new one');
    return false;
  }
}

/**
 * Add example documents to train the NLP model
 * @param nlpManager NLP manager instance
 */
export function addTrainingExamples(nlpManager: NlpManager): void {
  // Status-related examples
  nlpManager.addDocument('en', 'show me all todo tasks', 'search.status.todo');
  nlpManager.addDocument('en', 'find tasks that are not started yet', 'search.status.todo');
  nlpManager.addDocument('en', 'tasks in my backlog', 'search.status.todo');
  
  nlpManager.addDocument('en', 'what am I currently working on', 'search.status.in-progress');
  nlpManager.addDocument('en', 'show active tasks', 'search.status.in-progress');
  nlpManager.addDocument('en', 'tasks that are in progress', 'search.status.in-progress');
  
  nlpManager.addDocument('en', 'completed tasks', 'search.status.done');
  nlpManager.addDocument('en', 'things I have finished', 'search.status.done');
  nlpManager.addDocument('en', 'resolved issues', 'search.status.done');
  
  // Readiness-related examples
  nlpManager.addDocument('en', 'show me draft tasks', 'search.readiness.draft');
  nlpManager.addDocument('en', 'ideas in planning', 'search.readiness.draft');
  
  nlpManager.addDocument('en', 'tasks ready to start', 'search.readiness.ready');
  nlpManager.addDocument('en', 'what can I work on next', 'search.readiness.ready');
  
  nlpManager.addDocument('en', 'blocked tasks', 'search.readiness.blocked');
  nlpManager.addDocument('en', 'tasks waiting for something', 'search.readiness.blocked');
  
  // Priority-related examples
  nlpManager.addDocument('en', 'high priority tasks', 'search.priority.high');
  nlpManager.addDocument('en', 'urgent items', 'search.priority.high');
  nlpManager.addDocument('en', 'critical issues', 'search.priority.high');
  
  nlpManager.addDocument('en', 'normal priority tasks', 'search.priority.medium');
  nlpManager.addDocument('en', 'medium priority items', 'search.priority.medium');
  
  nlpManager.addDocument('en', 'low priority tasks', 'search.priority.low');
  nlpManager.addDocument('en', 'minor items', 'search.priority.low');
  
  // Action-related examples
  nlpManager.addDocument('en', 'tasks about fixing bugs', 'search.action.fix');
  nlpManager.addDocument('en', 'issues that need repair', 'search.action.fix');
  
  nlpManager.addDocument('en', 'tasks about adding features', 'search.action.add');
  nlpManager.addDocument('en', 'new feature implementations', 'search.action.add');
  
  nlpManager.addDocument('en', 'update related tasks', 'search.action.update');
  nlpManager.addDocument('en', 'changes to existing features', 'search.action.update');
}

/**
 * Train the NLP model and save it
 * @param nlpManager NLP manager instance
 * @param modelPath Path to save the model
 */
export async function trainAndSaveModel(
  nlpManager: NlpManager,
  modelPath: string = DEFAULT_MODEL_PATH
): Promise<void> {
  // Train the model
  await nlpManager.train();
  
  // Save the model for future use
  await nlpManager.save(modelPath);
}