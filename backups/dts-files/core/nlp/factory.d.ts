/**
 * NLP Service Factory
 *
 * This module provides a factory function to create the appropriate NLP service
 * based on the environment and available dependencies.
 */
import { NlpServiceInterface } from './types';
/**
 * Create an appropriate NLP service based on the environment
 * @param options Configuration options for NLP service creation
 * @returns An NLP service implementation
 */
export declare function createNlpService(options?: {
    modelPath?: string;
    forceTestSafe?: boolean;
    useOptimized?: boolean;
    enableProfiling?: boolean;
}): Promise<NlpServiceInterface>;
/**
 * Create a mock NLP service
 * @returns A mock NLP service implementation
 */
export declare function createMockNlpService(): NlpServiceInterface;
/**
 * Create an optimized NLP service
 * @param modelPath Optional path to NLP model
 * @param enableProfiling Whether to enable performance profiling
 * @returns An optimized NLP service implementation
 */
export declare function createOptimizedNlpService(modelPath?: string, enableProfiling?: boolean): Promise<NlpServiceInterface>;
