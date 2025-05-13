import { BaseAiProvider } from './base-provider';
import {
  OpenAiConfig,
  CompletionOptions,
  CompletionResult,
  AiMessage
} from './types';

/**
 * OpenAI provider implementation
 * Uses the OpenAI API for AI features
 */
export class OpenAiProvider extends BaseAiProvider {
  private config: OpenAiConfig;
  
  /**
   * Create a new OpenAI provider
   * @param config OpenAI configuration
   */
  constructor(config: OpenAiConfig) {
    super(config);
    
    // Set default values
    this.config = {
      ...config,
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000
    };
  }
  
  /**
   * Get the provider name
   */
  getName(): string {
    return 'OpenAI';
  }
  
  /**
   * Initialize the OpenAI provider
   */
  async initialize(): Promise<void> {
    await super.initialize();
    
    // Perform an API check to make sure the key works
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    // No actual API check is performed to avoid unnecessary API calls
    this.debug('OpenAI provider initialized successfully');
  }
  
  /**
   * Create a completion using the OpenAI API
   * 
   * @param options Completion options
   * @returns Completion result
   */
  async createCompletion(options: CompletionOptions): Promise<CompletionResult> {
    this.checkInitialized();
    
    const model = options.model || this.config.model;
    const temperature = options.temperature !== undefined ? options.temperature : this.config.temperature;
    const maxTokens = options.maxTokens || this.config.maxTokens;
    
    this.debug('Creating OpenAI completion', {
      model,
      temperature,
      maxTokens,
      messages: options.messages
    });
    
    try {
      // Prepare request to OpenAI API
      const apiUrl = (this.config.baseUrl || 'https://api.openai.com') + '/v1/chat/completions';
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      };
      
      if (this.config.organization) {
        headers['OpenAI-Organization'] = this.config.organization;
      }
      
      // Format messages for OpenAI
      const messages = options.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Create request body
      const requestBody = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: options.stopSequences || null
      };
      
      // Make API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error || JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      
      // Extract result text
      const completionText = data.choices[0]?.message?.content || '';
      
      // Calculate token usage
      const usage = data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined;
      
      this.debug('Completion received', {
        usage,
        text: completionText.substring(0, 100) + (completionText.length > 100 ? '...' : '')
      });
      
      return {
        text: completionText,
        usage,
        model: data.model,
        provider: this.getName()
      };
    } catch (error) {
      this.debug('Error creating completion', error);
      
      if (error.name === 'AbortError') {
        throw new Error(`OpenAI API request timed out after ${this.config.timeout || 30000}ms`);
      }
      
      throw error;
    }
  }
  
  /**
   * Calculate an estimate of tokens for the given string
   * This is a simple approximation, not an exact count
   * 
   * @param text Input text
   * @returns Estimated token count
   */
  estimateTokens(text: string): number {
    // Very rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}