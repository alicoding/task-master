import { BaseAiProvider } from './base-provider.js';
import {
  AnthropicConfig,
  CompletionOptions,
  CompletionResult,
  AiMessage
} from './types.js';

/**
 * Anthropic/Claude provider implementation
 * Uses the Anthropic API for AI features
 */
export class AnthropicProvider extends BaseAiProvider {
  private config: AnthropicConfig;

  /**
   * Create a new Anthropic provider
   * @param config Anthropic configuration
   */
  constructor(config: AnthropicConfig) {
    super(config);

    // Set default values
    this.config = {
      ...config,
      model: config.model || 'claude-3-opus-20240229',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      baseUrl: config.baseUrl || 'https://api.anthropic.com'
    };
  }

  /**
   * Get the provider name
   */
  getName(): string {
    return 'Claude';
  }

  /**
   * Initialize the Anthropic provider
   */
  async initialize(): Promise<void> {
    await super.initialize();

    // Verify API key
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    // No actual API check is performed to avoid unnecessary API calls
    this.debug('Anthropic provider initialized successfully');
  }

  /**
   * Create a completion using the Anthropic API
   *
   * @param options Completion options
   * @returns Completion result
   */
  async createCompletion(options: CompletionOptions): Promise<CompletionResult> {
    this.checkInitialized();

    const model = options.model || this.config.model;
    const temperature = options.temperature !== undefined ? options.temperature : this.config.temperature;
    const maxTokens = options.maxTokens || this.config.maxTokens;

    this.debug('Creating Anthropic completion', {
      model,
      temperature,
      maxTokens,
      messages: options.messages
    });

    try {
      // Convert message format from OpenAI style to Anthropic style
      const { systemPrompt, messages } = this.convertMessages(options.messages);

      // Prepare request to Anthropic API
      const apiUrl = `${this.config.baseUrl}/v1/messages`;

      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      };

      // Create request body
      const requestBody = {
        model,
        messages,
        system: systemPrompt,
        temperature,
        max_tokens: maxTokens,
        stop_sequences: options.stopSequences || []
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
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorData.error || JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      // Extract result text
      const completionText = data.content?.[0]?.text || '';

      // Calculate token usage if provided by API
      const usage = data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      } : {
        // Estimate if not provided
        promptTokens: this.estimateTokens(systemPrompt + JSON.stringify(messages)),
        completionTokens: this.estimateTokens(completionText),
        totalTokens: 0 // Will be calculated below
      };

      if (!data.usage) {
        usage.totalTokens = usage.promptTokens + usage.completionTokens;
      }

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
        throw new Error(`Anthropic API request timed out after ${this.config.timeout || 30000}ms`);
      }

      throw error;
    }
  }

  /**
   * Convert messages from OpenAI format to Anthropic format
   *
   * @param messages OpenAI-style messages
   * @returns Anthropic-style messages with system prompt separated
   */
  private convertMessages(messages: AiMessage[]): { systemPrompt: string, messages: any[] } {
    let systemPrompt = '';
    const anthropicMessages: any[] = [];

    // Extract system message and convert other messages
    for (const message of messages) {
      if (message.role === 'system') {
        // Anthropic handles system messages differently
        systemPrompt = message.content;
      } else {
        anthropicMessages.push({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content
        });
      }
    }

    return { systemPrompt, messages: anthropicMessages };
  }

  /**
   * Calculate an estimate of tokens for the given string
   * This is a simple approximation, not an exact count
   *
   * @param text Input text
   * @returns Estimated token count
   */
  estimateTokens(text: string): number {
    // Claude models: approximately 4-5 characters per token (rough estimate)
    return Math.ceil(text.length / 4.5);
  }
}