import {
  AiProvider,
  TaskOperationType,
  CompletionOptions,
  CompletionResult
} from '@/core/ai/types';
import { Task } from '@/core/types';

/**
 * AI-powered task operations
 * Provides high-level AI features for task management
 */
export class TaskOperations {
  private provider: AiProvider;

  /**
   * Create a new TaskOperations instance
   * @param provider AI provider to use
   */
  constructor(provider: AiProvider) {
    this.provider = provider;
  }

  /**
   * Get the AI provider
   */
  getProvider(): AiProvider {
    return this.provider;
  }

  /**
   * Summarize a task
   *
   * @param task Task to summarize
   * @param options Additional options
   * @returns Task summary
   */
  async summarizeTask(
    task: Task | string,
    options: any = {}
  ): Promise<{ summary: string; raw?: string }> {
    // Add improved system prompt for better summaries
    const opts = {
      ...options,
      systemPrompt: options.systemPrompt ||
        'You are a task summarization expert. Create clear, concise summaries that capture the essential information while reducing length. Focus on objectives, key details, and expected outcomes.'
    };

    const result = await this.provider.performTaskOperation('summarize', task, opts);
    return result;
  }

  /**
   * Prioritize tasks
   *
   * @param tasks Tasks to prioritize
   * @param options Additional options
   * @returns Priority assignments
   */
  async prioritizeTasks(
    tasks: Task[] | string,
    options: any = {}
  ): Promise<{ priorities: Record<string, string>, raw?: string }> {
    // Add improved system prompt for better prioritization
    const opts = {
      ...options,
      systemPrompt: options.systemPrompt ||
        'You are a task prioritization specialist. Analyze the tasks and assign priorities (high, medium, low) based on importance, urgency, impact, and dependencies. Consider business value, deadlines, blockers, and resource requirements.'
    };

    return this.provider.performTaskOperation('prioritize', tasks, opts);
  }

  /**
   * Generate subtasks for a task
   *
   * @param task Parent task
   * @param options Additional options
   * @returns Generated subtasks
   */
  async generateSubtasks(
    task: Task | string,
    options: { count?: number } = {}
  ): Promise<{ parentTask: string, subtasks: string[], raw?: string }> {
    // Create options with default count
    const count = options.count || 5;
    const opts = {
      ...options,
      count,
      // Create a more specific system prompt for better subtasks
      systemPrompt: options.systemPrompt ||
        `You are a task breakdown specialist. Break down complex tasks into ${count} smaller, more manageable subtasks that are:
1. Specific and actionable
2. Roughly equal in size/effort
3. Independent enough to be assigned to different people
4. Concrete rather than abstract
5. Ordered by logical sequence

Each subtask should be 2-10 words, clear, and start with a verb.`
    };

    return this.provider.performTaskOperation('generate_subtasks', task, opts);
  }

  /**
   * Suggest tags for a task
   *
   * @param task Task to tag
   * @param options Additional options
   * @returns Suggested tags
   */
  async suggestTags(
    task: Task | string,
    options: any = {}
  ): Promise<{ tags: string[], raw?: string }> {
    // Add improved system prompt for better tag suggestions
    const opts = {
      ...options,
      systemPrompt: options.systemPrompt ||
        'You are a task categorization expert. Suggest relevant tags that accurately categorize the task. Tags should be single words or short phrases that help with filtering and organization. Consider technical areas, skills required, task type, priority, and domain.'
    };

    return this.provider.performTaskOperation('tag', task, opts);
  }

  /**
   * Analyze a task
   *
   * @param task Task to analyze
   * @param options Additional options
   * @returns Task analysis
   */
  async analyzeTask(
    task: Task | string,
    options: any = {}
  ): Promise<{
    analysis: {
      complexity?: string;
      estimatedTime?: string;
      dependencies?: string;
      risks?: string;
      skills?: string;
      [key: string]: any;
    },
    raw: string
  }> {
    // Add improved system prompt for better analysis
    const opts = {
      ...options,
      systemPrompt: options.systemPrompt ||
        'You are a task analysis expert. Analyze the task to provide insights about complexity, estimated time, dependencies, potential risks, required skills, and recommendations. Be specific and actionable in your analysis.'
    };

    return this.provider.performTaskOperation('analyze', task, opts);
  }
  
  /**
   * Generate tasks from a text description
   *
   * @param description Text description
   * @param options Additional options
   * @returns Generated tasks
   */
  async generateTasksFromDescription(
    description: string,
    options: { count?: number; format?: string } = {}
  ): Promise<{
    tasks: Array<{
      title: string;
      status?: string;
      readiness?: string;
      tags?: string[];
      description?: string;
      subtasks?: string[];
    }>;
    raw: string;
  }> {
    // Set default count
    const count = options.count || 5;
    const format = options.format || 'json';

    // Create an improved system prompt for better task generation
    const systemPrompt = options.systemPrompt ||
      `You are a task planning specialist who converts descriptions into structured tasks. For the following description, create ${count} well-defined, actionable tasks. For each task:
1. Write a clear title (starting with a verb, 2-8 words)
2. Add a brief description explaining what needs to be done and why
3. Suggest 2-5 appropriate tags for categorization
4. Set status to "todo"
5. Set readiness to "draft" or "ready" (use "blocked" only if the task depends on something else)

${format === 'json' ? 'Format the tasks as a JSON array, with each task as an object containing title, description, tags, status, and readiness fields.' : 'Format each task with Title, Status, Readiness, Tags, and Description on separate lines.'}

Tasks should be concrete, specific, and independently actionable. Break down large tasks into smaller ones.`;

    // Create user prompt
    const userPrompt = `Generate ${count} tasks from the following description:\n\n"${description}"`;

    // Get completion from the AI provider
    const completion = await this.provider.createCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 2000,
      model: options.model
    });

    // Process the completion to extract tasks
    const tasks = this.parseTasksFromCompletion(completion.text, format);

    return {
      tasks,
      raw: completion.text
    };
  }

  /**
   * Parse tasks from AI completion
   *
   * @param completionText Completion text
   * @param format Expected format ('json' or 'text')
   * @returns Parsed tasks
   */
  private parseTasksFromCompletion(
    completionText: string,
    format: string = 'json'
  ): Array<{
    title: string;
    status?: string;
    readiness?: string;
    tags?: string[];
    description?: string;
    subtasks?: string[];
  }> {
    // Try to parse as JSON first
    if (format === 'json') {
      try {
        // Look for a JSON array in the response
        const jsonMatch = completionText.match(/\[\s*{[\s\S]*}\s*\]/);

        if (jsonMatch) {
          const jsonText = jsonMatch[0];
          const tasks = JSON.parse(jsonText);

          // Validate and normalize
          return tasks.map(task => ({
            title: task.title || 'Untitled task',
            status: task.status?.toLowerCase() || 'todo',
            readiness: task.readiness?.toLowerCase() || 'draft',
            tags: Array.isArray(task.tags) ? task.tags :
                 (typeof task.tags === 'string' ? task.tags.split(',').map(t => t.trim()) : []),
            description: task.description || '',
            subtasks: Array.isArray(task.subtasks) ? task.subtasks : []
          }));
        }
      } catch (e) {
        // If JSON parsing fails, fall back to text parsing
        console.error('Failed to parse JSON from completion, falling back to text parsing', e);
      }
    }

    // Text parsing fallback
    const tasks = [];
    const lines = completionText.split('\n');

    let currentTask: any = null;
    let inSubtasks = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Check for task title pattern (Task N:, N., or similar)
      const taskTitleMatch = line.match(/^(task\s+\d+:|^\d+\.|task:)/i);

      if (taskTitleMatch || (i === 0 && line.length < 100)) {
        // If we already have a task, push it to the array
        if (currentTask) {
          tasks.push(currentTask);
        }

        // Start a new task
        currentTask = {
          title: line.replace(/^(task\s+\d+:|^\d+\.|task:)/i, '').trim(),
          status: 'todo',
          readiness: 'draft'
        };
        inSubtasks = false;
        continue;
      }

      // If we don't have a current task, start one with this line as title
      if (!currentTask) {
        currentTask = {
          title: line,
          status: 'todo',
          readiness: 'draft'
        };
        continue;
      }

      // Look for specific task properties
      if (line.toLowerCase().startsWith('title:')) {
        currentTask.title = line.substring(6).trim();
      } else if (line.toLowerCase().startsWith('status:')) {
        currentTask.status = line.substring(7).trim().toLowerCase();
      } else if (line.toLowerCase().startsWith('readiness:')) {
        currentTask.readiness = line.substring(10).trim().toLowerCase();
      } else if (line.toLowerCase().startsWith('tags:')) {
        currentTask.tags = line.substring(5).trim()
          .split(/,\s*/)
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag);
      } else if (line.toLowerCase().startsWith('description:')) {
        currentTask.description = line.substring(12).trim();
      } else if (line.toLowerCase().startsWith('subtasks:')) {
        currentTask.subtasks = [];
        inSubtasks = true;
      } else if (inSubtasks && (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./))) {
        // This is a subtask bullet point
        const subtask = line.replace(/^(-|\*|\d+\.)\s*/, '').trim();
        currentTask.subtasks.push(subtask);
      } else if (currentTask.description) {
        // Append to existing description if it's not a special line
        currentTask.description += ' ' + line;
      } else {
        // If we can't categorize the line and don't have a description yet, use it as the description
        currentTask.description = line;
      }
    }

    // Add the last task if there is one
    if (currentTask) {
      tasks.push(currentTask);
    }

    return tasks;
  }
}