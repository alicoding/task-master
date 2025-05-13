import { AiProvider } from './types';
import { Task } from '../types';
/**
 * AI-powered task operations
 * Provides high-level AI features for task management
 */
export declare class TaskOperations {
    private provider;
    /**
     * Create a new TaskOperations instance
     * @param provider AI provider to use
     */
    constructor(provider: AiProvider);
    /**
     * Get the AI provider
     */
    getProvider(): AiProvider;
    /**
     * Summarize a task
     *
     * @param task Task to summarize
     * @param options Additional options
     * @returns Task summary
     */
    summarizeTask(task: Task | string, options?: any): Promise<{
        summary: string;
        raw?: string;
    }>;
    /**
     * Prioritize tasks
     *
     * @param tasks Tasks to prioritize
     * @param options Additional options
     * @returns Priority assignments
     */
    prioritizeTasks(tasks: Task[] | string, options?: any): Promise<{
        priorities: Record<string, string>;
        raw?: string;
    }>;
    /**
     * Generate subtasks for a task
     *
     * @param task Parent task
     * @param options Additional options
     * @returns Generated subtasks
     */
    generateSubtasks(task: Task | string, options?: {
        count?: number;
    }): Promise<{
        parentTask: string;
        subtasks: string[];
        raw?: string;
    }>;
    /**
     * Suggest tags for a task
     *
     * @param task Task to tag
     * @param options Additional options
     * @returns Suggested tags
     */
    suggestTags(task: Task | string, options?: any): Promise<{
        tags: string[];
        raw?: string;
    }>;
    /**
     * Analyze a task
     *
     * @param task Task to analyze
     * @param options Additional options
     * @returns Task analysis
     */
    analyzeTask(task: Task | string, options?: any): Promise<{
        analysis: {
            complexity?: string;
            estimatedTime?: string;
            dependencies?: string;
            risks?: string;
            skills?: string;
            [key: string]: any;
        };
        raw: string;
    }>;
    /**
     * Generate tasks from a text description
     *
     * @param description Text description
     * @param options Additional options
     * @returns Generated tasks
     */
    generateTasksFromDescription(description: string, options?: {
        count?: number;
        format?: string;
    }): Promise<{
        tasks: Array<{
            title: string;
            status?: string;
            readiness?: string;
            tags?: string[];
            description?: string;
            subtasks?: string[];
        }>;
        raw: string;
    }>;
    /**
     * Parse tasks from AI completion
     *
     * @param completionText Completion text
     * @param format Expected format ('json' or 'text')
     * @returns Parsed tasks
     */
    private parseTasksFromCompletion;
}
