import { AiProvider, AiConfig, AiProviderType } from './types.ts';
import { OpenAiProvider } from './openai-provider.ts';
import { AnthropicProvider } from './anthropic-provider.ts';
import { CustomOpenAiProvider } from './custom-openai-provider.ts';
import { MockAiProvider } from './mock-provider.ts';

/**
 * Extended provider types
 */
export type ExtendedProviderType = AiProviderType | 'custom-openai';

/**
 * Factory for creating AI providers
 */
export class AiProviderFactory {
  /**
   * Create an AI provider based on configuration
   *
   * @param config AI provider configuration
   * @returns AI provider instance
   */
  static createProvider(config: AiConfig): AiProvider {
    switch (config.type) {
      case 'openai':
        // If a custom base URL is provided, use the custom provider
        if (config.baseUrl && config.baseUrl !== 'https://api.openai.com') {
          return new CustomOpenAiProvider({
            ...config,
            providerName: config.baseUrl.includes('azure') ? 'Azure OpenAI' : 'Custom OpenAI'
          });
        }
        return new OpenAiProvider(config);

      case 'anthropic':
        return new AnthropicProvider(config);

      case 'mock':
        return new MockAiProvider(config);

      case 'local':
        throw new Error('Local AI providers are not yet implemented');

      default:
        // Check for custom provider types
        const type = (config as any).type;
        if (type === 'custom-openai') {
          if (!config.baseUrl) {
            throw new Error('baseUrl is required for custom OpenAI providers');
          }
          return new CustomOpenAiProvider(config as any);
        }

        throw new Error(`Unknown AI provider type: ${type}`);
    }
  }

  /**
   * Create an AI provider from environment variables
   *
   * @returns AI provider instance
   */
  static createFromEnvironment(): AiProvider {
    // Try to get provider type from environment
    const providerType = process.env.AI_PROVIDER_TYPE as ExtendedProviderType || 'mock';

    // Common debug setting
    const debug = process.env.AI_DEBUG === 'true';

    // Create configuration based on provider type
    switch (providerType) {
      case 'openai':
        // Check if a custom base URL is provided
        const baseUrl = process.env.OPENAI_BASE_URL;
        if (baseUrl && baseUrl !== 'https://api.openai.com') {
          return new CustomOpenAiProvider({
            type: 'openai',
            apiKey: process.env.OPENAI_API_KEY || '',
            model: process.env.OPENAI_MODEL || 'gpt-4',
            baseUrl,
            temperature: process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.7,
            organization: process.env.OPENAI_ORGANIZATION,
            providerName: process.env.OPENAI_PROVIDER_NAME || (baseUrl.includes('azure') ? 'Azure OpenAI' : 'Custom OpenAI'),
            debug
          });
        }

        return new OpenAiProvider({
          type: 'openai',
          apiKey: process.env.OPENAI_API_KEY || '',
          model: process.env.OPENAI_MODEL || 'gpt-4',
          temperature: process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.7,
          organization: process.env.OPENAI_ORGANIZATION,
          debug
        });

      case 'anthropic':
        return new AnthropicProvider({
          type: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY || '',
          model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
          baseUrl: process.env.ANTHROPIC_BASE_URL,
          temperature: process.env.ANTHROPIC_TEMPERATURE ? parseFloat(process.env.ANTHROPIC_TEMPERATURE) : 0.7,
          debug
        });

      case 'custom-openai':
        return new CustomOpenAiProvider({
          type: 'openai',
          apiKey: process.env.CUSTOM_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
          model: process.env.CUSTOM_OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          baseUrl: process.env.CUSTOM_OPENAI_BASE_URL || 'http://localhost:8080',
          temperature: process.env.CUSTOM_OPENAI_TEMPERATURE ? parseFloat(process.env.CUSTOM_OPENAI_TEMPERATURE) : 0.7,
          providerName: process.env.CUSTOM_OPENAI_PROVIDER_NAME || 'Custom OpenAI',
          debug
        });

      case 'mock':
      default:
        return new MockAiProvider({
          type: 'mock',
          debug
        });
    }
  }

  /**
   * Get available provider types
   */
  static getProviderTypes(): string[] {
    return [
      'openai',
      'anthropic',
      'custom-openai',
      'mock'
    ];
  }

  /**
   * Test connection to a provider
   *
   * @param provider AI provider to test
   * @returns Whether the connection was successful
   */
  static async testConnection(provider: AiProvider): Promise<boolean> {
    try {
      // Try to initialize the provider
      await provider.initialize();

      // For custom providers, test the connection
      if (provider instanceof CustomOpenAiProvider) {
        return await provider.verifyConnection();
      }

      // For other providers, just try a simple completion
      const result = await provider.createCompletion({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hello!' }
        ],
        maxTokens: 10
      });

      return !!result && !!result.text;
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }
}