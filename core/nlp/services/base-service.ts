/**
 * Base NLP service class
 */

import { 
  NlpServiceInterface, 
  ProcessedQuery, 
  TaskSearchInfo, 
  SimilarTask, 
  ExtractedSearchFilters 
} from '../types.ts';

/**
 * Abstract base class for NLP services
 * Defines the common interface for different NLP service implementations
 */
export abstract class BaseNlpService implements NlpServiceInterface {
  /**
   * Train the NLP models
   * This should be called before using the service for search and analysis
   */
  abstract train(): Promise<void>;
  
  /**
   * Process a search query to extract intents and entities
   * @param query User's search query
   * @returns Processed query with extracted information
   */
  abstract processQuery(query: string): Promise<ProcessedQuery>;
  
  /**
   * Calculate similarity score between two texts
   * @param text1 First text
   * @param text2 Second text
   * @returns Similarity score between 0 and 1
   */
  abstract getSimilarity(text1: string, text2: string): Promise<number>;
  
  /**
   * Find tasks similar to a given title or description
   * @param tasks Array of tasks to search
   * @param title Title to find similar tasks for
   * @param threshold Similarity threshold (0-1)
   * @param useFuzzy Whether to also use fuzzy matching
   * @returns Array of tasks with similarity scores
   */
  abstract findSimilarTasks(
    tasks: TaskSearchInfo[],
    title: string,
    threshold?: number,
    useFuzzy?: boolean
  ): Promise<SimilarTask[]>;
  
  /**
   * Extract search filters from a natural language query
   * @param query Search query in natural language
   * @returns Extracted search filters
   */
  abstract extractSearchFilters(query: string): Promise<ExtractedSearchFilters>;
}