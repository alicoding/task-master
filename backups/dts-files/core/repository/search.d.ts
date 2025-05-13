import { BaseTaskRepository } from './base';
import { Task } from '../../db/schema';
import { SearchFilters, TaskOperationResult } from '../types';
/**
 * Search functionality for the TaskRepository
 */
export declare class TaskSearchRepository extends BaseTaskRepository {
    private nlpService;
    private nlpInitialized;
    constructor();
    /**
     * Initialize the NLP service (if not already initialized)
     * This should be called before any NLP operations
     */
    private initializeNlp;
    /**
     * Helper method to add a task (used in tests)
     * @param task Task to add
     * @returns TaskOperationResult containing the added task
     */
    addTask(task: Partial<Task>): Promise<Task>;
    /**
     * Search for tasks based on filters
     * @param filters Search filters
     * @returns TaskOperationResult containing matching tasks or error
     */
    searchTasks(filters: SearchFilters): Promise<TaskOperationResult<Task[]>>;
    /**
     * Legacy method for backward compatibility
     * @param filters Search filters
     * @returns Array of matching tasks
     */
    searchTasksLegacy(filters: SearchFilters): Promise<Task[]>;
    /**
     * Get multiple next tasks to work on
     * @param filters Search filters
     * @param count Number of tasks to return
     * @returns TaskOperationResult containing next tasks to work on
     */
    getNextTasks(filters?: SearchFilters, count?: number): Promise<TaskOperationResult<Task[]>>;
    /**
     * Legacy method for getting multiple next tasks (for backward compatibility)
     * @param filters Search filters
     * @param count Number of tasks to return
     * @returns Array of next tasks to work on
     */
    getNextTasksLegacy(filters?: SearchFilters, count?: number): Promise<Task[]>;
    /**
     * Get the next task to work on
     * @param filters Search filters
     * @returns TaskOperationResult containing the next task or error
     */
    getNextTask(filters?: SearchFilters): Promise<TaskOperationResult<Task | undefined>>;
    /**
     * Legacy method for getting the next task (for backward compatibility)
     * @param filters Search filters
     * @returns The next task or undefined if none found
     */
    getNextTaskLegacy(filters?: SearchFilters): Promise<Task | undefined>;
    /**
     * Find tasks with similar titles
     * @param title Title to search for similar tasks
     * @param useFuzzy Whether to use fuzzy matching (defaults to true)
     * @param threshold Similarity threshold (0-1, defaults to 0.3)
     * @returns TaskOperationResult containing similar tasks or error
     */
    findSimilarTasks(title: string, useFuzzy?: boolean, threshold?: number): Promise<TaskOperationResult<Task[]>>;
    /**
     * Legacy method for finding similar tasks (for backward compatibility)
     * @param title Title to search for similar tasks
     * @param useFuzzy Whether to use fuzzy matching
     * @param threshold Similarity threshold
     * @returns Array of similar tasks
     */
    findSimilarTasksLegacy(title: string, useFuzzy?: boolean, threshold?: number): Promise<Task[]>;
    /**
     * Search tasks using natural language query
     * Combines NLP-based extraction with fuzzy matching
     * @param query Natural language query
     * @param useFuzzy Whether to use fuzzy matching
     * @returns TaskOperationResult containing matching tasks with scores or error
     */
    naturalLanguageSearch(query: string, useFuzzy?: boolean): Promise<TaskOperationResult<Task[]>>;
    /**
     * Legacy method for natural language search (for backward compatibility)
     * @param query Natural language query
     * @param useFuzzy Whether to use fuzzy matching
     * @returns Array of matching tasks with scores
     */
    naturalLanguageSearchLegacy(query: string, useFuzzy?: boolean): Promise<Task[]>;
}
