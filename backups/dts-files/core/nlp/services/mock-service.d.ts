/**
 * Mock NLP Service for Task Master
 * This is a simplified version of NlpService that doesn't rely on external dependencies
 */
import { BaseNlpService } from './base-service';
import { ProcessedQuery, TaskSearchInfo, SimilarTask, ExtractedSearchFilters } from '../types';
/**
 * Mock NLP Service for Task Master
 * Provides simplified NLP capabilities for search and similarity matching
 */
export declare class MockNlpService extends BaseNlpService {
    private modelPath;
    /**
     * Create a new Mock NLP Service
     * @param modelPath Path to NLP model (not used in mock)
     */
    constructor(modelPath?: string);
    /**
     * Mock train method (no-op)
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
     * Find tasks similar to a given title or description
     * @param tasks Array of tasks to search
     * @param title Title to find similar tasks for
     * @param threshold Similarity threshold (0-1)
     * @param useFuzzy Whether to also use fuzzy matching (ignored in mock)
     * @returns Array of tasks with similarity scores
     */
    findSimilarTasks(tasks: TaskSearchInfo[], title: string, threshold?: number, useFuzzy?: boolean): Promise<SimilarTask[]>;
    /**
     * Extract search filters from a natural language query
     * @param query Search query in natural language
     * @returns Extracted search filters
     */
    extractSearchFilters(query: string): Promise<ExtractedSearchFilters>;
}
