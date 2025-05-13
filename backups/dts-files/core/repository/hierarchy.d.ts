import { TaskCreationRepository } from './creation';
import { Task } from '../../db/schema';
import { TaskOperationResult } from '../types';
/**
 * Interface representing a task with children in a hierarchy
 */
export interface HierarchyTask extends Task {
    children: HierarchyTask[];
}
/**
 * Hierarchy functionality for the TaskRepository
 */
export declare class TaskHierarchyRepository extends TaskCreationRepository {
    /**
     * Get all child tasks for a given parent task
     * @param taskId The parent task ID
     * @returns TaskOperationResult containing an array of child tasks
     */
    getChildTasks(taskId: string): Promise<TaskOperationResult<Task[]>>;
    /**
     * Build a task hierarchy for display
     * @returns TaskOperationResult containing an array of root tasks with their children
     */
    buildTaskHierarchy(): Promise<TaskOperationResult<HierarchyTask[]>>;
    /**
     * Legacy method for backward compatibility
     * @returns Array of root tasks with their children
     */
    buildTaskHierarchyLegacy(): Promise<HierarchyTask[]>;
    /**
     * Reorder sibling tasks after a deletion
     * @param parentId Parent task ID
     * @param deletedTaskId Deleted task ID
     * @returns TaskOperationResult indicating success or failure
     */
    reorderSiblingTasksAfterDeletion(parentId: string, deletedTaskId: string): Promise<TaskOperationResult<void>>;
    /**
     * Legacy method for backward compatibility
     * @param parentId Parent task ID
     * @param deletedTaskId Deleted task ID
     */
    reorderSiblingTasksAfterDeletionLegacy(parentId: string, deletedTaskId: string): Promise<boolean>;
    /**
     * Reorder root tasks after a deletion
     * @param deletedTaskId Deleted task ID
     * @returns TaskOperationResult indicating success or failure
     */
    reorderRootTasksAfterDeletion(deletedTaskId: string): Promise<TaskOperationResult<void>>;
    /**
     * Legacy method for backward compatibility
     * @param deletedTaskId Deleted task ID
     */
    reorderRootTasksAfterDeletionLegacy(deletedTaskId: string): Promise<boolean>;
}
