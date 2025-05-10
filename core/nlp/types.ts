/**
 * Type definitions for the NLP service
 */

/**
 * Processed query result with extracted information
 */
export interface ProcessedQuery {
  original: string;
  normalizedQuery: string;
  tokens: string[];
  stems: string[];
  entities: Record<string, string[]>;
  intents: {name: string; score: number}[];
}

/**
 * Search filters extracted from natural language query
 */
export interface ExtractedSearchFilters {
  query: string;
  status?: string;
  readiness?: string;
  priority?: string;
  tags?: string[];
  actionTypes?: string[];
  extractedTerms: string[];
}

/**
 * Task information for similarity search
 */
export interface TaskSearchInfo {
  id: string;
  title: string;
  description?: string;
}

/**
 * Task with similarity score
 */
export interface SimilarTask {
  id: string;
  title: string;
  similarity: number;
}

/**
 * Configuration for fuzzy search
 */
export interface FuzzySearchOptions {
  threshold?: number;
  keys?: string[];
  includeScore?: boolean;
  shouldSort?: boolean;
  ignoreLocation?: boolean;
  findAllMatches?: boolean;
}