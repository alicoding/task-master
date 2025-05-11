/**
 * NLP system for task processing, search, and similarity
 *
 * This module provides natural language processing capabilities for TaskMaster,
 * including text processing, entity extraction, similarity calculation,
 * and search filtering.
 */

// Export base services for extensibility
export { BaseNlpService } from './services/base-service.ts';
export { MockNlpService } from './services/mock-service.ts';

// Export factory pattern for creating NLP services
export { createNlpService } from './factory.ts';

// Export testing utilities
export { TestSafeNlpService } from './testing/nlp-test-utils.ts';

// Export types
export * from './types.ts';

// Export utility functions
export * from './utils/index.ts';

// Export processing functions
export * from './processing/index.ts';

// Export matchers
export * from './matchers/index.ts';