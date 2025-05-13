/**
 * Mock NLP Service for Task Master
 *
 * This file serves as a backward compatibility wrapper around the modularized
 * implementation of the mock NLP service.
 *
 * For new code, consider importing directly from the modularized implementation:
 * import { TestSafeNlpService as NlpService } from './nlp/index.ts';
 */

// Use the test-safe implementation for backward compatibility
import { TestSafeNlpService } from './nlp/testing/nlp-test-utils';
export { TestSafeNlpService as MockNlpService, TestSafeNlpService as NlpService };

// Re-export types for backward compatibility
// Define these locally for backward compatibility
export interface ProcessedQuery {
  original: string;
  normalizedQuery: string;
  tokens: string[];
  stems: string[];
  entities: Record<string, string[]>;
  intents: {name: string; score: number}[];
}

export interface ExtractedSearchFilters {
  query: string;
  status?: string;
  readiness?: string;
  priority?: string;
  tags?: string[];
  actionTypes?: string[];
  extractedTerms: string[];
}

export interface TaskSearchInfo {
  id: string;
  title: string;
  description?: string;
}

export interface SimilarTask {
  id: string;
  title: string;
  similarity: number;
}