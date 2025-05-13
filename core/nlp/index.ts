/**
 * NLP system for task processing, search, and similarity
 *
 * This module provides natural language processing capabilities for TaskMaster,
 * including text processing, entity extraction, similarity calculation,
 * and search filtering.
 */

// Export base services for extensibility
export { BaseNlpService } from './services/base-service';
export { MockNlpService } from './services/mock-service';

// Export factory pattern for creating NLP services
export { createNlpService } from './factory';

// Export testing utilities
export { TestSafeNlpService } from './testing/nlp-test-utils';

// Export types
export * from './types';

// Export utility functions
export * from './utils/index';

// Export processing functions
export * from './processing/index';

// Export matchers
export * from './matchers/index';