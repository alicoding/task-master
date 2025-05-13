/**
 * Custom OpenAI-compatible provider implementation
 * Uses any OpenAI API-compatible endpoint (like LLaMA.cpp server, LocalAI, etc.)
 */
import { OpenAiProvider } from './openai-provider';
import { OpenAiConfig, CompletionOptions, CompletionResult } from './types';
/**
 * Configuration for custom OpenAI-compatible providers
 */
export interface CustomOpenAiConfig extends OpenAiConfig {
    providerName?: string;
}
/**
 * Custom OpenAI-compatible provider
 * Supports any service that implements the OpenAI API format
 */
export declare class CustomOpenAiProvider extends OpenAiProvider {
    private customConfig;
    /**
     * Create a new custom OpenAI-compatible provider
     * @param config Provider configuration
     */
    constructor(config: CustomOpenAiConfig);
    /**
     * Get the provider name
     */
    getName(): string;
    /**
     * Initialize the provider
     */
    initialize(): Promise<void>;
    /**
     * Create a completion - uses the OpenAI provider implementation
     * but adds extra error handling for custom endpoints
     *
     * @param options Completion options
     * @returns Completion result
     */
    createCompletion(options: CompletionOptions): Promise<CompletionResult>;
    /**
     * Verify the connection to the custom endpoint
     * @returns Whether the connection was successful
     */
    verifyConnection(): Promise<boolean>;
}
