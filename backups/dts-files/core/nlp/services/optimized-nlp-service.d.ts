/**
 * Optimized NLP Service for Task Master
 * Enhanced version with caching and performance improvements
 */
import { BaseNlpService } from './base-service';
import { TaskSearchInfo, SimilarTask, ProcessedQuery, ExtractedSearchFilters } from '../types';
/**
 * Optimized NLP Service for Task Master
 * Provides enhanced NLP capabilities with better performance
 */
export declare class OptimizedNlpService extends BaseNlpService {
    private nlpManager;
    private tokenizer;
    private stemmer;
    private modelPath;
    private initialized;
    /**
     * Create a new Optimized NLP Service
     * @param modelPath Path to NLP model (defaults to ./nlp-model.json)
     * @param enableProfiling Whether to enable performance profiling
     */
    constructor(modelPath?: string, enableProfiling?: boolean);
    /**
     * Train the NLP manager with example task descriptions
     * This should be called before using the service for search and analysis
     */
    train(): Promise<void>;
    /**
     * Process a search query to extract intents and entities
     * @param query User's search query
     * @returns Processed query with extracted information
     */
    processQuery(query: string): Promise<ProcessedQuery>;
    /**
     * Calculate similarity score between two texts
     * @param text1 First text
     * @param text2 Second text
     * @returns Similarity score between 0 and 1
     */
    getSimilarity(text1: string, text2: string): Promise<number>;
    /**
     * Calculate similarity scores for many texts in an optimized way
     * @param target Target text to compare
     * @param texts Array of texts to compare against
     * @param threshold Minimum similarity threshold
     * @returns Array of [index, score] pairs for texts above threshold
     */
    bulkGetSimilarity(target: string, texts: string[], threshold?: number): Promise<[number, number][]>;
    /**
     * Find tasks similar to a given title or description
     * Optimized version with bulk similarity calculation
     * @param tasks Array of tasks to search
     * @param title Title to find similar tasks for
     * @param threshold Similarity threshold (0-1)
     * @param useFuzzy Whether to also use fuzzy matching
     * @returns Array of tasks with similarity scores
     */
    findSimilarTasks(tasks: TaskSearchInfo[], title: string, threshold?: number, useFuzzy?: boolean): Promise<SimilarTask[]>;
    /**
     * Extract search filters from a natural language query
     * @param query Search query in natural language
     * @returns Extracted search filters
     */
    extractSearchFilters(query: string): Promise<ExtractedSearchFilters>;
    /**
     * Get the NLP cache statistics
     * @returns Object with cache statistics
     */
    getCacheStats(): {
        query: number;
        similarity: number;
        filters: number;
    };
    /**
     * Clear the NLP cache
     * @param cacheType Type of cache to clear (or all if not specified)
     */
    clearCache(cacheType?: 'query' | 'similarity' | 'filters'): void;
    /**
     * Print performance profiling results
     */
    printProfilingResults(): void;
    /**
     * Ensure the NLP service is initialized
     */
    private ensureInitialized;
}
