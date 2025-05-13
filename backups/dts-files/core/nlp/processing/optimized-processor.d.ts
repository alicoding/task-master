/**
 * Optimized processor module for NLP service
 * Enhanced version of the processor with caching and performance improvements
 */
import { NlpManager } from '../types';
import { ProcessedQuery, ExtractedSearchFilters } from '../types';
import { Tokenizer, Stemmer } from './processor';
/**
 * Cache manager for NLP operations
 */
declare class NlpCache {
    private static instance;
    private queryCache;
    private similarityCache;
    private filtersCache;
    private ttl;
    private maxEntries;
    /**
     * Get the singleton cache instance
     */
    static getInstance(): NlpCache;
    /**
     * Set the TTL for cache entries
     * @param milliseconds TTL in milliseconds
     */
    setTtl(milliseconds: number): void;
    /**
     * Set the maximum number of cache entries before cleanup
     * @param count Maximum number of entries
     */
    setMaxEntries(count: number): void;
    /**
     * Get a processed query from cache or null if not found
     * @param query Query string
     */
    getProcessedQuery(query: string): ProcessedQuery | null;
    /**
     * Store a processed query in cache
     * @param query Query string
     * @param processed Processed query
     */
    setProcessedQuery(query: string, processed: ProcessedQuery): void;
    /**
     * Get a similarity score from cache or null if not found
     * @param text1 First text
     * @param text2 Second text
     */
    getSimilarity(text1: string, text2: string): number | null;
    /**
     * Store a similarity score in cache
     * @param text1 First text
     * @param text2 Second text
     * @param score Similarity score
     */
    setSimilarity(text1: string, text2: string, score: number): void;
    /**
     * Get extracted search filters from cache or null if not found
     * @param query Query string
     */
    getExtractedFilters(query: string): ExtractedSearchFilters | null;
    /**
     * Store extracted search filters in cache
     * @param query Query string
     * @param filters Extracted search filters
     */
    setExtractedFilters(query: string, filters: ExtractedSearchFilters): void;
    /**
     * Clear all caches
     */
    clearAll(): void;
    /**
     * Clear a specific cache
     * @param cacheType Type of cache to clear
     */
    clear(cacheType: 'query' | 'similarity' | 'filters'): void;
    /**
     * Get cache statistics
     * @returns Object with cache counts
     */
    getStats(): {
        query: number;
        similarity: number;
        filters: number;
    };
    /**
     * Clean up expired entries in a cache
     * @param cache Cache to clean up
     */
    private cleanExpiredEntries;
    /**
     * Normalize a key for cache storage
     * @param text Text to normalize
     * @returns Normalized key
     */
    private getNormalizedKey;
    /**
     * Perform cache cleanup if needed
     * @param cache Cache to clean up
     */
    private performCacheCleanupIfNeeded;
}
/**
 * Get the NLP cache instance
 * @returns The NlpCache instance
 */
export declare function getNlpCache(): NlpCache;
/**
 * Optimized version of processQuery with caching and performance improvements
 * @param query User's search query
 * @param nlpManager NLP manager instance
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @returns Processed query with extracted information
 */
export declare function processQuery(query: string, nlpManager: NlpManager, tokenizer: Tokenizer | null, stemmer: Stemmer | null): Promise<ProcessedQuery>;
/**
 * Optimized version of calculateSimilarity with caching and performance improvements
 * @param text1 First text
 * @param text2 Second text
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @param nlpManager NLP manager instance
 * @returns Similarity score between 0 and 1
 */
export declare function calculateSimilarity(text1: string, text2: string, tokenizer: Tokenizer | null, stemmer: Stemmer | null, nlpManager: NlpManager): Promise<number>;
/**
 * Optimized version of extractSearchFilters with caching and performance improvements
 * @param query Search query in natural language
 * @param nlpManager NLP manager instance
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @returns Extracted search filters
 */
export declare function extractSearchFilters(query: string, nlpManager: NlpManager, tokenizer: Tokenizer | null, stemmer: Stemmer | null): Promise<ExtractedSearchFilters>;
/**
 * Calculate bulk similarity scores efficiently
 * @param target Target text to compare against
 * @param texts Array of texts to compare
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @param nlpManager NLP manager instance
 * @param threshold Minimum similarity threshold
 * @returns Array of [index, score] pairs for texts above threshold
 */
export declare function bulkCalculateSimilarity(target: string, texts: string[], tokenizer: Tokenizer | null, stemmer: Stemmer | null, nlpManager: NlpManager, threshold?: number): Promise<[number, number][]>;
export {};
