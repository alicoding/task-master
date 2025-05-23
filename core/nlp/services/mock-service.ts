/**
 * Mock NLP Service for Task Master
 * This is a simplified version of NlpService that doesn't rely on external dependencies
 */

import { BaseNlpService } from './base-service';
import { 
  ProcessedQuery, 
  TaskSearchInfo, 
  SimilarTask, 
  ExtractedSearchFilters 
} from '../types';
import { tokenize, normalizeText } from '../utils/tokenization';
import { calculateJaccardSimilarity } from '../utils/distance';

/**
 * Mock NLP Service for Task Master
 * Provides simplified NLP capabilities for search and similarity matching
 */
export class MockNlpService extends BaseNlpService {
  /**
   * Create a new Mock NLP Service
   * @param modelPath Path to NLP model (not used in mock)
   */
  constructor(private modelPath: string = '') {
    super();
    // No initialization needed for mock
  }
  
  /**
   * Mock train method (no-op)
   */
  async train(): Promise<void> {
    // No training needed for mock
    console.log('Using mock NLP service - training skipped');
  }
  
  /**
   * Process a search query to extract intents and entities
   * @param query User's search query
   * @returns Processed query with extracted information
   */
  async processQuery(query: string): Promise<ProcessedQuery> {
    // Simple processing - just normalize and tokenize
    const normalized = normalizeText(query);
    const tokens = tokenize(query);
    
    return {
      original: query,
      normalized,
      tokens,
      stems: tokens, // No stemming in mock implementation
      intent: null,
      entities: {},
      tags: [],
      status: null,
      readiness: null
    };
  }
  
  /**
   * Calculate similarity score between two texts
   * @param text1 First text
   * @param text2 Second text
   * @returns Similarity score between 0 and 1
   */
  async getSimilarity(text1: string, text2: string): Promise<number> {
    // Simple similarity - check for word overlap using Jaccard similarity
    const tokens1 = tokenize(text1);
    const tokens2 = tokenize(text2);
    
    return calculateJaccardSimilarity(tokens1, tokens2);
  }
  
  /**
   * Find tasks similar to a given title or description
   * @param tasks Array of tasks to search
   * @param title Title to find similar tasks for
   * @param threshold Similarity threshold (0-1)
   * @param useFuzzy Whether to also use fuzzy matching (ignored in mock)
   * @returns Array of tasks with similarity scores
   */
  async findSimilarTasks(
    tasks: TaskSearchInfo[],
    title: string,
    threshold: number = 0.3,
    useFuzzy: boolean = true
  ): Promise<SimilarTask[]> {
    const results = await Promise.all(
      tasks.map(async task => {
        const similarity = await this.getSimilarity(title, task.title);
        
        return {
          id: task.id,
          title: task.title,
          similarity
        };
      })
    );
    
    return results
      .filter(task => task.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);
  }
  
  /**
   * Extract search filters from a natural language query
   * @param query Search query in natural language
   * @returns Extracted search filters
   */
  async extractSearchFilters(query: string): Promise<ExtractedSearchFilters> {
    // Handle null/undefined inputs
    if (query == null) query = '';
    if (typeof query !== 'string') query = String(query);

    // Simple extraction - look for key terms
    const lowerQuery = query.toLowerCase();
    const result: ExtractedSearchFilters = {};
    
    // Extract status
    if (lowerQuery.includes('todo')) {
      result.status = 'todo';
    } else if (lowerQuery.includes('in progress') || lowerQuery.includes('in-progress')) {
      result.status = 'in-progress';
    } else if (lowerQuery.includes('done') || lowerQuery.includes('completed')) {
      result.status = 'done';
    }
    
    // Extract readiness
    if (lowerQuery.includes('draft')) {
      result.readiness = 'draft';
    } else if (lowerQuery.includes('ready')) {
      result.readiness = 'ready';
    } else if (lowerQuery.includes('blocked')) {
      result.readiness = 'blocked';
    }
    
    // Extract tags
    const tagMatches = lowerQuery.match(/tag:(\w+)/g);
    if (tagMatches) {
      result.tags = tagMatches.map(tag => tag.substring(4));
    }
    
    return result;
  }
}