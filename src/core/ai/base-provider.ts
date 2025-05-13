import {
  AiProvider,
  AiProviderConfig,
  CompletionOptions,
  CompletionResult,
  TaskOperationType,
  AiMessage
} from '@/core/ai/types';

/**
 * Abstract base class for AI providers
 * Implements common functionality and provides a template for specific providers
 */
export abstract class BaseAiProvider implements AiProvider {
  protected config: AiProviderConfig;
  protected initialized: boolean = false;

  /**
   * Create a new AI provider
   * @param config Provider configuration
   */
  constructor(config: AiProviderConfig) {
    this.config = {
      debug: false,
      timeout: 30000, // 30 seconds
      ...config
    };
  }

  /**
   * Get the provider name
   */
  abstract getName(): string;

  /**
   * Initialize the provider
   * This should be called before using the provider
   */
  async initialize(): Promise<void> {
    // Base initialization checks
    if (!this.config.apiKey && !this.isLocalProvider()) {
      throw new Error(`API key is required for ${this.getName()} provider`);
    }

    this.initialized = true;
    this.debug(`${this.getName()} provider initialized`);
  }

  /**
   * Check if the provider is initialized
   * @throws Error if not initialized
   */
  protected checkInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${this.getName()} provider is not initialized. Call initialize() first.`);
    }
  }

  /**
   * Check if this is a local provider (doesn't need API key)
   */
  protected isLocalProvider(): boolean {
    return this.config.type === 'local' || this.config.type === 'mock';
  }

  /**
   * Log debug messages if debug mode is enabled
   * @param message Debug message
   * @param data Optional data to log
   */
  protected debug(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[${this.getName()}] ${message}`);
      if (data !== undefined) {
        console.log(data);
      }
    }
  }

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
  async performTaskOperation(
    type: TaskOperationType,
    data: any,
    options: any = {}
  ): Promise<any> {
    this.checkInitialized();
    
    // Create system message based on operation type
    const systemMessage = this.createSystemPrompt(type, options);
    
    // Create user message with task data
    const userMessage = this.createUserPrompt(type, data, options);
    
    // Get completion from the AI
    const completion = await this.createCompletion({
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens,
      model: options.model || this.config.model
    });
    
    // Process the completion result based on operation type
    return this.processResult(type, completion.text, data, options);
  }

  /**
   * Create a system prompt based on the operation type
   * 
   * @param type Operation type
   * @param options Additional options
   * @returns System prompt text
   */
  protected createSystemPrompt(type: TaskOperationType, options: any = {}): string {
    switch (type) {
      case 'summarize':
        return 'You are a helpful assistant that summarizes tasks. Provide clear, concise summaries that capture the essential information while reducing length.';
        
      case 'prioritize':
        return 'You are a task prioritization assistant. Analyze the tasks and assign priorities based on importance, urgency, and impact. Explain your reasoning briefly.';
        
      case 'generate_subtasks':
        return 'You are a task breakdown specialist. Break down complex tasks into smaller, more manageable subtasks that can be completed independently.';
        
      case 'tag':
        return 'You are a task tagging assistant. Analyze the task and suggest relevant tags that categorize it appropriately.';
        
      case 'analyze':
        return 'You are a task analysis assistant. Provide insights about the task including complexity, estimated time, potential dependencies, and recommendations.';
        
      default:
        return 'You are a helpful assistant for task management.';
    }
  }

  /**
   * Create a user prompt based on the operation type and data
   * 
   * @param type Operation type
   * @param data Task data
   * @param options Additional options
   * @returns User prompt text
   */
  protected createUserPrompt(type: TaskOperationType, data: any, options: any = {}): string {
    // Convert the task data to a string representation
    const taskString = typeof data === 'string' 
      ? data 
      : JSON.stringify(data, null, 2);
    
    switch (type) {
      case 'summarize':
        return `Summarize the following task:\n\n${taskString}\n\nProvide a concise summary that captures the essential information.`;
        
      case 'prioritize':
        return `Prioritize the following tasks:\n\n${taskString}\n\nAssign priority (high, medium, low) to each task and briefly explain why.`;
        
      case 'generate_subtasks':
        return `Break down the following task into subtasks:\n\n${taskString}\n\nGenerate 3-7 subtasks that would help complete this task.`;
        
      case 'tag':
        return `Suggest appropriate tags for the following task:\n\n${taskString}\n\nProvide 2-5 relevant tags.`;
        
      case 'analyze':
        return `Analyze the following task:\n\n${taskString}\n\nProvide insights on complexity, estimated time, potential dependencies, and recommendations.`;
        
      default:
        return `Process the following task:\n\n${taskString}`;
    }
  }

  /**
   * Process the AI result based on the operation type
   * 
   * @param type Operation type
   * @param result AI completion text
   * @param originalData Original task data
   * @param options Additional options
   * @returns Processed result
   */
  protected processResult(
    type: TaskOperationType,
    result: string,
    originalData: any,
    options: any = {}
  ): any {
    switch (type) {
      case 'summarize':
        // Return the summary text directly
        return { summary: result.trim() };
        
      case 'prioritize':
        // Try to extract priority assignments
        return this.extractPriorities(result, originalData);
        
      case 'generate_subtasks':
        // Extract subtasks list
        return this.extractSubtasks(result, originalData);
        
      case 'tag':
        // Extract tags
        return this.extractTags(result);
        
      case 'analyze':
        // Return the analysis with some structure if possible
        return this.extractAnalysis(result);
        
      default:
        // For unknown operations, just return the raw result
        return { result: result.trim() };
    }
  }

  /**
   * Extract priorities from AI result
   * 
   * @param result AI completion text
   * @param originalData Original task data
   * @returns Extracted priorities
   */
  protected extractPriorities(result: string, originalData: any): any {
    // Default implementation - override in specific providers for better extraction
    const priorities: Record<string, string> = {};
    
    // Handle array of tasks
    if (Array.isArray(originalData)) {
      // Try to match task IDs or titles with priority assignments
      originalData.forEach((task: any) => {
        const id = task.id || '';
        const title = task.title || '';
        
        // Check for mentions of this task in the result
        const idRegex = new RegExp(`${id}[^a-zA-Z0-9].*?(high|medium|low)`, 'i');
        const titleRegex = new RegExp(`${escapeRegExp(title)}.*?(high|medium|low)`, 'i');
        
        const idMatch = result.match(idRegex);
        const titleMatch = result.match(titleRegex);
        
        if (idMatch && idMatch[1]) {
          priorities[id] = idMatch[1].toLowerCase();
        } else if (titleMatch && titleMatch[1]) {
          priorities[id || title] = titleMatch[1].toLowerCase();
        }
      });
    }
    
    return {
      priorities,
      raw: result.trim()
    };
  }

  /**
   * Extract subtasks from AI result
   * 
   * @param result AI completion text
   * @param originalData Original task data
   * @returns Extracted subtasks
   */
  protected extractSubtasks(result: string, originalData: any): any {
    // Simple extraction - find lines that look like tasks
    const lines = result.split('\n');
    const subtasks: string[] = [];
    
    // Look for numbered or bulleted lists
    for (const line of lines) {
      const trimmed = line.trim();
      // Match numbered lists (1. Task) or bulleted lists (- Task, * Task)
      if (/^(\d+[\.\)]\s+|\-\s+|\*\s+)(.+)$/.test(trimmed)) {
        // Extract just the task text, removing the prefix
        const taskText = trimmed.replace(/^(\d+[\.\)]\s+|\-\s+|\*\s+)/, '').trim();
        if (taskText) {
          subtasks.push(taskText);
        }
      }
    }
    
    return {
      parentTask: typeof originalData === 'object' ? originalData.title || originalData.id : originalData,
      subtasks,
      raw: result.trim()
    };
  }

  /**
   * Extract tags from AI result
   * 
   * @param result AI completion text
   * @returns Extracted tags
   */
  protected extractTags(result: string): any {
    // Extract tags from the result
    const tags: string[] = [];
    
    // Try to find tags in various formats
    // Look for words preceded by # (hashtags)
    const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = hashtagRegex.exec(result)) !== null) {
      tags.push(match[1].toLowerCase());
    }
    
    // If no hashtags found, look for bullet points or comma-separated lists
    if (tags.length === 0) {
      const lines = result.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Check for bullet points
        if (/^(\-\s+|\*\s+)(.+)$/.test(trimmed)) {
          const tag = trimmed.replace(/^(\-\s+|\*\s+)/, '').trim().toLowerCase();
          if (tag && !tags.includes(tag)) {
            tags.push(tag);
          }
        }
        
        // Check for comma-separated lists
        if (trimmed.includes(',')) {
          const parts = trimmed.split(',');
          for (const part of parts) {
            const tag = part.trim().toLowerCase();
            // Only include short tags (likely to be actual tags, not sentences)
            if (tag && tag.length < 20 && !tags.includes(tag)) {
              tags.push(tag);
            }
          }
        }
      }
    }
    
    // Normalize tags (remove periods, etc.)
    const normalizedTags = tags.map(tag => 
      tag.replace(/[\.\s]+$/, '')  // Remove trailing periods and spaces
        .replace(/[\"\']+/g, '')   // Remove quotes
        .toLowerCase()
    );
    
    return {
      tags: [...new Set(normalizedTags)],  // Remove duplicates
      raw: result.trim()
    };
  }

  /**
   * Extract analysis from AI result
   * 
   * @param result AI completion text
   * @returns Structured analysis
   */
  protected extractAnalysis(result: string): any {
    // Try to extract structured information from the analysis
    const analysis: Record<string, string> = {};
    
    // Look for common sections in the analysis
    const complexityMatch = result.match(/complexity:?\s*([^\n\.]+)/i);
    if (complexityMatch && complexityMatch[1]) {
      analysis.complexity = complexityMatch[1].trim();
    }
    
    const timeMatch = result.match(/time:?\s*([^\n\.]+)/i) || 
                      result.match(/estimated time:?\s*([^\n\.]+)/i) ||
                      result.match(/duration:?\s*([^\n\.]+)/i);
    if (timeMatch && timeMatch[1]) {
      analysis.estimatedTime = timeMatch[1].trim();
    }
    
    const dependenciesMatch = result.match(/dependencies:?\s*([^\n\.]+)/i);
    if (dependenciesMatch && dependenciesMatch[1]) {
      analysis.dependencies = dependenciesMatch[1].trim();
    }
    
    return {
      analysis,
      raw: result.trim()
    };
  }
}

/**
 * Escape special characters in a string for use in a regular expression
 * @param string String to escape
 * @returns Escaped string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}