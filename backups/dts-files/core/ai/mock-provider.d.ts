import { BaseAiProvider } from './base-provider';
import { MockAiConfig, CompletionOptions, CompletionResult, TaskOperationType } from './types';
/**
 * Mock AI provider for testing
 * Returns predefined responses or generates simple responses locally
 */
export declare class MockAiProvider extends BaseAiProvider {
    private config;
    private initialized;
    private static readonly DEFAULT_RESPONSES;
    /**
     * Create a new mock AI provider
     * @param config Mock provider configuration
     */
    constructor(config: MockAiConfig);
    /**
     * Get the provider name
     */
    getName(): string;
    /**
     * Initialize the mock provider
     */
    initialize(): Promise<void>;
    /**
     * Create a completion with mock responses
     *
     * @param options Completion options
     * @returns Mock completion result
     */
    createCompletion(options: CompletionOptions): Promise<CompletionResult>;
    /**
     * Simple token counter for mock usage statistics
     * @param input Messages or text to count tokens for
     * @returns Estimated token count
     */
    private countTokens;
    /**
     * Override the task operation method to provide mock-specific processing
     */
    performTaskOperation(type: TaskOperationType, data: any, options?: any): Promise<any>;
}
