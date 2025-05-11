/**
 * NLP Service for Task Master
 *
 * This file serves as a backward compatibility wrapper around the modularized
 * implementation of the NLP service.
 *
 * For new code, consider importing directly from the modularized implementation:
 * import { createNlpService } from './nlp/index.ts';
 */

// Re-export the factory function for creating NLP services
import { createNlpService, TestSafeNlpService } from './nlp/index.ts';

// For backward compatibility, create a class with the same name
// that internally uses our test-safe implementation
export class NlpService extends TestSafeNlpService {
  constructor(modelPath?: string) {
    super();
    console.log('Using NLP Service compatibility layer');
  }
}

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