/**
 * Legacy API Service implementation maintained for backward compatibility
 * Modified to remove file tracking dependencies
 * @deprecated Use service-new.ts instead which uses the command architecture
 */
import { Task, TaskWithChildren } from '../types';
import { Operation, BatchOperations, BatchResult, ExportResult, ImportResult, OperationResult } from './types';
/**
 * ApiService provides a centralized service for accessing Task Master functionality
 * This service is used by both the CLI commands and can be used by UI/external integrations
 * @deprecated Use NewApiService from service-new.ts instead
 */
export declare class ApiService {
    private repo;
    private graph;
    private newService;
    /**
     * Create a new ApiService instance
     *
     * @param dbPath Path to the database file
     * @param inMemory Use in-memory database (for testing)
     * @param legacy Use legacy mode (for compatibility with tests)
     */
    constructor(dbPath?: string, inMemory?: boolean, legacy?: boolean);
    /**
     * Close the database connection
     */
    close(): void;
    /**
     * Execute a single operation
     *
     * @param operation The operation to execute
     * @param dryRun Whether to simulate the operation without making changes
     * @returns The result of the operation
     */
    executeOperation(operation: Operation, dryRun?: boolean): Promise<OperationResult>;
    /**
     * Execute multiple operations in a batch
     *
     * @param batch The batch operations to execute
     * @param dryRun Whether to simulate the operations without making changes
     * @returns Results of batch execution
     */
    executeBatch(batch: BatchOperations, dryRun?: boolean): Promise<BatchResult>;
    /**
     * Export tasks with filtering options
     *
     * @param format The format of the export
     * @param filter Filter string in the format key:value
     * @returns The exported tasks
     */
    exportTasks(format?: string, filter?: string): Promise<ExportResult>;
    /**
     * Import tasks from an external source
     *
     * @param tasks Array of tasks to import
     * @param dryRun Whether to simulate the import without making changes
     * @returns Results of the import operation
     */
    importTasks(tasks: Task[], dryRun?: boolean): Promise<ImportResult>;
    /**
     * Get a task by ID
     *
     * @param id Task ID
     * @returns The task
     */
    getTask(id: string): Promise<Task>;
    /**
     * Get all tasks
     *
     * @returns Array of all tasks
     */
    getAllTasks(): Promise<Task[]>;
    /**
     * Build the task hierarchy
     *
     * @returns Hierarchical task structure
     */
    getTaskHierarchy(): Promise<TaskWithChildren[]>;
    /**
     * Format the task hierarchy in various formats
     *
     * @param format The format to use
     * @param options Additional options for formatting
     * @returns Formatted hierarchy
     */
    formatTaskHierarchy(format?: string, options?: any): Promise<string | object>;
}
