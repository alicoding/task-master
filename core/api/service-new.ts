/**
 * New API Service implementation using the command architecture
 * Provides a unified service for accessing TaskMaster functionality
 */

import { commandRegistry } from './command';
import { CommandContext, InputSource, OutputMode } from './context';
import { initCommandRegistry } from './handlers/index';
import { BatchHandler } from './handlers/batch-handler';

// Add the batch handler to the registry
commandRegistry.register(new BatchHandler());

/**
 * Enhanced API Service using command architecture
 */
export class ApiService {
  private initialized = false;
  private dbPath: string;
  
  /**
   * Create a new ApiService instance
   */
  constructor(dbPath: string = './db/taskmaster.db') {
    this.dbPath = dbPath;
    this.initialize();
  }
  
  /**
   * Initialize the API service
   */
  private initialize(): void {
    if (this.initialized) return;
    
    // Initialize command registry
    initCommandRegistry();
    
    this.initialized = true;
  }
  
  /**
   * Execute a command by name
   */
  async executeCommand(
    commandName: string,
    params: any = {},
    options: {
      dryRun?: boolean;
      source?: InputSource;
      output?: OutputMode;
      outputFile?: string;
    } = {}
  ): Promise<any> {
    // Verify that the command exists
    if (!commandRegistry.has(commandName)) {
      throw new Error(`Command "${commandName}" not found`);
    }
    
    // Create execution context
    const context = new CommandContext(this.dbPath, {
      source: options.source || InputSource.Api,
      output: options.output || OutputMode.Json,
      dryRun: options.dryRun || false,
      outputFile: options.outputFile
    });
    
    try {
      // Get and execute the command
      const handler = commandRegistry.get(commandName);
      const result = await handler.execute(context, params);
      
      return result;
    } finally {
      // Clean up
      context.close();
    }
  }
  
  /**
   * Get all available commands
   */
  getAvailableCommands(): string[] {
    return commandRegistry.getCommandNames();
  }
  
  /**
   * Execute a batch of commands
   */
  async executeBatch(batch: { operations: any[] }, dryRun: boolean = false): Promise<any> {
    return await this.executeCommand('batch', {
      operations: batch.operations.map(op => ({
        command: op.type,
        params: op.data
      }))
    }, { dryRun });
  }
  
  /**
   * Export tasks with filtering options (legacy compatibility)
   */
  async exportTasks(format: string = 'json', filter?: string): Promise<any> {
    const params: any = { format };
    
    if (filter) {
      // Parse filter string (format: key:value)
      const [key, value] = filter.split(':');
      
      if (key === 'tag' || key === 'tags') {
        params.tags = [value];
      } else if (key === 'status') {
        params.status = value;
      } else if (key === 'readiness') {
        params.readiness = value;
      }
    }
    
    // Use the show command for simple exports
    return await this.executeCommand('show', params);
  }
  
  /**
   * Import tasks from an external source (legacy compatibility)
   */
  async importTasks(tasks: any[], dryRun: boolean = false): Promise<any> {
    // Convert each task to a separate add or update operation
    const operations = tasks.map(task => {
      if (task.id) {
        // Update existing task
        return {
          command: 'update',
          params: task
        };
      } else {
        // Add new task
        return {
          command: 'add',
          params: task
        };
      }
    });
    
    // Execute as batch
    return await this.executeCommand('batch', { operations }, { dryRun });
  }
  
  /**
   * Get a task by ID (legacy compatibility)
   */
  async getTask(id: string): Promise<any> {
    return (await this.executeCommand('show', { id })).result;
  }
  
  /**
   * Get all tasks (legacy compatibility)
   */
  async getAllTasks(): Promise<any> {
    return (await this.executeCommand('show', {})).result;
  }
  
  /**
   * Format task hierarchy (legacy compatibility)
   */
  async formatTaskHierarchy(format: string = 'text', options: any = {}): Promise<any> {
    const params = {
      format,
      textStyle: options.textStyle,
      jsonStyle: options.jsonStyle,
      showMetadata: options.showMetadata,
      useColor: options.useColor
    };
    
    return (await this.executeCommand('graph', params)).result;
  }
  
  /**
   * Close the API service (cleanup)
   */
  close(): void {
    // Nothing to do for now, but keeping for API compatibility
  }
}