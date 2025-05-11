import { BaseAiProvider } from './base-provider.ts';
import {
  MockAiConfig,
  CompletionOptions,
  CompletionResult,
  TaskOperationType
} from './types.ts';

/**
 * Mock AI provider for testing
 * Returns predefined responses or generates simple responses locally
 */
export class MockAiProvider extends BaseAiProvider {
  private config: MockAiConfig;
  private initialized: boolean = false;
  
  // Default mock responses for different operations
  private static readonly DEFAULT_RESPONSES = {
    summarize: 'This is a summary of the task.',
    prioritize: 'Task priorities: Task 1: high, Task 2: medium, Task 3: low.',
    generate_subtasks: '1. First subtask\n2. Second subtask\n3. Third subtask',
    tag: 'Tags: #important #ui #bug',
    analyze: 'Complexity: Medium\nEstimated time: 2 hours\nDependencies: None'
  };
  
  /**
   * Create a new mock AI provider
   * @param config Mock provider configuration
   */
  constructor(config: MockAiConfig) {
    super(config);
    
    // Initialize responses with defaults and overrides
    this.config = {
      ...config,
      responses: {
        ...MockAiProvider.DEFAULT_RESPONSES,
        ...(config.responses || {})
      }
    };
  }
  
  /**
   * Get the provider name
   */
  getName(): string {
    return 'MockAI';
  }
  
  /**
   * Initialize the mock provider
   */
  async initialize(): Promise<void> {
    this.initialized = true;
    this.debug('Mock AI provider initialized');
    return Promise.resolve();
  }
  
  /**
   * Create a completion with mock responses
   * 
   * @param options Completion options
   * @returns Mock completion result
   */
  async createCompletion(options: CompletionOptions): Promise<CompletionResult> {
    this.debug('Creating mock completion', options);
    
    // Extract last user message
    const lastUserMessage = options.messages
      .reverse()
      .find(msg => msg.role === 'user')?.content || '';
    
    // Determine operation type from messages
    let operationType: TaskOperationType = 'summarize';
    
    if (lastUserMessage.includes('prioritize') || lastUserMessage.includes('priority')) {
      operationType = 'prioritize';
    } else if (lastUserMessage.includes('subtask') || lastUserMessage.includes('break down')) {
      operationType = 'generate_subtasks';
    } else if (lastUserMessage.includes('tag') || lastUserMessage.includes('categorize')) {
      operationType = 'tag';
    } else if (lastUserMessage.includes('analyze') || lastUserMessage.includes('complexity')) {
      operationType = 'analyze';
    }
    
    // Get predefined response or generate a simple mock response
    let responseText = this.config.responses[operationType] || 
                      MockAiProvider.DEFAULT_RESPONSES[operationType] ||
                      'This is a mock AI response.';
    
    // Add some task-specific details if available
    if (lastUserMessage.includes('task')) {
      const taskMatch = lastUserMessage.match(/task:?\s+([^\n\.]+)/i);
      if (taskMatch && taskMatch[1]) {
        const taskName = taskMatch[1].trim();
        responseText = responseText.replace(/task|this task/gi, `"${taskName}"`);
      }
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      text: responseText,
      usage: {
        promptTokens: this.countTokens(options.messages),
        completionTokens: this.countTokens(responseText),
        totalTokens: this.countTokens(options.messages) + this.countTokens(responseText)
      },
      model: 'mock-model',
      provider: this.getName()
    };
  }
  
  /**
   * Simple token counter for mock usage statistics
   * @param input Messages or text to count tokens for
   * @returns Estimated token count
   */
  private countTokens(input: any): number {
    if (typeof input === 'string') {
      // Roughly 4 characters per token for English
      return Math.ceil(input.length / 4);
    }
    
    if (Array.isArray(input)) {
      // If it's messages, count tokens in each message
      return input.reduce((total, msg) => {
        return total + this.countTokens(msg.content || '');
      }, 0);
    }
    
    return 0;
  }
  
  /**
   * Override the task operation method to provide mock-specific processing
   */
  async performTaskOperation(
    type: TaskOperationType,
    data: any,
    options: any = {}
  ): Promise<any> {
    this.debug(`Performing mock ${type} operation`, { data });
    
    // Pre-process data for better mock responses
    let mockData = data;
    
    // If data is a string, try to parse it as JSON
    if (typeof data === 'string' && data.trim().startsWith('{')) {
      try {
        mockData = JSON.parse(data);
      } catch (e) {
        // If parsing fails, keep original string
        mockData = data;
      }
    }
    
    // Extract task title for better mock responses
    let taskTitle = '';
    if (typeof mockData === 'object' && mockData) {
      taskTitle = mockData.title || '';
    } else if (typeof mockData === 'string') {
      const titleMatch = mockData.match(/title:?\s+([^\n\.]+)/i);
      if (titleMatch && titleMatch[1]) {
        taskTitle = titleMatch[1].trim();
      }
    }
    
    // Create mock responses based on operation type
    switch (type) {
      case 'summarize':
        return {
          summary: taskTitle 
            ? `${taskTitle} - A task that needs to be completed.`
            : 'This task involves implementing a feature or fixing an issue.'
        };
        
      case 'prioritize':
        // Mock prioritization result
        if (Array.isArray(mockData)) {
          // For array of tasks, assign different priorities
          const priorities = {};
          mockData.forEach((task, index) => {
            const id = task.id || `task-${index}`;
            const priority = index % 3 === 0 ? 'high' : (index % 3 === 1 ? 'medium' : 'low');
            priorities[id] = priority;
          });
          
          return {
            priorities,
            raw: Object.entries(priorities)
              .map(([id, priority]) => `${id}: ${priority}`)
              .join('\n')
          };
        } else {
          // For single task
          return {
            priorities: { [taskTitle || 'task']: 'medium' },
            raw: `${taskTitle || 'Task'} should be prioritized as medium.`
          };
        }
        
      case 'generate_subtasks':
        // Generate mock subtasks based on the title
        const subtasks = [];
        for (let i = 1; i <= 3; i++) {
          subtasks.push(`${taskTitle ? taskTitle + ' - ' : ''}Subtask ${i}`);
        }
        
        return {
          parentTask: taskTitle || 'Main task',
          subtasks,
          raw: subtasks.map((st, i) => `${i + 1}. ${st}`).join('\n')
        };
        
      case 'tag':
        // Generate mock tags based on the title
        const tags = [];
        if (taskTitle) {
          // Extract potential tags from title
          const words = taskTitle.toLowerCase().split(/\s+/);
          for (const word of words) {
            if (word.length > 3 && !tags.includes(word)) {
              tags.push(word);
            }
          }
        }
        
        // Add some default tags if we don't have enough
        if (tags.length < 2) {
          tags.push('task');
          if (tags.length < 2) tags.push('todo');
        }
        
        // Limit to 5 tags
        const finalTags = tags.slice(0, 5);
        
        return {
          tags: finalTags,
          raw: `Tags: ${finalTags.map(t => '#' + t).join(', ')}`
        };
        
      case 'analyze':
        // Mock task analysis
        return {
          analysis: {
            complexity: 'Medium',
            estimatedTime: '2 hours',
            dependencies: taskTitle ? `Requires understanding of ${taskTitle}` : 'None'
          },
          raw: `Complexity: Medium\nEstimated time: 2 hours\nDependencies: ${
            taskTitle ? `Requires understanding of ${taskTitle}` : 'None'
          }`
        };
        
      default:
        return {
          result: `Mock result for ${type} operation`,
          taskTitle
        };
    }
  }
}