import { BaseAiProvider } from './base-provider';
import { AnthropicConfig, CompletionOptions, CompletionResult } from './types';
/**
 * Anthropic/Claude provider implementation
 * Uses the Anthropic API for AI features
 */
export declare class AnthropicProvider extends BaseAiProvider {
    private config;
    /**
     * Create a new Anthropic provider
     * @param config Anthropic configuration
     */
    constructor(config: AnthropicConfig);
    /**
     * Get the provider name
     */
    getName(): string;
    /**
     * Initialize the Anthropic provider
     */
    initialize(): Promise<void>;
    /**
     * Create a completion using the Anthropic API
     *
     * @param options Completion options
     * @returns Completion result
     */
    createCompletion(options: CompletionOptions): Promise<CompletionResult>;
    /**
     * Convert messages from OpenAI format to Anthropic format
     *
     * @param messages OpenAI-style messages
     * @returns Anthropic-style messages with system prompt separated
     */
    private convertMessages;
    /**
     * Calculate an estimate of tokens for the given string
     * This is a simple approximation, not an exact count
     *
     * @param text Input text
     * @returns Estimated token count
     */
    estimateTokens(text: string): number;
}
