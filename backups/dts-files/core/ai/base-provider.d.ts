import { AiProvider, AiProviderConfig, CompletionOptions, CompletionResult, TaskOperationType } from './types';
/**
 * Abstract base class for AI providers
 * Implements common functionality and provides a template for specific providers
 */
export declare abstract class BaseAiProvider implements AiProvider {
    protected config: AiProviderConfig;
    protected initialized: boolean;
    /**
     * Create a new AI provider
     * @param config Provider configuration
     */
    constructor(config: AiProviderConfig);
    /**
     * Get the provider name
     */
    abstract getName(): string;
    /**
     * Initialize the provider
     * This should be called before using the provider
     */
    initialize(): Promise<void>;
    /**
     * Check if the provider is initialized
     * @throws Error if not initialized
     */
    protected checkInitialized(): void;
    /**
     * Check if this is a local provider (doesn't need API key)
     */
    protected isLocalProvider(): boolean;
    /**
     * Log debug messages if debug mode is enabled
     * @param message Debug message
     * @param data Optional data to log
     */
    protected debug(message: string, data?: any): void;
    /**
     * Create a completion (text generation)
     * Must be implemented by specific providers
     *
     * @param options Completion options
     * @returns Completion result
     */
    abstract createCompletion(options: CompletionOptions): Promise<CompletionResult>;
    /**
     * Perform a task operation using the AI provider
     *
     * @param type Operation type
     * @param data Task data
     * @param options Additional options
     * @returns Operation result
     */
    performTaskOperation(type: TaskOperationType, data: any, options?: any): Promise<any>;
    /**
     * Create a system prompt based on the operation type
     *
     * @param type Operation type
     * @param options Additional options
     * @returns System prompt text
     */
    protected createSystemPrompt(type: TaskOperationType, options?: any): string;
    /**
     * Create a user prompt based on the operation type and data
     *
     * @param type Operation type
     * @param data Task data
     * @param options Additional options
     * @returns User prompt text
     */
    protected createUserPrompt(type: TaskOperationType, data: any, options?: any): string;
    /**
     * Process the AI result based on the operation type
     *
     * @param type Operation type
     * @param result AI completion text
     * @param originalData Original task data
     * @param options Additional options
     * @returns Processed result
     */
    protected processResult(type: TaskOperationType, result: string, originalData: any, options?: any): any;
    /**
     * Extract priorities from AI result
     *
     * @param result AI completion text
     * @param originalData Original task data
     * @returns Extracted priorities
     */
    protected extractPriorities(result: string, originalData: any): any;
    /**
     * Extract subtasks from AI result
     *
     * @param result AI completion text
     * @param originalData Original task data
     * @returns Extracted subtasks
     */
    protected extractSubtasks(result: string, originalData: any): any;
    /**
     * Extract tags from AI result
     *
     * @param result AI completion text
     * @returns Extracted tags
     */
    protected extractTags(result: string): any;
    /**
     * Extract analysis from AI result
     *
     * @param result AI completion text
     * @returns Structured analysis
     */
    protected extractAnalysis(result: string): any;
}
