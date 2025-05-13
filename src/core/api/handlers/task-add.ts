/**
 * Add Task command handler
 * Creates a new task in the system with similarity checking
 */

import { BaseCommandHandler, CommandParams } from '@/core/api/command';
import { CommandContext } from '@/core/api/context';
import { Task, TaskStatus, TaskReadiness, TaskMetadata } from '@/core/types';

/**
 * Parameters for adding a task
 */
export interface AddTaskParams extends CommandParams {
  title: string;
  parentId?: string;
  childOf?: string; // Alias for parentId for backward compatibility
  status?: string;
  readiness?: string;
  tags?: string[];
  metadata?: Record<string, any> | string;
  after?: string; // Position the task after another task
  force?: boolean; // Skip similarity check
  similarityThreshold?: string | number; // Threshold for similarity check
}

/**
 * Result of task addition
 */
export interface AddTaskResult {
  task?: Task;
  similarTasks?: Task[];
  message?: string;
  operation?: 'create' | 'update' | 'merge' | 'cancelled' | 'dry-run';
}

/**
 * Add Task command handler with similarity checking
 */
export class AddTaskHandler extends BaseCommandHandler<AddTaskParams, AddTaskResult> {
  constructor() {
    super('add', 'Add a new task with duplicate detection');
  }
  
  /**
   * Validate the parameters for adding a task
   */
  validateParams(params: AddTaskParams): true | string {
    if (!params.title || typeof params.title !== 'string' || params.title.trim() === '') {
      return 'Task title is required';
    }
    
    // Check status if provided
    if (params.status && !['todo', 'in-progress', 'done'].includes(params.status)) {
      return 'Status must be one of: todo, in-progress, done';
    }
    
    // Check readiness if provided
    if (params.readiness && !['draft', 'ready', 'blocked'].includes(params.readiness)) {
      return 'Readiness must be one of: draft, ready, blocked';
    }
    
    // Validate parent ID if provided
    if (params.parentId && typeof params.parentId !== 'string') {
      return 'Parent ID must be a string';
    }
    
    if (params.childOf && typeof params.childOf !== 'string') {
      return 'Child Of ID must be a string';
    }
    
    // Validate tags if provided
    if (params.tags && !Array.isArray(params.tags)) {
      return 'Tags must be an array of strings';
    }
    
    // Validate after ID if provided
    if (params.after && typeof params.after !== 'string') {
      return 'After ID must be a string';
    }
    
    // Validate similarity threshold if provided
    if (params.similarityThreshold !== undefined) {
      const threshold = parseFloat(String(params.similarityThreshold));
      if (isNaN(threshold) || threshold < 0 || threshold > 100) {
        return 'Similarity threshold must be a number between 0 and 100';
      }
    }
    
    return true;
  }
  
  /**
   * Execute the add task command with similarity checking
   */
  async executeCommand(
    context: CommandContext,
    params: AddTaskParams
  ): Promise<AddTaskResult> {
    // Get repository from context
    const repo = context.getRepository();
    
    // Normalize parameters
    const parentId = params.parentId || params.childOf;
    const force = params.force === true;
    const isDryRun = context.isDryRunMode();
    
    // Parse metadata if it's a string
    let metadata = params.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        // Keep as string if not valid JSON
        context.trace('Failed to parse metadata JSON', { error: e });
      }
    }
    
    // Convert similarity threshold to a decimal (0-1)
    let similarityThreshold = 0.3; // Default 30%
    if (params.similarityThreshold !== undefined) {
      similarityThreshold = parseFloat(String(params.similarityThreshold));
      // Convert from percentage to decimal if needed
      if (similarityThreshold > 1) {
        similarityThreshold = similarityThreshold / 100;
      }
    }
    
    // Check for similar tasks
    const similarTasks = await repo.findSimilarTasks(params.title);
    
    // Filter by threshold
    const filteredTasks = similarTasks.filter(task => {
      const score = task.metadata?.similarityScore || 0;
      return score >= similarityThreshold;
    });
    
    // Handle similar tasks (but skip if force is true)
    if (filteredTasks.length > 0 && !force) {
      context.trace('Similar tasks found', { 
        count: filteredTasks.length, 
        threshold: similarityThreshold 
      });
      
      // In dry run or API mode, just return the similar tasks
      return {
        similarTasks: filteredTasks,
        message: 'Similar tasks found',
        operation: 'dry-run'
      };
    }
    
    // If this is a dry run, return a simulated task
    if (isDryRun) {
      const dryRunTask = {
        id: 'dry-run-id',
        title: params.title,
        status: (params.status || 'todo') as TaskStatus,
        readiness: (params.readiness || 'draft') as TaskReadiness,
        tags: params.tags || [],
        parentId: parentId,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return {
        task: dryRunTask,
        message: 'Dry run - task would be created',
        operation: 'dry-run'
      };
    }
    
    // Create the task
    const task = await repo.createTask({
      title: params.title,
      status: params.status as TaskStatus,
      readiness: params.readiness as TaskReadiness,
      tags: params.tags,
      childOf: parentId,
      after: params.after,
      metadata: metadata as Partial<TaskMetadata>
    });
    
    return {
      task,
      message: 'Task created successfully',
      operation: 'create'
    };
  }
}