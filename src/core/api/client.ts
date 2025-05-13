/**
 * API Client for Task Master
 * Provides a client-side interface for interacting with the TaskMaster API
 */

import {
  ApiClientConfig,
  Operation,
  BatchOperations,
  BatchResult,
  ExportResult,
  ImportResult
} from '@/core/api/types';

/**
 * Enhanced API Client for Task Master
 * Supports both legacy API endpoints and new command-based architecture
 */
export class ApiClient {
  private config: ApiClientConfig;
  private baseUrl: string;

  /**
   * Create a new API client
   * 
   * @param config Client configuration
   */
  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: 'http://localhost:3000/api',
      debug: false,
      ...config
    };

    this.baseUrl = this.config.baseUrl as string;
  }

  /**
   * Make a request to the API
   * 
   * @param endpoint API endpoint
   * @param method HTTP method
   * @param data Request data
   * @returns Response data
   */
  private async request(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    const options: RequestInit = {
      method,
      headers,
      body: data && method !== 'GET' ? JSON.stringify(data) : undefined
    };

    // For GET requests, append query parameters
    if (method === 'GET' && data) {
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, String(v)));
          } else {
            params.append(key, String(value));
          }
        }
      });
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    if (this.config.debug) {
      console.log(`[ApiClient] ${method} ${url}`, data || '');
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unknown error');
      }

      if (this.config.debug) {
        console.log(`[ApiClient] Response:`, result);
      }

      return result;
    } catch (error) {
      if (this.config.debug) {
        console.error(`[ApiClient] Error:`, error);
      }
      throw error;
    }
  }

  /**
   * Execute a command directly (new API)
   * 
   * @param command Command name
   * @param params Command parameters
   * @param options Execution options
   */
  async executeCommand(command: string, params: any = {}, options: any = {}): Promise<any> {
    return this.request(`commands/${command}`, 'POST', {
      ...params,
      dryRun: options.dryRun,
      outputFile: options.outputFile
    });
  }

  /**
   * Execute a single operation (legacy API)
   * 
   * @param operation The operation to execute
   * @param dryRun Whether to simulate the operation
   * @returns Operation result
   */
  async execute(operation: Operation, dryRun: boolean = false): Promise<any> {
    // Map to new API if possible
    if (operation.type === 'add') {
      return this.executeCommand('add', operation.data, { dryRun });
    } else if (operation.type === 'update') {
      return this.executeCommand('update', operation.data, { dryRun });
    } else if (operation.type === 'delete') {
      return this.executeCommand('remove', operation.data, { dryRun });
    } else if (operation.type === 'get') {
      return this.executeCommand('show', { id: operation.data.id }, { dryRun });
    } else if (operation.type === 'search') {
      return this.executeCommand('search', operation.data, { dryRun });
    }
    
    // Fall back to legacy endpoint
    return this.request('execute', 'POST', { operation, dryRun });
  }

  /**
   * Execute batch operations
   * 
   * @param batch The batch operations to execute
   * @param dryRun Whether to simulate the operations
   * @returns Batch result
   */
  async batch(batch: BatchOperations, dryRun: boolean = false): Promise<BatchResult> {
    // Use new batch API
    return this.request('batch', 'POST', {
      operations: batch.operations.map(op => ({
        command: op.type,
        params: op.data
      })),
      dryRun
    });
  }

  /**
   * Export tasks
   * 
   * @param format Export format
   * @param filter Filter string
   * @returns Export result
   */
  async exportTasks(format: string = 'json', filter?: string): Promise<ExportResult> {
    return this.executeCommand('show', { format, filter });
  }

  /**
   * Import tasks
   * 
   * @param tasks Tasks to import
   * @param dryRun Whether to simulate the import
   * @returns Import result
   */
  async importTasks(tasks: any[], dryRun: boolean = false): Promise<ImportResult> {
    // Convert to batch operations
    const operations = tasks.map(task => {
      if (task.id) {
        // Update
        return {
          command: 'update',
          params: task
        };
      } else {
        // Add
        return {
          command: 'add',
          params: task
        };
      }
    });
    
    return this.executeCommand('batch', { operations }, { dryRun });
  }

  /**
   * Get all tasks
   * 
   * @returns Array of tasks
   */
  async getAllTasks(): Promise<any[]> {
    const result = await this.executeCommand('show', {});
    return result.result || [];
  }

  /**
   * Get a task by ID
   * 
   * @param id Task ID
   * @returns Task
   */
  async getTask(id: string): Promise<any> {
    const result = await this.executeCommand('show', { id });
    return result.result;
  }

  /**
   * Search for tasks
   * 
   * @param query Search parameters
   * @returns Matching tasks
   */
  async searchTasks(query: any): Promise<any[]> {
    const result = await this.executeCommand('search', query);
    return result.result || [];
  }

  /**
   * Get task hierarchy
   * 
   * @param format Format of the hierarchy
   * @param options Additional options
   * @returns Formatted hierarchy
   */
  async getHierarchy(format: string = 'json', options: any = {}): Promise<any> {
    const result = await this.executeCommand('graph', {
      format,
      ...options
    });
    return result.result;
  }
  
  /**
   * Get, set, or remove task metadata
   * 
   * @param id Task ID
   * @param operation Metadata operation
   * @param field Metadata field
   * @param value Metadata value (for set and append)
   */
  async metadata(
    id: string,
    operation: 'get' | 'set' | 'remove' | 'append',
    field?: string,
    value?: any
  ): Promise<any> {
    const command = `metadata.${operation}`;
    const params: any = { id };
    
    if (field) {
      params.field = field;
    }
    
    if (value !== undefined && ['set', 'append'].includes(operation)) {
      params.value = value;
    }
    
    const result = await this.executeCommand(command, params);
    return result.result;
  }
}