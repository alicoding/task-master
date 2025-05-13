/**
 * Custom OpenAI-compatible provider implementation
 * Uses any OpenAI API-compatible endpoint (like LLaMA.cpp server, LocalAI, etc.)
 */

import { OpenAiProvider } from './openai-provider';
import {
  OpenAiConfig,
  CompletionOptions,
  CompletionResult
} from './types';

/**
 * Configuration for custom OpenAI-compatible providers
 */
export interface CustomOpenAiConfig extends OpenAiConfig {
  providerName?: string; // Custom name for the provider
}

/**
 * Custom OpenAI-compatible provider
 * Supports any service that implements the OpenAI API format
 */
export class CustomOpenAiProvider extends OpenAiProvider {
  private customConfig: CustomOpenAiConfig;
  
  /**
   * Create a new custom OpenAI-compatible provider
   * @param config Provider configuration
   */
  constructor(config: CustomOpenAiConfig) {
    // Ensure baseUrl is set
    if (!config.baseUrl) {
      throw new Error('baseUrl is required for CustomOpenAiProvider');
    }
    
    super(config);
    
    this.customConfig = {
      ...config,
      providerName: config.providerName || 'CustomOpenAI'
    };
  }
  
  /**
   * Get the provider name
   */
  getName(): string {
    return this.customConfig.providerName || 'CustomOpenAI';
  }
  
  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Log the custom provider configuration
    this.debug(`${this.getName()} provider initialized with endpoint: ${this.customConfig.baseUrl}`);
  }
  
  /**
   * Create a completion - uses the OpenAI provider implementation
   * but adds extra error handling for custom endpoints
   * 
   * @param options Completion options
   * @returns Completion result
   */
  async createCompletion(options: CompletionOptions): Promise<CompletionResult> {
    try {
      // Use the parent implementation
      return await super.createCompletion(options);
    } catch (error) {
      // Add custom error handling for typical issues with self-hosted LLMs
      const errorMessage = error.message || String(error);
      
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) {
        throw new Error(`Could not connect to ${this.getName()} at ${this.customConfig.baseUrl}. Is the server running?`);
      }
      
      if (errorMessage.includes('model')) {
        throw new Error(`Model not available on ${this.getName()}. Check that the model '${options.model || this.customConfig.model}' is loaded and available.`);
      }
      
      // Re-throw the original error if we couldn't handle it
      throw error;
    }
  }
  
  /**
   * Verify the connection to the custom endpoint
   * @returns Whether the connection was successful
   */
  async verifyConnection(): Promise<boolean> {
    try {
      // Try to get models list from the API
      const apiUrl = `${this.customConfig.baseUrl}/v1/models`;
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.customConfig.apiKey || 'sk-no-key-required'}`
      };
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers,
        // Short timeout for connection check
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.debug('Authentication error with custom endpoint - API key might be required');
          return false;
        }
        
        if (response.status === 404) {
          // Try a simpler health check if models endpoint is not implemented
          const healthResponse = await fetch(this.customConfig.baseUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          
          return healthResponse.ok || healthResponse.status < 500;
        }
        
        return false;
      }
      
      return true;
    } catch (error) {
      this.debug('Error verifying connection', error);
      return false;
    }
  }
}