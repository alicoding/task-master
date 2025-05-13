/**
 * Trainer module for NLP service
 * Handles training the NLP model with task-specific examples
 */
import { NlpManager } from '../types';
/**
 * Default model file path
 */
export declare const DEFAULT_MODEL_PATH = "./nlp-model.json";
/**
 * Try to load a pre-existing model
 * @param nlpManager NLP manager instance
 * @param modelPath Path to model file
 * @returns Whether the model was successfully loaded
 */
export declare function tryLoadModel(nlpManager: NlpManager, modelPath?: string): Promise<boolean>;
/**
 * Add example documents to train the NLP model
 * @param nlpManager NLP manager instance
 */
export declare function addTrainingExamples(nlpManager: NlpManager): void;
/**
 * Train the NLP model and save it
 * @param nlpManager NLP manager instance
 * @param modelPath Path to save the model
 */
export declare function trainAndSaveModel(nlpManager: NlpManager, modelPath?: string): Promise<void>;
