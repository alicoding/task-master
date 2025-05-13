/**
 * NLP Service for Task Master
 * This service provides natural language processing capabilities
 * for improved search and matching
 */
import { BaseNlpService } from './base-service';
import { TaskSearchInfo, SimilarTask, ProcessedQuery, ExtractedSearchFilters } from '../types';
/**
 * NLP Service for Task Master
 * Provides advanced NLP capabilities for search, similarity matching, and more
 */
export declare class NlpService extends BaseNlpService {
    private nlpManager;
    private tokenizer;
    private stemmer;
    private modelPath;
    /**
     * Create a new NLP Service
     * @param modelPath Path to NLP model (defaults to ./nlp-model.json)
     */
    constructor(modelPath?: string);
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
     * Find tasks similar to a given title or description
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
}
