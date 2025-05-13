/**
 * New API Service implementation using the command architecture
 * Provides a unified service for accessing TaskMaster functionality
 */
import { InputSource, OutputMode } from './context';
/**
 * Enhanced API Service using command architecture
 */
export declare class ApiService {
    private initialized;
    private dbPath;
    /**
     * Create a new ApiService instance
     */
    constructor(dbPath?: string);
    /**
     * Initialize the API service
     */
    private initialize;
    /**
     * Execute a command by name
     */
    executeCommand(commandName: string, params?: any, options?: {
        dryRun?: boolean;
        source?: InputSource;
        output?: OutputMode;
        outputFile?: string;
    }): Promise<any>;
    /**
     * Get all available commands
     */
    getAvailableCommands(): string[];
    /**
     * Execute a batch of commands
     */
    executeBatch(batch: {
        operations: any[];
    }, dryRun?: boolean): Promise<any>;
    /**
     * Export tasks with filtering options (legacy compatibility)
     */
    exportTasks(format?: string, filter?: string): Promise<any>;
    /**
     * Import tasks from an external source (legacy compatibility)
     */
    importTasks(tasks: any[], dryRun?: boolean): Promise<any>;
    /**
     * Get a task by ID (legacy compatibility)
     */
    getTask(id: string): Promise<any>;
    /**
     * Get all tasks (legacy compatibility)
     */
    getAllTasks(): Promise<any>;
    /**
     * Format task hierarchy (legacy compatibility)
     */
    formatTaskHierarchy(format?: string, options?: any): Promise<any>;
    /**
     * Close the API service (cleanup)
     */
    close(): void;
}
