/**
 * NLP system for task processing, search, and similarity
 *
 * This module provides natural language processing capabilities for TaskMaster,
 * including text processing, entity extraction, similarity calculation,
 * and search filtering.
 */
export { BaseNlpService } from './services/base-service';
export { MockNlpService } from './services/mock-service';
export { createNlpService } from './factory';
export { TestSafeNlpService } from './testing/nlp-test-utils';
export * from './types';
export * from './utils/index';
export * from './processing/index';
export * from './matchers/index';
