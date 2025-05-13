import { AiProvider, AiConfig, AiProviderType } from './types';
/**
 * Extended provider types
 */
export type ExtendedProviderType = AiProviderType | 'custom-openai';
/**
 * Factory for creating AI providers
 */
export declare class AiProviderFactory {
    /**
     * Create an AI provider based on configuration
     *
     * @param config AI provider configuration
     * @returns AI provider instance
     */
    static createProvider(config: AiConfig): AiProvider;
    /**
     * Create an AI provider from environment variables
     *
     * @returns AI provider instance
     */
    static createFromEnvironment(): AiProvider;
    /**
     * Get available provider types
     */
    static getProviderTypes(): string[];
    /**
     * Test connection to a provider
     *
     * @param provider AI provider to test
     * @returns Whether the connection was successful
     */
    static testConnection(provider: AiProvider): Promise<boolean>;
}
