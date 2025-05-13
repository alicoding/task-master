import { BaseTaskRepository } from './base';
/**
 * Metadata functionality for the TaskRepository
 */
export declare class TaskMetadataRepository extends BaseTaskRepository {
    /**
     * Update a specific metadata field
     * @param taskId Task ID
     * @param key Metadata field key
     * @param value Metadata field value
     * @param operation Operation to perform (set, remove, append)
     * @returns Updated task or undefined if not found
     */
    updateMetadata(taskId: string, key: string, value: any, operation?: 'set' | 'remove' | 'append'): Promise<import("../types").TaskOperationResult<any>>;
    /**
     * Get all metadata for a task
     * @param taskId Task ID
     * @returns Metadata object or undefined if task not found
     */
    getMetadata(taskId: string): Promise<any>;
    /**
     * Get a specific metadata field
     * @param taskId Task ID
     * @param key Metadata field key (supports dot notation for nested fields)
     * @returns Field value or undefined if not found
     */
    getMetadataField(taskId: string, key: string): Promise<any>;
}
