/**
 * AI provider interface for task-master
 * Defines common types and interfaces for AI integration
 */

/**
 * Supported AI provider types
 */
export type AiProviderType = 'openai' | 'anthropic' | 'local' | 'mock';

/**
 * Base configuration for all AI providers
 */
export interface AiProviderConfig {
  type: AiProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  debug?: boolean;
  timeout?: number;
}

/**
 * OpenAI specific configuration
 */
export interface OpenAiConfig extends AiProviderConfig {
  type: 'openai';
  model?: string; // Default: gpt-4
  temperature?: number; // Default: 0.7
  maxTokens?: number; // Default: 1000
  organization?: string;
}

/**
 * Anthropic specific configuration
 */
export interface AnthropicConfig extends AiProviderConfig {
  type: 'anthropic';
  model?: string; // Default: claude-2
  temperature?: number; // Default: 0.7
  maxTokens?: number; // Default: 1000
}

/**
 * Local AI provider configuration (using llama.cpp or similar)
 */
export interface LocalAiConfig extends AiProviderConfig {
  type: 'local';
  modelPath: string;
  contextSize?: number;
}

/**
 * Mock AI provider for testing
 */
export interface MockAiConfig extends AiProviderConfig {
  type: 'mock';
  responses?: Record<string, string>;
}

/**
 * Union type of all AI provider configurations
 */
export type AiConfig = OpenAiConfig | AnthropicConfig | LocalAiConfig | MockAiConfig;

/**
 * Message interface for AI communication
 */
export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Options for AI completion requests
 */
export interface CompletionOptions {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  model?: string;
}

/**
 * Result from an AI completion request
 */
export interface CompletionResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  provider?: string;
}

/**
 * Task operation types for AI
 */
export type TaskOperationType = 
  | 'summarize'
  | 'prioritize'
  | 'generate_subtasks'
  | 'tag'
  | 'analyze';

/**
 * Interface for AI providers
 */
export interface AiProvider {
  /**
   * Get the provider name
   */
  getName(): string;
  
  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;
  
  /**
   * Create a completion (text generation)
   * 
   * @param options Completion options
   * @returns Completion result
   */
  createCompletion(options: CompletionOptions): Promise<CompletionResult>;
  
  /**
   * Perform a task operation
   * 
   * @param type Operation type
   * @param data Task data
   * @param options Additional options
   * @returns Operation result
   */
  performTaskOperation(
    type: TaskOperationType,
    data: any,
    options?: any
  ): Promise<any>;
}