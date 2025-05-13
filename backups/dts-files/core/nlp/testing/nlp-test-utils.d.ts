/**
 * NLP Test Utilities
 *
 * This module provides test utilities for isolating NLP dependencies
 * and ensuring tests can run even when NLP libraries have issues.
 */
import { ProcessedQuery, ExtractedSearchFilters, TaskSearchInfo, SimilarTask, NlpServiceInterface } from '../types';
/**
 * Create mock processed query result
 * @param query Original query text
 * @returns Mocked processed query
 */
export declare function createMockProcessedQuery(query: string): ProcessedQuery;
/**
 * Create mock extracted search filters
 * @param query Original query text
 * @returns Mocked extracted search filters
 */
export declare function createMockSearchFilters(query: string): ExtractedSearchFilters;
/**
 * Calculate a simple similarity score between two texts
 * @param text1 First text
 * @param text2 Second text
 * @returns Similarity score between 0 and 1
 */
export declare function calculateMockSimilarity(text1: string, text2: string): number;
/**
 * Find similar tasks using simple word overlap
 * @param tasks List of tasks to search
 * @param query Search query
 * @param threshold Similarity threshold
 * @returns List of tasks with similarity scores
 */
export declare function findMockSimilarTasks(tasks: TaskSearchInfo[], query: string, threshold?: number): SimilarTask[];
/**
 * Test-safe NLP service that doesn't depend on external libraries
 * This class implements the NlpServiceInterface but uses only internal utilities
 */
export declare class TestSafeNlpService implements NlpServiceInterface {
    /**
     * Initialize the test-safe NLP service
     */
    constructor();
    /**
     * Mock train method (no-op for testing)
     */
    train(): Promise<void>;
    /**
     * Process a query using mock implementations
     * @param query The query to process
     * @returns Processed query information
     */
    processQuery(query: string): Promise<ProcessedQuery>;
    /**
     * Calculate similarity between two texts
     * @param text1 First text
     * @param text2 Second text
     * @returns Similarity score between 0 and 1
     */
    getSimilarity(text1: string, text2: string): Promise<number>;
    /**
     * Find tasks similar to a query
     * @param tasks Array of tasks to search
     * @param title Search query
     * @param threshold Similarity threshold (0-1)
     * @param useFuzzy Whether to use fuzzy matching (ignored in test implementation)
     * @returns Array of similar tasks with scores
     */
    findSimilarTasks(tasks: TaskSearchInfo[], title: string, threshold?: number, useFuzzy?: boolean): Promise<SimilarTask[]>;
    /**
     * Extract search filters from a query
     * @param query Search query
     * @returns Extracted filters
     */
    extractSearchFilters(query: string): Promise<ExtractedSearchFilters>;
}
