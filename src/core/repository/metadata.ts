import { BaseTaskRepository } from '@/core/repository/base';

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
    if (!taskResult?.success || !taskResult?.data) {
      return undefined;
    }

    const task = taskResult?.data;
    
    // Parse and clone the existing metadata
    let metadata: Record<string, any> = {};

    if (task.metadata) {
      if (typeof task.metadata === 'string') {
        try {
          metadata = JSON.parse(task.metadata);
        } catch (e) {
          // If parse fails, start with empty object
          metadata = {};
        }
      } else if (typeof task.metadata === 'object' && task.metadata !== null) {
        // Create a fresh copy
        metadata = Object.assign({}, task.metadata as Record<string, any>);
      }
    }
    
    // Apply the requested operation
    switch (operation) {
      case 'set':
        (metadata as Record<string, any>)[key] = value;
        break;
      case 'remove':
        if (metadata && typeof metadata === 'object' && key in metadata) {
          delete (metadata as Record<string, any>)[key];
        }
        break;
      case 'append':
        // For array values, append the new value
        const metadataObj = metadata as Record<string, any>;
        if (key in metadataObj && Array.isArray(metadataObj[key])) {
          metadataObj[key] = [...metadataObj[key], value];
        } else if (!(key in metadataObj) || metadataObj[key] === undefined) {
          // If the field doesn't exist yet, create it as an array
          metadataObj[key] = [value];
        } else {
          // If the field exists but isn't an array, convert it to an array with both values
          metadataObj[key] = [metadataObj[key], value];
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
    if (!taskResult?.success) {
      return undefined;
    }
    return taskResult?.data?.metadata || {};
  }
  
  /**
   * Get a specific metadata field
   * @param taskId Task ID
   * @param key Metadata field key (supports dot notation for nested fields)
   * @returns Field value or undefined if not found
   */
  async getMetadataField(taskId: string, key: string) {
    const taskResult = await this.getTask(taskId);
    if (!taskResult?.success) {
      return undefined;
    }

    // Handle nested field access with dot notation
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = taskResult?.data?.metadata;

      // Navigate through the nested structure
      for (const part of parts) {
        if (value === undefined || value === null) {
          return undefined;
        }
        // Check if value is an object and has the property
        if (typeof value === 'object' && value !== null && part in value) {
          value = (value as Record<string, any>)[part];
        } else {
          return undefined;
        }
      }

      return value;
    }

    // Simple field access
    if (taskResult?.data?.metadata && typeof taskResult.data.metadata === 'object' &&
        key in (taskResult.data.metadata as object)) {
      return (taskResult.data.metadata as Record<string, any>)[key];
    }
    return undefined;
  }
}