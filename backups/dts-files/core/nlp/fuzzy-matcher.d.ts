import { TaskSearchInfo, SimilarTask, FuzzySearchOptions } from './types';
/**
 * Perform fuzzy search on tasks
 * @param tasks Array of tasks to search
 * @param query Search query
 * @param options Fuzzy search options
 * @returns Array of matching tasks with scores
 */
export declare function fuzzySearch(tasks: TaskSearchInfo[], query: string, options?: FuzzySearchOptions): SimilarTask[];
/**
 * Combine NLP similarity with fuzzy search results
 * @param nlpResults Array of tasks with NLP similarity scores
 * @param fuzzyResults Array of tasks with fuzzy search scores
 * @param nlpWeight Weight to give NLP results (0-1)
 * @returns Combined results
 */
export declare function combineSearchResults(nlpResults: SimilarTask[], fuzzyResults: SimilarTask[], nlpWeight?: number): SimilarTask[];
