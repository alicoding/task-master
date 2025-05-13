/**
 * Processor module for NLP service
 * Handles processing queries and calculating similarity
 */
import { NlpManager } from '../types';
import { ProcessedQuery, ExtractedSearchFilters } from '../types';
/**
 * Interface for tokenizer
 */
export interface Tokenizer {
    tokenize(text: string): string[];
}
/**
 * Interface for stemmer
 */
export interface Stemmer {
    stem(word: string): string;
}
/**
 * Process a search query to extract intents and entities
 * @param query User's search query
 * @param nlpManager NLP manager instance
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @returns Processed query with extracted information
 */
export declare function processQuery(query: string, nlpManager: NlpManager, tokenizer: Tokenizer | null, stemmer: Stemmer | null): Promise<ProcessedQuery>;
/**
 * Calculate similarity score between two texts
 * @param text1 First text
 * @param text2 Second text
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @param nlpManager NLP manager instance
 * @returns Similarity score between 0 and 1
 */
export declare function calculateSimilarity(text1: string, text2: string, tokenizer: Tokenizer | null, stemmer: Stemmer | null, nlpManager: NlpManager): Promise<number>;
/**
 * Extract search filters from a natural language query
 * @param query Search query in natural language
 * @param nlpManager NLP manager instance
 * @param tokenizer Tokenizer instance
 * @param stemmer Stemmer instance
 * @returns Extracted search filters
 */
export declare function extractSearchFilters(query: string, nlpManager: NlpManager, tokenizer: Tokenizer | null, stemmer: Stemmer | null): Promise<ExtractedSearchFilters>;
/**
 * Remove extracted terms from the query string
 * @param query Original query
 * @param terms Terms to remove
 * @returns Cleaned query
 */
export declare function removeExtractedTerms(query: string, terms: string[]): string;
