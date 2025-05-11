/**
 * NLP Service Factory
 * 
 * This module provides a factory function to create the appropriate NLP service
 * based on the environment and available dependencies.
 */

import { NlpServiceInterface } from './types.ts';
import { MockNlpService } from './services/mock-service.ts';
import { TestSafeNlpService } from './testing/nlp-test-utils.ts';

// Environment detection
const isTestEnvironment = process.env.NODE_ENV === 'test' || 
  process.env.VITEST || 
  process.argv.includes('vitest') ||
  process.argv.includes('--config');

/**
 * Create an appropriate NLP service based on the environment
 * @param options Configuration options for NLP service creation
 * @returns An NLP service implementation
 */
export function createNlpService(
  options: {
    modelPath?: string,
    forceTestSafe?: boolean,
    useOptimized?: boolean,
    enableProfiling?: boolean
  } = {}
): NlpServiceInterface {
  const {
    modelPath,
    forceTestSafe = false,
    useOptimized = process.env.TASKMASTER_OPTIMIZED_NLP !== 'false',
    enableProfiling = process.env.TASKMASTER_NLP_PROFILING === 'true'
  } = options;
  
  // Always use the test-safe implementation in test environments
  if (isTestEnvironment || forceTestSafe) {
    return new TestSafeNlpService();
  }
  
  // Try to load the real NLP service dynamically to avoid import-time errors
  try {
    // Use optimized implementation if requested
    if (useOptimized) {
      try {
        const { OptimizedNlpService } = require('./services/optimized-nlp-service.ts');
        return new OptimizedNlpService(modelPath, enableProfiling);
      } catch (optimizedError) {
        console.warn('Failed to load OptimizedNlpService, falling back to standard NlpService:', optimizedError);
      }
    }
    
    // Standard implementation
    const { NlpService } = require('./services/nlp-service.ts');
    return new NlpService(modelPath);
  } catch (error) {
    console.warn('Failed to load NlpService, falling back to MockNlpService:', error);
    return new MockNlpService(modelPath || '');
  }
}

/**
 * Create a mock NLP service
 * @returns A mock NLP service implementation
 */
export function createMockNlpService(): NlpServiceInterface {
  return new MockNlpService();
}

/**
 * Create an optimized NLP service
 * @param modelPath Optional path to NLP model
 * @param enableProfiling Whether to enable performance profiling
 * @returns An optimized NLP service implementation
 */
export function createOptimizedNlpService(
  modelPath?: string,
  enableProfiling: boolean = false
): NlpServiceInterface {
  try {
    const { OptimizedNlpService } = require('./services/optimized-nlp-service.ts');
    return new OptimizedNlpService(modelPath, enableProfiling);
  } catch (error) {
    console.warn('Failed to load OptimizedNlpService, falling back to MockNlpService:', error);
    return new MockNlpService(modelPath || '');
  }
}