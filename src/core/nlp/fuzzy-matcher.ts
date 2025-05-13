/**
 * Fuzzy matching module for NLP service
 * Provides enhanced fuzzy searching capabilities using Fuse.js
 */
import Fuse from 'fuse';
import { TaskSearchInfo, SimilarTask, FuzzySearchOptions } from '@/core/nlp/types';

/**
 * Default options for fuzzy search
 */
const DEFAULT_FUZZY_OPTIONS: FuzzySearchOptions = {
  threshold: 0.4,
  keys: ['title', 'description'],
  includeScore: true,
  shouldSort: true,
  ignoreLocation: true,
  findAllMatches: true
};

/**
 * Perform fuzzy search on tasks
 * @param tasks Array of tasks to search
 * @param query Search query
 * @param options Fuzzy search options
 * @returns Array of matching tasks with scores
 */
export function fuzzySearch(
  tasks: TaskSearchInfo[],
  query: string,
  options: FuzzySearchOptions = {}
): SimilarTask[] {
  // If no tasks or empty query, return empty array
  if (!tasks.length || !query.trim()) {
    return [];
  }

  // Merge default options with provided options
  const searchOptions: FuzzySearchOptions = {
    ...DEFAULT_FUZZY_OPTIONS,
    ...options
  };

  // Create Fuse instance
  const fuse = new Fuse(tasks, searchOptions);

  // Perform search
  const results = fuse.search(query);

  // Map results to SimilarTask format
  return results.map(result => ({
    id: result.item.id,
    title: result.item.title,
    // Convert score to similarity (Fuse.js scores are 0-1 where 0 is perfect match)
    similarity: result.score ? 1 - result.score : 1
  }));
}

/**
 * Combine NLP similarity with fuzzy search results
 * @param nlpResults Array of tasks with NLP similarity scores
 * @param fuzzyResults Array of tasks with fuzzy search scores
 * @param nlpWeight Weight to give NLP results (0-1)
 * @returns Combined results
 */
export function combineSearchResults(
  nlpResults: SimilarTask[],
  fuzzyResults: SimilarTask[],
  nlpWeight: number = 0.6
): SimilarTask[] {
  const fuzzyWeight = 1 - nlpWeight;
  const resultsMap = new Map<string, SimilarTask>();
  
  // Add NLP results to map
  for (const result of nlpResults) {
    resultsMap.set(result.id, {
      ...result,
      similarity: result.similarity * nlpWeight
    });
  }
  
  // Add fuzzy results to map, combining scores if the task already exists
  for (const result of fuzzyResults) {
    if (resultsMap.has(result.id)) {
      const existing = resultsMap.get(result.id)!;
      existing.similarity += result.similarity * fuzzyWeight;
    } else {
      resultsMap.set(result.id, {
        ...result,
        similarity: result.similarity * fuzzyWeight
      });
    }
  }
  
  // Convert map to array and sort by similarity
  return Array.from(resultsMap.values())
    .sort((a, b) => b.similarity - a.similarity);
}