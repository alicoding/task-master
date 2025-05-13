/**
 * NLP Test Utilities
 *
 * This module provides test utilities for isolating NLP dependencies
 * and ensuring tests can run even when NLP libraries have issues.
 */

import {
  ProcessedQuery,
  ExtractedSearchFilters,
  TaskSearchInfo,
  SimilarTask,
  NlpServiceInterface,
  Intent
} from '@/core/nlp/types';
import { tokenize } from '@/core/nlp/utils/tokenization';
import { calculateJaccardSimilarity } from '@/core/nlp/utils/distance';
import { Tokenizer, Stemmer } from '@/core/nlp/processing/processor';

/**
 * Create mock processed query result
 * @param query Original query text
 * @returns Mocked processed query
 */
export function createMockProcessedQuery(query: string): ProcessedQuery {
  // Handle null/undefined inputs
  if (query == null) query = '';
  if (typeof query !== 'string') query = String(query);

  const normalized = query.toLowerCase().trim();
  const tokens = tokenize(normalized);

  // Create mock intents
  const intents: Intent[] = [];
  if (normalized.includes('add') || normalized.includes('create')) {
    intents.push({ name: 'search.action.add', score: 0.8 });
  }
  if (normalized.includes('fix') || normalized.includes('bug')) {
    intents.push({ name: 'search.action.fix', score: 0.8 });
  }
  if (normalized.includes('update') || normalized.includes('change')) {
    intents.push({ name: 'search.action.update', score: 0.8 });
  }
  
  // Determine intent
  const intent = intents.length > 0 ? intents[0].name : null;
  
  // Extract basic entities
  const entities: Record<string, any> = {};
  
  // Check for status references
  if (normalized.includes('todo')) {
    entities.status = ['todo'];
  } else if (normalized.includes('in progress') || normalized.includes('in-progress')) {
    entities.status = ['in-progress'];
  } else if (normalized.includes('done') || normalized.includes('completed')) {
    entities.status = ['done'];
  }
  
  // Check for readiness references
  if (normalized.includes('draft')) {
    entities.readiness = ['draft'];
  } else if (normalized.includes('ready')) {
    entities.readiness = ['ready'];
  } else if (normalized.includes('blocked')) {
    entities.readiness = ['blocked'];
  }
  
  // Check for priority references
  if (normalized.includes('high priority') || normalized.includes('urgent')) {
    entities.priority = ['high'];
  } else if (normalized.includes('medium priority') || normalized.includes('normal')) {
    entities.priority = ['medium'];
  } else if (normalized.includes('low priority')) {
    entities.priority = ['low'];
  }
  
  // Extract tags
  const tagMatches = normalized.match(/tag:(\w+)/g);
  const tags = tagMatches 
    ? tagMatches.map(tag => tag.substring(4)) 
    : [];
  
  return {
    original: query,
    normalized: normalized,
    normalizedQuery: normalized,
    tokens: tokens,
    stems: tokens,  // Use tokens as stems for simplicity
    intent: intent,
    intents: intents,
    entities: entities,
    tags: tags,
    status: entities.status?.[0] || null,
    readiness: entities.readiness?.[0] || null
  };
}

/**
 * Create mock extracted search filters
 * @param query Original query text
 * @returns Mocked extracted search filters
 */
export function createMockSearchFilters(query: string): ExtractedSearchFilters {
  // Handle null/undefined inputs
  if (query == null) query = '';
  if (typeof query !== 'string') query = String(query);

  const processedQuery = createMockProcessedQuery(query);
  const lowerQuery = query.toLowerCase();
  
  // Initialize result
  const result: ExtractedSearchFilters = {
    query: query,
    extractedTerms: []
  };
  
  // Extract status
  if (processedQuery.status) {
    result.status = processedQuery.status;
    result.extractedTerms?.push(`status:${processedQuery.status}`);
  }
  
  // Extract readiness
  if (processedQuery.readiness) {
    result.readiness = processedQuery.readiness;
    result.extractedTerms?.push(`readiness:${processedQuery.readiness}`);
  }
  
  // Extract tags
  if (processedQuery.tags && processedQuery.tags.length > 0) {
    result.tags = processedQuery.tags;
    for (const tag of processedQuery.tags) {
      result.extractedTerms?.push(`tag:${tag}`);
    }
  }
  
  // Extract priority
  if (processedQuery.entities.priority && processedQuery.entities.priority.length > 0) {
    result.priority = processedQuery.entities.priority[0];
    result.extractedTerms?.push(`priority:${result.priority}`);
  }
  
  // Extract action
  if (processedQuery.intent?.includes('search.action.')) {
    const action = processedQuery.intent.split('.').pop();
    if (action) {
      result.actionTypes = [action];
      result.extractedTerms?.push(`action:${action}`);
    }
  }
  
  return result;
}

/**
 * Calculate a simple similarity score between two texts
 * @param text1 First text
 * @param text2 Second text
 * @returns Similarity score between 0 and 1
 */
export function calculateMockSimilarity(text1: string, text2: string): number {
  const tokens1 = tokenize(text1.toLowerCase());
  const tokens2 = tokenize(text2.toLowerCase());
  
  return calculateJaccardSimilarity(tokens1, tokens2);
}

/**
 * Find similar tasks using simple word overlap
 * @param tasks List of tasks to search
 * @param query Search query
 * @param threshold Similarity threshold
 * @returns List of tasks with similarity scores
 */
export function findMockSimilarTasks(
  tasks: TaskSearchInfo[],
  query: string,
  threshold: number = 0.3
): SimilarTask[] {
  const results: SimilarTask[] = tasks.map(task => {
    // Calculate similarity between query and title
    const titleSimilarity = calculateMockSimilarity(query, task.title);
    
    // If description exists, calculate similarity with that too
    let descSimilarity = 0;
    if (task.description) {
      descSimilarity = calculateMockSimilarity(query, task.description);
    }
    
    // Use the higher similarity score
    const similarity = Math.max(titleSimilarity, descSimilarity);
    
    return {
      id: task.id,
      title: task.title,
      similarity
    };
  });
  
  // Filter by threshold and sort by similarity
  return results
    .filter(task => task.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Test-safe NLP service that doesn't depend on external libraries
 * This class implements the NlpServiceInterface but uses only internal utilities
 */
export class TestSafeNlpService implements NlpServiceInterface {
  /**
   * Initialize the test-safe NLP service
   */
  constructor() {
    console.log('Using test-safe NLP service implementation');
  }
  
  /**
   * Mock train method (no-op for testing)
   */
  async train(): Promise<void> {
    // No training needed for test implementation
  }
  
  /**
   * Process a query using mock implementations
   * @param query The query to process
   * @returns Processed query information
   */
  async processQuery(query: string): Promise<ProcessedQuery> {
    return createMockProcessedQuery(query);
  }
  
  /**
   * Calculate similarity between two texts
   * @param text1 First text
   * @param text2 Second text
   * @returns Similarity score between 0 and 1
   */
  async getSimilarity(text1: string, text2: string): Promise<number> {
    return calculateMockSimilarity(text1, text2);
  }
  
  /**
   * Find tasks similar to a query
   * @param tasks Array of tasks to search
   * @param title Search query
   * @param threshold Similarity threshold (0-1)
   * @param useFuzzy Whether to use fuzzy matching (ignored in test implementation)
   * @returns Array of similar tasks with scores
   */
  async findSimilarTasks(
    tasks: TaskSearchInfo[],
    title: string,
    threshold: number = 0.3,
    useFuzzy: boolean = true
  ): Promise<SimilarTask[]> {
    return findMockSimilarTasks(tasks, title, threshold);
  }
  
  /**
   * Extract search filters from a query
   * @param query Search query
   * @returns Extracted filters
   */
  async extractSearchFilters(query: string): Promise<ExtractedSearchFilters> {
    return createMockSearchFilters(query);
  }
}