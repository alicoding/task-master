import { BaseTaskRepository } from './base.ts';

/**
 * Metadata functionality for the TaskRepository
 */
export class TaskMetadataRepository extends BaseTaskRepository {
  /**
   * Update a specific metadata field
   * @param taskId Task ID
   * @param key Metadata field key
   * @param value Metadata field value
   * @param operation Operation to perform (set, remove, append)
   * @returns Updated task or undefined if not found
   */
  async updateMetadata(
    taskId: string,
    key: string,
    value: any,
    operation: 'set' | 'remove' | 'append' = 'set'
  ) {
    const taskResult = await this.getTask(taskId);
    if (!taskResult.success || !taskResult.data) {
      return undefined;
    }

    const task = taskResult.data;
    
    // Clone the existing metadata
    const metadata = { ...task.metadata };
    
    // Apply the requested operation
    switch (operation) {
      case 'set':
        metadata[key] = value;
        break;
      case 'remove':
        if (metadata && key in metadata) {
          delete metadata[key];
        }
        break;
      case 'append':
        // For array values, append the new value
        if (Array.isArray(metadata[key])) {
          metadata[key] = [...metadata[key], value];
        } else if (metadata[key] === undefined) {
          // If the field doesn't exist yet, create it as an array
          metadata[key] = [value];
        } else {
          // If the field exists but isn't an array, convert it to an array with both values
          metadata[key] = [metadata[key], value];
        }
        break;
    }
    
    // Update the task with the new metadata
    return this.updateTask({
      id: taskId,
      metadata
    });
  }
  
  /**
   * Get all metadata for a task
   * @param taskId Task ID
   * @returns Metadata object or undefined if task not found
   */
  async getMetadata(taskId: string) {
    const taskResult = await this.getTask(taskId);
    if (!taskResult.success) {
      return undefined;
    }
    return taskResult.data?.metadata || {};
  }
  
  /**
   * Get a specific metadata field
   * @param taskId Task ID
   * @param key Metadata field key (supports dot notation for nested fields)
   * @returns Field value or undefined if not found
   */
  async getMetadataField(taskId: string, key: string) {
    const taskResult = await this.getTask(taskId);
    if (!taskResult.success) {
      return undefined;
    }

    // Handle nested field access with dot notation
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = taskResult.data?.metadata;

      // Navigate through the nested structure
      for (const part of parts) {
        if (value === undefined || value === null) {
          return undefined;
        }
        value = value[part];
      }

      return value;
    }

    // Simple field access
    return taskResult.data?.metadata?.[key];
  }
}