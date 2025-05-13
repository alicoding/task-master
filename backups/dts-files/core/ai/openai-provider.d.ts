import { BaseAiProvider } from './base-provider';
import { OpenAiConfig, CompletionOptions, CompletionResult } from './types';
/**
 * OpenAI provider implementation
 * Uses the OpenAI API for AI features
 */
export declare class OpenAiProvider extends BaseAiProvider {
    private config;
    /**
     * Create a new OpenAI provider
     * @param config OpenAI configuration
     */
    constructor(config: OpenAiConfig);
    /**
     * Get the provider name
     */
    getName(): string;
    /**
     * Initialize the OpenAI provider
     */
    initialize(): Promise<void>;
    /**
     * Create a completion using the OpenAI API
     *
     * @param options Completion options
     * @returns Completion result
     */
    createCompletion(options: CompletionOptions): Promise<CompletionResult>;
    /**
     * Calculate an estimate of tokens for the given string
     * This is a simple approximation, not an exact count
     *
     * @param text Input text
     * @returns Estimated token count
     */
    estimateTokens(text: string): number;
}
