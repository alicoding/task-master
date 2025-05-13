/**
 * ApiRouter handles HTTP API requests
 * This is a simple abstraction for HTTP frameworks like Express
 */
export default class ApiRouter {
    private apiService;
    /**
     * Create a new API router
     *
     * @param dbPath Path to the database file
     */
    constructor(dbPath?: string);
    /**
     * Close the database connection
     */
    close(): void;
    /**
     * Handle execute operation request
     *
     * @param operation The operation to execute
     * @param dryRun Whether to simulate the operation
     * @returns Operation result
     */
    handleExecute(operation: any, dryRun?: boolean): Promise<any>;
    /**
     * Handle batch operations request
     *
     * @param batch The batch operations
     * @param dryRun Whether to simulate the operations
     * @returns Batch result
     */
    handleBatch(batch: any, dryRun?: boolean): Promise<any>;
    /**
     * Handle export request
     *
     * @param format Export format
     * @param filter Filter string
     * @returns Export result
     */
    handleExport(format?: string, filter?: string): Promise<any>;
    /**
     * Handle import request
     *
     * @param tasks Tasks to import
     * @param dryRun Whether to simulate the import
     * @returns Import result
     */
    handleImport(tasks: any[], dryRun?: boolean): Promise<any>;
    /**
     * Handle get all tasks request
     *
     * @returns All tasks
     */
    handleGetAllTasks(): Promise<any>;
    /**
     * Handle get task request
     *
     * @param id Task ID
     * @returns Task
     */
    handleGetTask(id: string): Promise<any>;
    /**
     * Handle search request
     *
     * @param query Search parameters
     * @returns Matching tasks
     */
    handleSearch(query: any): Promise<any>;
    /**
     * Handle hierarchy request
     *
     * @param format Format of the hierarchy
     * @param options Additional options
     * @returns Formatted hierarchy
     */
    handleHierarchy(format?: string, options?: any): Promise<any>;
    /**
     * Create an Express router
     * This is a helper method for Express.js integration
     *
     * @returns An object that can be attached to Express
     */
    createExpressRouter(): any;
}
