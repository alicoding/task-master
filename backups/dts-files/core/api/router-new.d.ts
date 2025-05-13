/**
 * Improved API Router for Task Master
 * Handles HTTP API requests using the command architecture
 */
/**
 * HTTP request method types
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
/**
 * Endpoint definition for API
 */
interface EndpointDefinition {
    path: string;
    method: HttpMethod;
    command: string;
    description: string;
}
/**
 * Enhanced API Router with command-based architecture
 */
export declare class ApiRouter {
    private endpoints;
    private initialized;
    /**
     * Create a new API router
     */
    constructor();
    /**
     * Initialize the router and command registry
     */
    private initialize;
    /**
     * Register default API endpoints
     */
    private registerDefaultEndpoints;
    /**
     * Register a new API endpoint
     */
    registerEndpoint(endpoint: EndpointDefinition): void;
    /**
     * Get all registered endpoints
     */
    getEndpoints(): EndpointDefinition[];
    /**
     * Execute a command through the API
     */
    executeCommand(commandName: string, params: any, options?: {
        dryRun?: boolean;
        outputFile?: string;
    }): Promise<any>;
    /**
     * Handle API request (abstract function for different web frameworks)
     */
    handleRequest(method: HttpMethod, path: string, body: any, query: any): Promise<any>;
    /**
     * Find matching endpoint definition for a request
     */
    private findEndpoint;
    /**
     * Check if a path matches a pattern with parameters
     */
    private pathMatchesPattern;
    /**
     * Extract path parameters from a URL
     */
    private extractPathParams;
    /**
     * Create an Express router (integration point for Express.js)
     */
    createExpressRouter(): any;
}
export {};
