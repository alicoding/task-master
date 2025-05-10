/**
 * NLP Service for Task Master
 * This service provides enhanced natural language processing capabilities
 * using the node-nlp-typescript library for improved search and matching
 */

import { NlpManager } from 'node-nlp-typescript';
import { 
  TaskSearchInfo, 
  SimilarTask, 
  ProcessedQuery, 
  ExtractedSearchFilters 
} from './nlp/types.js';
import { addTaskEntities } from './nlp/entities.js';
import { 
  tryLoadModel, 
  addTrainingExamples, 
  trainAndSaveModel,
  DEFAULT_MODEL_PATH 
} from './nlp/trainer.js';
import { 
  processQuery, 
  calculateSimilarity, 
  extractSearchFilters 
} from './nlp/processor.js';
import { fuzzySearch, combineSearchResults } from './nlp/fuzzy-matcher.js';

/**
 * NLP Service for Task Master
 * Provides advanced NLP capabilities for search, similarity matching, and more
 */
export class NlpService {
  private nlpManager: NlpManager;
  private tokenizer: any;
  private stemmer: any;
  private modelPath: string;
  
  /**
   * Create a new NLP Service
   * @param modelPath Path to NLP model (defaults to ./nlp-model.json)
   */
  constructor(modelPath: string = DEFAULT_MODEL_PATH) {
    // Create NLP manager for English only
    this.nlpManager = new NlpManager({
      languages: ['en'],
      forceNER: true
    });
    
    this.modelPath = modelPath;
    
    // Add task-related entities
    addTaskEntities(this.nlpManager);
    
    // Initialize tokenizer and stemmer using NlpUtil
    this.tokenizer = this.nlpManager.container.get('tokenizer-en');
    this.stemmer = this.nlpManager.container.get('stemmer-en');
  }
  
  /**
   * Train the NLP manager with example task descriptions
   * This should be called before using the service for search and analysis
   */
  async train(): Promise<void> {
    if (!(await tryLoadModel(this.nlpManager, this.modelPath))) {
      // Add example documents to train the NLP manager
      addTrainingExamples(this.nlpManager);
      
      // Train and save the model
      await trainAndSaveModel(this.nlpManager, this.modelPath);
    }
  }
  
  /**
   * Process a search query to extract intents and entities
   * @param query User's search query
   * @returns Processed query with extracted information
   */
  async processQuery(query: string): Promise<ProcessedQuery> {
    return processQuery(query, this.nlpManager, this.tokenizer, this.stemmer);
  }
  
  /**
   * Calculate similarity score between two texts
   * @param text1 First text
   * @param text2 Second text
   * @returns Similarity score between 0 and 1
   */
  async getSimilarity(text1: string, text2: string): Promise<number> {
    return calculateSimilarity(
      text1, 
      text2, 
      this.tokenizer, 
      this.stemmer, 
      this.nlpManager
    );
  }
  
  /**
   * Find tasks similar to a given title or description
   * @param tasks Array of tasks to search
   * @param title Title to find similar tasks for
   * @param threshold Similarity threshold (0-1)
   * @param useFuzzy Whether to also use fuzzy matching
   * @returns Array of tasks with similarity scores
   */
  async findSimilarTasks(
    tasks: TaskSearchInfo[],
    title: string,
    threshold: number = 0.3,
    useFuzzy: boolean = true
  ): Promise<SimilarTask[]> {
    // Calculate NLP similarity scores for each task
    const nlpResults = await Promise.all(
      tasks.map(async task => {
        // Calculate similarity between titles
        const titleSimilarity = await this.getSimilarity(title, task.title);
        
        // If description exists, calculate similarity with that too
        let descriptionSimilarity = 0;
        if (task.description) {
          descriptionSimilarity = await this.getSimilarity(title, task.description);
        }
        
        // Use the higher of the two similarities
        const similarity = Math.max(titleSimilarity, descriptionSimilarity);
        
        return {
          id: task.id,
          title: task.title,
          similarity
        };
      })
    );
    
    // Filter by threshold and sort by descending similarity
    const filteredNlpResults = nlpResults
      .filter(task => task.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
    
    // If not using fuzzy matching, return NLP results only
    if (!useFuzzy) {
      return filteredNlpResults;
    }
    
    // Perform fuzzy search
    const fuzzyResults = fuzzySearch(tasks, title, {
      threshold: Math.min(threshold + 0.2, 0.8) // Higher threshold for fuzzy
    });
    
    // Combine results
    return combineSearchResults(filteredNlpResults, fuzzyResults, 0.7);
  }
  
  /**
   * Extract search filters from a natural language query
   * @param query Search query in natural language
   * @returns Extracted search filters
   */
  async extractSearchFilters(query: string): Promise<ExtractedSearchFilters> {
    return extractSearchFilters(query, this.nlpManager, this.tokenizer, this.stemmer);
  }
}