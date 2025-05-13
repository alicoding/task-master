/**
 * Fuzzy matching utilities for task search and similarity
 */

import { 
  FuzzySearchOptions, 
  SimilarTask, 
  TaskSearchInfo 
} from '@/core/nlp/types';
import { fuzzyScore } from '@/core/nlp/utils/distance';
import { normalizeText } from '@/core/nlp/utils/tokenization';

/**
 * Perform fuzzy search across a set of tasks
 * @param tasks Tasks to search through
 * @param query Search query
 * @param options Search options
 * @returns Array of similar tasks with scores
 */
export function fuzzySearch(
  tasks: TaskSearchInfo[],
  query: string,
  options: FuzzySearchOptions = {}
): SimilarTask[] {
  const threshold = options.threshold || 0.4;
  const normalizedQuery = normalizeText(query);
  
  // Calculate similarity for each task
  const results = tasks.map(task => {
    const normalizedTitle = normalizeText(task.title);
    const titleSimilarity = fuzzyScore(normalizedQuery, normalizedTitle);
    
    // Calculate description similarity if available
    let descriptionSimilarity = 0;
    if (task.description) {
      const normalizedDesc = normalizeText(task.description);
      descriptionSimilarity = fuzzyScore(normalizedQuery, normalizedDesc);
    }
    
    // Use the higher of the two similarities
    const similarity = Math.max(titleSimilarity, descriptionSimilarity);
    
    return {
      id: task.id,
      title: task.title,
      similarity
    };
  });
  
  // Filter by threshold and sort by similarity (descending)
  return results
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Combine results from multiple search methods with weights
 * @param nlpResults Results from NLP-based search
 * @param fuzzyResults Results from fuzzy search
 * @param nlpWeight Weight for NLP results (0-1)
 * @returns Combined and de-duplicated results
 */
export function combineSearchResults(
  nlpResults: SimilarTask[],
  fuzzyResults: SimilarTask[],
  nlpWeight: number = 0.7
): SimilarTask[] {
  // Create a map to combine scores
  const fuzzyWeight = 1 - nlpWeight;
  const combinedMap = new Map<string, SimilarTask>();
  
  // Process NLP results
  for (const result of nlpResults) {
    combinedMap.set(result.id, {
      ...result,
      similarity: result.similarity * nlpWeight
    });
  }
  
  // Process fuzzy results
  for (const result of fuzzyResults) {
    if (combinedMap.has(result.id)) {
      // Combine scores
      const currentScore = combinedMap.get(result.id)!.similarity;
      const fuzzyScore = result.similarity * fuzzyWeight;
      combinedMap.set(result.id, {
        ...result,
        similarity: currentScore + fuzzyScore
      });
    } else {
      // Add new result
      combinedMap.set(result.id, {
        ...result,
        similarity: result.similarity * fuzzyWeight
      });
    }
  }
  
  // Convert to array and sort
  return Array.from(combinedMap.values())
    .sort((a, b) => b.similarity - a.similarity);
}