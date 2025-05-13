/**
 * API Client for Task Master
 * Provides a client-side interface for interacting with the TaskMaster API
 */
import { ApiClientConfig, Operation, BatchOperations, BatchResult, ExportResult, ImportResult } from './types';
/**
 * Enhanced API Client for Task Master
 * Supports both legacy API endpoints and new command-based architecture
 */
export declare class ApiClient {
    private config;
    private baseUrl;
    /**
     * Create a new API client
     *
     * @param config Client configuration
     */
    constructor(config?: ApiClientConfig);
    /**
     * Make a request to the API
     *
     * @param endpoint API endpoint
     * @param method HTTP method
     * @param data Request data
     * @returns Response data
     */
    private request;
    /**
     * Execute a command directly (new API)
     *
     * @param command Command name
     * @param params Command parameters
     * @param options Execution options
     */
    executeCommand(command: string, params?: any, options?: any): Promise<any>;
    /**
     * Execute a single operation (legacy API)
     *
     * @param operation The operation to execute
     * @param dryRun Whether to simulate the operation
     * @returns Operation result
     */
    execute(operation: Operation, dryRun?: boolean): Promise<any>;
    /**
     * Execute batch operations
     *
     * @param batch The batch operations to execute
     * @param dryRun Whether to simulate the operations
     * @returns Batch result
     */
    batch(batch: BatchOperations, dryRun?: boolean): Promise<BatchResult>;
    /**
     * Export tasks
     *
     * @param format Export format
     * @param filter Filter string
     * @returns Export result
     */
    exportTasks(format?: string, filter?: string): Promise<ExportResult>;
    /**
     * Import tasks
     *
     * @param tasks Tasks to import
     * @param dryRun Whether to simulate the import
     * @returns Import result
     */
    importTasks(tasks: any[], dryRun?: boolean): Promise<ImportResult>;
    /**
     * Get all tasks
     *
     * @returns Array of tasks
     */
    getAllTasks(): Promise<any[]>;
    /**
     * Get a task by ID
     *
     * @param id Task ID
     * @returns Task
     */
    getTask(id: string): Promise<any>;
    /**
     * Search for tasks
     *
     * @param query Search parameters
     * @returns Matching tasks
     */
    searchTasks(query: any): Promise<any[]>;
    /**
     * Get task hierarchy
     *
     * @param format Format of the hierarchy
     * @param options Additional options
     * @returns Formatted hierarchy
     */
    getHierarchy(format?: string, options?: any): Promise<any>;
    /**
     * Get, set, or remove task metadata
     *
     * @param id Task ID
     * @param operation Metadata operation
     * @param field Metadata field
     * @param value Metadata value (for set and append)
     */
    metadata(id: string, operation: 'get' | 'set' | 'remove' | 'append', field?: string, value?: any): Promise<any>;
}
