/**
 * Update Task command handler
 * Updates an existing task in the system
 */

import { BaseCommandHandler, CommandParams } from '../command.ts';
import { CommandContext } from '../context.ts';
import { Task } from '../../types.ts';

/**
 * Parameters for updating a task
 */
export interface UpdateTaskParams extends CommandParams {
  id: string;
  title?: string;
  parentId?: string;
  status?: string;
  readiness?: string;
  tags?: string[];
  metadata?: Record<string, any> | string;
}

/**
 * Update Task command handler
 */
export class UpdateTaskHandler extends BaseCommandHandler<UpdateTaskParams, Task> {
  constructor() {
    super('update', 'Update an existing task');
  }
  
  /**
   * Validate the parameters for updating a task
   */
  validateParams(params: UpdateTaskParams): true | string {
    if (!params.id || typeof params.id !== 'string') {
      return 'Task ID is required';
    }
    
    // Check status if provided
    if (params.status && !['todo', 'in-progress', 'done'].includes(params.status)) {
      return 'Status must be one of: todo, in-progress, done';
    }
    
    // Check readiness if provided
    if (params.readiness && !['draft', 'ready', 'blocked'].includes(params.readiness)) {
      return 'Readiness must be one of: draft, ready, blocked';
    }
    
    // Validate title if provided
    if (params.title !== undefined && (typeof params.title !== 'string' || params.title.trim() === '')) {
      return 'Task title cannot be empty';
    }
    
    // Validate tags if provided
    if (params.tags !== undefined && !Array.isArray(params.tags)) {
      return 'Tags must be an array of strings';
    }
    
    return true;
  }
  
  /**
   * Execute the update task command
   */
  async executeCommand(
    context: CommandContext,
    params: UpdateTaskParams
  ): Promise<Task> {
    // Get repository from context
    const repo = context.getRepository();
    
    // Trace what we're updating
    context.trace('Updating task', { id: params.id, params });
    
    // Parse metadata if it's a string
    let metadata = params.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
    
    // If this is a dry run, get the current task and mock the update
    if (context.isDryRunMode()) {
      const currentTask = await repo.getTask(params.id);
      if (!currentTask) {
        throw new Error(`Task ${params.id} not found`);
      }
      
      return {
        ...currentTask,
        title: params.title ?? currentTask.title,
        status: params.status ?? currentTask.status,
        readiness: params.readiness ?? currentTask.readiness,
        tags: params.tags ?? currentTask.tags,
        parentId: params.parentId ?? currentTask.parentId,
        metadata: metadata ?? currentTask.metadata,
        updatedAt: new Date().toISOString()
      };
    }
    
    // Check if task exists
    const currentTask = await repo.getTask(params.id);
    if (!currentTask) {
      throw new Error(`Task ${params.id} not found`);
    }
    
    // Update the task
    const updatedTask = await repo.updateTask({
      id: params.id,
      title: params.title,
      status: params.status,
      readiness: params.readiness,
      tags: params.tags,
      parentId: params.parentId,
      metadata: metadata
    });
    
    return updatedTask;
  }
}