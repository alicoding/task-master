/**
 * Clean API Service implementation with file tracking dependencies removed
 */

import { TaskRepository } from '../repo';
import { TaskGraph } from '../graph';
import { Task, TaskWithChildren } from '../types';
import {
  Operation,
  BatchOperations,
  BatchResult,
  ExportResult,
  ImportResult,
  OperationResult
} from './types';

/**
 * ApiService provides a centralized service for accessing Task Master functionality
 * This service is used by both the CLI commands and can be used by UI/external integrations
 */
export class ApiService {
  private repo: TaskRepository;
  private graph: TaskGraph;

  /**
   * Create a new ApiService instance
   * 
   * @param dbPath Path to the database file
   * @param inMemory Use in-memory database (for testing)
   * @param legacy Use legacy mode (for compatibility with tests)
   */
  constructor(dbPath: string = './db/taskmaster.db', inMemory: boolean = false, legacy: boolean = false) {
    this.repo = new TaskRepository(dbPath, inMemory, legacy);
    this.graph = new TaskGraph(this.repo);
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.repo.close();
  }

  /**
   * Execute a single operation
   * 
   * @param operation The operation to execute
   * @param dryRun Whether to simulate the operation without making changes
   * @returns The result of the operation
   */
  async executeOperation(operation: Operation, dryRun: boolean = false): Promise<OperationResult> {
    try {
      if (!operation.type || !operation.data) {
        return {
          operation,
          status: 'skipped',
          error: 'Missing type or data'
        };
      }

      // Simulate operation if dry run is enabled
      if (dryRun) {
        return {
          operation,
          status: 'simulated',
          result: 'Dry run - no changes made'
        };
      }

      let result: any = null;

      // Execute operation based on type
      switch (operation.type) {
        case 'add':
          result = await this.repo.createTask(operation.data);
          break;
        case 'update':
          result = await this.repo.updateTask(operation.data);
          break;
        case 'delete':
          result = await this.repo.removeTask(operation.data.id);
          break;
        case 'get':
          result = await this.repo.getTask(operation.data.id);
          break;
        case 'search':
          result = await this.repo.searchTasks(operation.data);
          break;
        case 'export':
          result = await this.exportTasks(
            operation.data.format || 'json',
            operation.data.filter
          );
          break;
        case 'import':
          result = await this.importTasks(operation.data.tasks, dryRun);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      return {
        operation,
        status: 'success',
        result
      };
    } catch (e) {
      return {
        operation,
        status: 'error',
        error: e.message
      };
    }
  }

  /**
   * Execute multiple operations in a batch
   * 
   * @param batch The batch operations to execute
   * @param dryRun Whether to simulate the operations without making changes
   * @returns Results of batch execution
   */
  async executeBatch(batch: BatchOperations, dryRun: boolean = false): Promise<BatchResult> {
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as OperationResult[]
    };

    // Process each operation
    for (const operation of batch.operations) {
      const result = await this.executeOperation(operation, dryRun);
      
      // Update statistics
      switch (result.status) {
        case 'success':
          results.success++;
          break;
        case 'error':
          results.failed++;
          break;
        case 'skipped':
        case 'simulated':
          results.skipped++;
          break;
      }
      
      results.details.push(result);
    }

    return {
      status: 'completed',
      dryRun,
      results
    };
  }

  /**
   * Export tasks with filtering options
   * 
   * @param format The format of the export
   * @param filter Filter string in the format key:value
   * @returns The exported tasks
   */
  async exportTasks(format: string = 'json', filter?: string): Promise<ExportResult> {
    // Get all tasks
    const allTasksResult = await this.repo.getAllTasks();
    const allTasks = allTasksResult.data || [];
    
    // Apply filter if provided
    let filteredTasks = allTasks;
    if (filter) {
      const [key, value] = filter.split(':');
      filteredTasks = allTasks.filter(task => {
        if (key === 'tag' && task.tags?.includes(value)) return true;
        if (key === 'status' && task.status === value) return true;
        if (key === 'readiness' && task.readiness === value) return true;
        return false;
      });
    }
    
    let output: any = {};
    
    // Format the output based on the requested format
    switch (format) {
      case 'hierarchical':
        // Build a hierarchical view
        const hierarchy = await this.graph.formatHierarchyJson(
          await this.repo.buildTaskHierarchy()
        );
        output = { type: 'hierarchical', tasks: hierarchy };
        break;
        
      case 'flat':
        // Simplified flat format with just essential fields
        const flatTasks = filteredTasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          readiness: task.readiness,
          tags: task.tags,
          parentId: task.parentId
        }));
        output = { type: 'flat', tasks: flatTasks };
        break;
        
      case 'json':
      default:
        // Full JSON with all details
        output = { type: 'full', tasks: filteredTasks };
        break;
    }
    
    // Add metadata about the export
    return {
      ...output,
      count: filteredTasks.length,
      timestamp: new Date().toISOString(),
      filter: filter || null
    };
  }

  /**
   * Import tasks from an external source
   * 
   * @param tasks Array of tasks to import
   * @param dryRun Whether to simulate the import without making changes
   * @returns Results of the import operation
   */
  async importTasks(tasks: Task[], dryRun: boolean = false): Promise<ImportResult> {
    // Track results
    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    // Process each task
    for (const task of tasks) {
      try {
        if (!task.id && !task.title) {
          results.skipped++;
          results.errors.push(`Skipped task with no ID or title`);
          continue;
        }
        
        // If ID is provided, it's an update, otherwise it's a new task
        if (task.id) {
          // Update existing task
          if (!dryRun) {
            await this.repo.updateTask({
              id: task.id,
              title: task.title,
              status: task.status,
              readiness: task.readiness,
              tags: task.tags,
              metadata: task.metadata
            });
          }
          results.updated++;
        } else {
          // Create new task
          if (!dryRun) {
            await this.repo.createTask({
              title: task.title,
              status: task.status,
              readiness: task.readiness,
              tags: task.tags,
              childOf: task.parentId,
              metadata: task.metadata
            });
          }
          results.added++;
        }
      } catch (e) {
        results.errors.push(`Error processing task: ${e.message}`);
        results.skipped++;
      }
    }
    
    return {
      success: true,
      dryRun,
      results
    };
  }

  /**
   * Get a task by ID
   * 
   * @param id Task ID
   * @returns The task
   */
  async getTask(id: string): Promise<Task> {
    return this.repo.getTask(id);
  }

  /**
   * Get all tasks
   * 
   * @returns Array of all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    const result = await this.repo.getAllTasks();
    return result.data || [];
  }

  /**
   * Build the task hierarchy
   * 
   * @returns Hierarchical task structure
   */
  async getTaskHierarchy(): Promise<TaskWithChildren[]> {
    return this.repo.buildTaskHierarchy();
  }

  /**
   * Format the task hierarchy in various formats
   * 
   * @param format The format to use
   * @param options Additional options for formatting
   * @returns Formatted hierarchy
   */
  async formatTaskHierarchy(format: string = 'text', options: any = {}): Promise<string | object> {
    const tasks = await this.repo.buildTaskHierarchy();
    
    if (format === 'json') {
      return await this.graph.formatHierarchyJson(tasks, options.jsonStyle || 'tree');
    } else if (format === 'dot') {
      return await this.graph.formatHierarchyDot(tasks);
    } else {
      return await this.graph.formatHierarchyText(tasks, options.textStyle || 'tree', options);
    }
  }
}