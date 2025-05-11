/**
 * Improved API Router for Task Master
 * Handles HTTP API requests using the command architecture
 */

import { commandRegistry } from './command.ts';
import { initCommandRegistry } from './handlers/index.ts';
import { CommandContext, InputSource, OutputMode } from './context.ts';

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
export class ApiRouter {
  private endpoints: EndpointDefinition[] = [];
  private initialized = false;
  
  /**
   * Create a new API router
   */
  constructor() {
    // Ensure the command registry is initialized
    this.initialize();
  }
  
  /**
   * Initialize the router and command registry
   */
  private initialize(): void {
    if (this.initialized) return;
    
    // Initialize the command registry
    initCommandRegistry();
    
    // Register default API endpoints
    this.registerDefaultEndpoints();
    
    this.initialized = true;
  }
  
  /**
   * Register default API endpoints
   */
  private registerDefaultEndpoints(): void {
    // Core task operations
    this.registerEndpoint({
      path: '/tasks',
      method: 'GET',
      command: 'show',
      description: 'Get all tasks'
    });
    
    this.registerEndpoint({
      path: '/tasks/:id',
      method: 'GET',
      command: 'show',
      description: 'Get a specific task'
    });
    
    this.registerEndpoint({
      path: '/tasks',
      method: 'POST',
      command: 'add',
      description: 'Create a new task'
    });
    
    this.registerEndpoint({
      path: '/tasks/:id',
      method: 'PUT',
      command: 'update',
      description: 'Update a task'
    });
    
    this.registerEndpoint({
      path: '/tasks/:id',
      method: 'DELETE',
      command: 'remove',
      description: 'Delete a task'
    });
    
    // Search
    this.registerEndpoint({
      path: '/tasks/search',
      method: 'POST',
      command: 'search',
      description: 'Search for tasks'
    });
    
    // Visualization
    this.registerEndpoint({
      path: '/graph',
      method: 'GET',
      command: 'graph',
      description: 'Get task graph'
    });
    
    this.registerEndpoint({
      path: '/deps',
      method: 'GET',
      command: 'deps',
      description: 'Get task dependencies'
    });
    
    // Task operations
    this.registerEndpoint({
      path: '/tasks/merge',
      method: 'POST',
      command: 'merge',
      description: 'Merge two tasks together'
    });
    
    // Metadata operations
    this.registerEndpoint({
      path: '/tasks/:id/metadata',
      method: 'GET',
      command: 'metadata.get',
      description: 'Get task metadata'
    });
    
    this.registerEndpoint({
      path: '/tasks/:id/metadata/:field',
      method: 'GET',
      command: 'metadata.get',
      description: 'Get a specific metadata field'
    });
    
    this.registerEndpoint({
      path: '/tasks/:id/metadata/:field',
      method: 'PUT',
      command: 'metadata.set',
      description: 'Set a metadata field'
    });
    
    this.registerEndpoint({
      path: '/tasks/:id/metadata/:field',
      method: 'DELETE',
      command: 'metadata.remove',
      description: 'Remove a metadata field'
    });
    
    this.registerEndpoint({
      path: '/tasks/:id/metadata/:field/append',
      method: 'POST',
      command: 'metadata.append',
      description: 'Append to a metadata field'
    });
    
    // Batch operations
    this.registerEndpoint({
      path: '/batch',
      method: 'POST',
      command: 'batch',
      description: 'Execute batch operations'
    });
    
    // Command execution
    this.registerEndpoint({
      path: '/commands/:command',
      method: 'POST',
      command: 'execute',
      description: 'Execute any registered command'
    });
  }
  
  /**
   * Register a new API endpoint
   */
  registerEndpoint(endpoint: EndpointDefinition): void {
    this.endpoints.push(endpoint);
  }
  
  /**
   * Get all registered endpoints
   */
  getEndpoints(): EndpointDefinition[] {
    return this.endpoints;
  }
  
  /**
   * Execute a command through the API
   */
  async executeCommand(
    commandName: string,
    params: any,
    options: { dryRun?: boolean, outputFile?: string } = {}
  ): Promise<any> {
    // Verify that the command exists
    if (!commandRegistry.has(commandName)) {
      return {
        success: false,
        error: `Command "${commandName}" not found`,
        timestamp: new Date().toISOString()
      };
    }
    
    // Create execution context for API use
    const context = new CommandContext('./db/taskmaster.db', {
      source: InputSource.Api,
      output: OutputMode.Json,
      dryRun: options.dryRun,
      outputFile: options.outputFile
    });
    
    try {
      // Get and execute the command
      const handler = commandRegistry.get(commandName);
      const result = await handler.execute(context, params);
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        command: commandName
      };
    } finally {
      // Clean up
      context.close();
    }
  }
  
  /**
   * Handle API request (abstract function for different web frameworks)
   */
  async handleRequest(
    method: HttpMethod,
    path: string,
    body: any,
    query: any
  ): Promise<any> {
    // Find matching endpoint
    const endpoint = this.findEndpoint(method, path);
    
    if (!endpoint) {
      return {
        success: false,
        error: `Endpoint not found: ${method} ${path}`,
        timestamp: new Date().toISOString()
      };
    }
    
    // Extract path parameters
    const pathParams = this.extractPathParams(endpoint.path, path);
    
    // Combine parameters from different sources
    const params = {
      ...query,
      ...pathParams,
      ...body
    };
    
    // Execute the associated command
    return this.executeCommand(endpoint.command, params, {
      dryRun: params.dryRun === 'true' || params.dryRun === true
    });
  }
  
  /**
   * Find matching endpoint definition for a request
   */
  private findEndpoint(method: HttpMethod, path: string): EndpointDefinition | undefined {
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    
    // First try direct match
    const directMatch = this.endpoints.find(e => 
      e.method === method && e.path === normalizedPath);
    
    if (directMatch) return directMatch;
    
    // Then try matching with path parameters
    for (const endpoint of this.endpoints) {
      if (endpoint.method !== method) continue;
      
      // Check if path matches the pattern
      if (this.pathMatchesPattern(endpoint.path, normalizedPath)) {
        return endpoint;
      }
    }
    
    return undefined;
  }
  
  /**
   * Check if a path matches a pattern with parameters
   */
  private pathMatchesPattern(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);
    
    if (patternParts.length !== pathParts.length) return false;
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      
      // Skip parameters (they match anything)
      if (patternPart.startsWith(':')) continue;
      
      // Check exact match for non-parameter parts
      if (patternPart !== pathParts[i]) return false;
    }
    
    return true;
  }
  
  /**
   * Extract path parameters from a URL
   */
  private extractPathParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      
      // Extract parameter name and value
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathParts[i];
      }
    }
    
    return params;
  }
  
  /**
   * Create an Express router (integration point for Express.js)
   */
  createExpressRouter(): any {
    // This is a placeholder that should be implemented when Express is available
    const expressRouter = {
      get: (path: string, handler: Function) => {},
      post: (path: string, handler: Function) => {},
      put: (path: string, handler: Function) => {},
      delete: (path: string, handler: Function) => {}
    };
    
    // Here we would register routes with Express
    // Something like this (pseudo-code):
    /*
    this.endpoints.forEach(endpoint => {
      const method = endpoint.method.toLowerCase();
      expressRouter[method](endpoint.path, async (req, res) => {
        const result = await this.handleRequest(
          endpoint.method,
          req.path,
          req.body,
          req.query
        );
        res.json(result);
      });
    });
    */
    
    return expressRouter;
  }
}