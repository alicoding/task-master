/**
 * Fuzzy matching utilities for task search and similarity
 */
import { FuzzySearchOptions, SimilarTask, TaskSearchInfo } from '../types';
/**
 * Perform fuzzy search across a set of tasks
 * @param tasks Tasks to search through
 * @param query Search query
 * @param options Search options
 * @returns Array of similar tasks with scores
 */
export declare function fuzzySearch(tasks: TaskSearchInfo[], query: string, options?: FuzzySearchOptions): SimilarTask[];
/**
 * Combine results from multiple search methods with weights
 * @param nlpResults Results from NLP-based search
 * @param fuzzyResults Results from fuzzy search
 * @param nlpWeight Weight for NLP results (0-1)
 * @returns Combined and de-duplicated results
 */
export declare function combineSearchResults(nlpResults: SimilarTask[], fuzzyResults: SimilarTask[], nlpWeight?: number): SimilarTask[];
