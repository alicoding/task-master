import { BaseTaskRepository } from './base';
import { Task } from '../../db/schema';
import { TaskInsertOptions, TaskOperationResult } from '../types';
/**
 * Task creation functionality for the TaskRepository
 */
export declare class TaskCreationRepository extends BaseTaskRepository {
    /**
     * Generate hierarchical task ID
     * @param options Task creation options
     * @returns TaskOperationResult containing the generated task ID or an error
     */
    private generateTaskId;
    /**
     * Create a new task
     * @param options Task creation options
     * @returns TaskOperationResult containing the created task or an error
     */
    createTask(options: TaskInsertOptions): Promise<TaskOperationResult<Task>>;
    /**
     * Legacy method for backward compatibility
     * @param options Task creation options
     * @returns The created task or undefined if there was an error
     */
    createTaskLegacy(options: TaskInsertOptions): Promise<Task | undefined>;
    /**
     * Update a task's ID
     * @param oldId Current task ID
     * @param newId New task ID
     * @returns TaskOperationResult indicating success or failure
     */
    updateTaskId(oldId: string, newId: string): Promise<TaskOperationResult<boolean>>;
    /**
     * Legacy method for backward compatibility
     * @param oldId Current task ID
     * @param newId New task ID
     * @returns true if successful, false otherwise
     */
    updateTaskIdLegacy(oldId: string, newId: string): Promise<boolean>;
    /**
     * Update dependency references
     * @param oldId Old task ID
     * @param newId New task ID
     * @returns TaskOperationResult indicating success or failure
     */
    updateDependencyReferences(oldId: string, newId: string): Promise<TaskOperationResult<void>>;
    /**
     * Legacy method for backward compatibility
     * @param oldId Old task ID
     * @param newId New task ID
     */
    updateDependencyReferencesLegacy(oldId: string, newId: string): Promise<void>;
}
