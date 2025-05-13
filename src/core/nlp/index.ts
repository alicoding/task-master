/**
 * NLP system for task processing, search, and similarity
 *
 * This module provides natural language processing capabilities for TaskMaster,
 * including text processing, entity extraction, similarity calculation,
 * and search filtering.
 */

// Export base services for extensibility
export { BaseNlpService } from '@/core/nlp/services/base-service';
export { MockNlpService } from '@/core/nlp/services/mock-service';

// Export factory pattern for creating NLP services
export { createNlpService } from '@/core/nlp/factory';

// Export testing utilities
export { TestSafeNlpService } from '@/core/nlp/testing/nlp-test-utils';

// Export types
export * from '@/core/nlp/types';

// Export utility functions
export * from '@/core/nlp/utils/index';

// Export processing functions
export * from '@/core/nlp/processing/index';

// Export matchers
export * from '@/core/nlp/matchers/index';