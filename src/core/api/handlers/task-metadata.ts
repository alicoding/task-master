/**
 * Task Metadata command handlers
 * Manage metadata fields on tasks
 */

import { BaseCommandHandler, CommandParams } from '@/core/api/command';
import { CommandContext } from '@/core/api/context';
import { Task } from '@/core/types';

/**
 * Base parameters for metadata operations
 */
export interface MetadataBaseParams extends CommandParams {
  id: string;           // Task ID
  field?: string;       // Optional field name
}

/**
 * Parameters for getting metadata
 */
export interface GetMetadataParams extends MetadataBaseParams {
  // Only uses base parameters
}

/**
 * Parameters for setting/appending metadata
 */
export interface SetMetadataParams extends MetadataBaseParams {
  field: string;        // Field name is required for set operations
  value: any;           // Value to set
}

/**
 * Parameters for removing metadata
 */
export interface RemoveMetadataParams extends MetadataBaseParams {
  field: string;        // Field name is required for remove operations
}

/**
 * Metadata operation types
 */
export type MetadataOperation = 'get' | 'set' | 'remove' | 'append';

/**
 * Result of metadata operations
 */
export interface MetadataResult {
  task: Task;
  field?: string;       // Field that was operated on, if any
  value?: any;          // Value after the operation
  metadata: any;        // Complete metadata after the operation
  operation: MetadataOperation;
}

/**
 * Get Metadata command handler
 */
export class GetMetadataHandler extends BaseCommandHandler<GetMetadataParams, MetadataResult> {
  constructor() {
    super('metadata.get', 'Get task metadata');
  }
  
  /**
   * Validate the parameters
   */
  validateParams(params: GetMetadataParams): true | string {
    if (!params.id) {
      return 'Task ID is required';
    }
    
    return true;
  }
  
  /**
   * Execute the get metadata command
   */
  async executeCommand(
    context: CommandContext,
    params: GetMetadataParams
  ): Promise<MetadataResult> {
    const repo = context.getRepository();
    
    // Get the task
    const task = await repo.getTask(params.id);
    if (!task) {
      throw new Error(`Task with ID ${params.id} not found`);
    }
    
    // If a specific field was requested
    if (params.field) {
      const value = await repo.getMetadataField(params.id, params.field);

      return {
        task,
        field: params.field,
        value,
        metadata: task.metadata || {},
        operation: 'get'
      };
    }
    
    // Debug logging
    console.log('DEBUG - Task object in handler:', {
      id: task.id,
      title: task.title,
      hasMetadata: !!task.metadata,
      metadataKeys: task.metadata ? Object.keys(task.metadata) : []
    });

    // Return all metadata
    return {
      task,
      metadata: task.metadata || {},
      operation: 'get'
    };
  }
}

/**
 * Set Metadata command handler
 */
export class SetMetadataHandler extends BaseCommandHandler<SetMetadataParams, MetadataResult> {
  constructor() {
    super('metadata.set', 'Set task metadata field');
  }
  
  /**
   * Validate the parameters
   */
  validateParams(params: SetMetadataParams): true | string {
    if (!params.id) {
      return 'Task ID is required';
    }
    
    if (!params.field) {
      return 'Field name is required';
    }
    
    if (params.value === undefined) {
      return 'Value is required';
    }
    
    return true;
  }
  
  /**
   * Execute the set metadata command
   */
  async executeCommand(
    context: CommandContext,
    params: SetMetadataParams
  ): Promise<MetadataResult> {
    const repo = context.getRepository();
    
    // Parse value if it's a string and looks like JSON
    let parsedValue = params.value;
    if (
      typeof parsedValue === 'string' &&
      (
        (parsedValue.startsWith('{') && parsedValue.endsWith('}')) ||
        (parsedValue.startsWith('[') && parsedValue.endsWith(']')) ||
        parsedValue === 'true' ||
        parsedValue === 'false' ||
        parsedValue === 'null' ||
        /^-?\d+(\.\d+)?$/.test(parsedValue)
      )
    ) {
      try {
        parsedValue = JSON.parse(parsedValue);
        context.trace('Parsed value as JSON', { originalValue: params.value, parsedValue });
      } catch (e) {
        // Keep as string if parsing fails
        context.trace('Failed to parse value as JSON', { error: e });
      }
    }
    
    // Update the metadata
    const updatedTask = await repo.updateMetadata(params.id, params.field, parsedValue, 'set');
    if (!updatedTask) {
      throw new Error(`Task with ID ${params.id} not found`);
    }
    
    return {
      task: updatedTask,
      field: params.field,
      value: updatedTask.metadata?.[params.field],
      metadata: updatedTask.metadata || {},
      operation: 'set'
    };
  }
}

/**
 * Remove Metadata command handler
 */
export class RemoveMetadataHandler extends BaseCommandHandler<RemoveMetadataParams, MetadataResult> {
  constructor() {
    super('metadata.remove', 'Remove task metadata field');
  }
  
  /**
   * Validate the parameters
   */
  validateParams(params: RemoveMetadataParams): true | string {
    if (!params.id) {
      return 'Task ID is required';
    }
    
    if (!params.field) {
      return 'Field name is required';
    }
    
    return true;
  }
  
  /**
   * Execute the remove metadata command
   */
  async executeCommand(
    context: CommandContext,
    params: RemoveMetadataParams
  ): Promise<MetadataResult> {
    const repo = context.getRepository();
    
    // Remove the metadata field
    const updatedTask = await repo.updateMetadata(params.id, params.field, null, 'remove');
    if (!updatedTask) {
      throw new Error(`Task with ID ${params.id} not found`);
    }
    
    return {
      task: updatedTask,
      field: params.field,
      metadata: updatedTask.metadata || {},
      operation: 'remove'
    };
  }
}

/**
 * Append to Metadata command handler
 */
export class AppendMetadataHandler extends BaseCommandHandler<SetMetadataParams, MetadataResult> {
  constructor() {
    super('metadata.append', 'Append to task metadata field');
  }
  
  /**
   * Validate the parameters
   */
  validateParams(params: SetMetadataParams): true | string {
    if (!params.id) {
      return 'Task ID is required';
    }
    
    if (!params.field) {
      return 'Field name is required';
    }
    
    if (params.value === undefined) {
      return 'Value is required';
    }
    
    return true;
  }
  
  /**
   * Execute the append metadata command
   */
  async executeCommand(
    context: CommandContext,
    params: SetMetadataParams
  ): Promise<MetadataResult> {
    const repo = context.getRepository();
    
    // Parse value if it's a string and looks like JSON
    let parsedValue = params.value;
    if (
      typeof parsedValue === 'string' &&
      (
        (parsedValue.startsWith('{') && parsedValue.endsWith('}')) ||
        (parsedValue.startsWith('[') && parsedValue.endsWith(']')) ||
        parsedValue === 'true' ||
        parsedValue === 'false' ||
        parsedValue === 'null' ||
        /^-?\d+(\.\d+)?$/.test(parsedValue)
      )
    ) {
      try {
        parsedValue = JSON.parse(parsedValue);
        context.trace('Parsed value as JSON', { originalValue: params.value, parsedValue });
      } catch (e) {
        // Keep as string if parsing fails
        context.trace('Failed to parse value as JSON', { error: e });
      }
    }
    
    // Append to the metadata field
    const updatedTask = await repo.updateMetadata(params.id, params.field, parsedValue, 'append');
    if (!updatedTask) {
      throw new Error(`Task with ID ${params.id} not found`);
    }
    
    return {
      task: updatedTask,
      field: params.field,
      value: updatedTask.metadata?.[params.field],
      metadata: updatedTask.metadata || {},
      operation: 'append'
    };
  }
}