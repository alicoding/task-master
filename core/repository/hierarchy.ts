import { eq, isNull } from 'drizzle-orm';
import { TaskCreationRepository } from './creation';
import { tasks } from '../../db/schema';
import {
  Task,
  TaskOperationResult,
  TaskError,
  TaskErrorCode
} from '../types';

/**
 * Interface representing a task with children in a hierarchy
 * @deprecated Use the HierarchyTask from core/types.ts instead
 */
import { HierarchyTask as CoreHierarchyTask } from '../types';
export type HierarchyTask = CoreHierarchyTask;

/**
 * Hierarchy functionality for the TaskRepository
 */
export class TaskHierarchyRepository extends TaskCreationRepository {
  /**
   * Get all child tasks for a given parent task
   * @param taskId The parent task ID
   * @returns TaskOperationResult containing an array of child tasks
   */
  async getChildTasks(taskId: string): Promise<TaskOperationResult<Task[]>> {
    try {
      // Query for tasks with matching parentId
      const result = await this.db
        .select()
        .from(tasks)
        .where(eq(tasks.parentId, taskId));

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error retrieving child tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }
  /**
   * Build a task hierarchy for display
   * @returns TaskOperationResult containing an array of root tasks with their children
   */
  async buildTaskHierarchy(): Promise<TaskOperationResult<HierarchyTask[]>> {
    try {
      const tasksResult = await this.getAllTasks();

      if (!tasksResult.success || !tasksResult.data) {
        return {
          success: false,
          error: tasksResult.error || new TaskError(
            'Failed to retrieve tasks for hierarchy',
            TaskErrorCode.DATABASE_ERROR
          )
        };
      }

      const allTasks = tasksResult.data;
      const taskMap = new Map<string, HierarchyTask>();
      const rootTasks: HierarchyTask[] = [];

      // First, create a map of all tasks
      for (const task of allTasks) {
        taskMap.set(task.id, { ...task, children: [] });
      }

      // Then, build the hierarchy
      for (const task of allTasks) {
        if (task.parentId && taskMap.has(task.parentId)) {
          taskMap.get(task.parentId)!.children.push(taskMap.get(task.id)!);
        } else {
          rootTasks.push(taskMap.get(task.id)!);
        }
      }

      // Sort by id (which implicitly sorts by hierarchy)
      const sortedRootTasks = rootTasks.sort((a, b) => {
        const aNum = parseInt(a.id.split('.')[0], 10);
        const bNum = parseInt(b.id.split('.')[0], 10);
        return aNum - bNum;
      });

      return {
        success: true,
        data: sortedRootTasks
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error building task hierarchy: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   * @returns Array of root tasks with their children
   */
  async buildTaskHierarchyLegacy(): Promise<HierarchyTask[]> {
    const result = await this.buildTaskHierarchy();
    return result.success && result.data ? result.data : [];
  }
  
  /**
   * Reorder sibling tasks after a deletion
   * @param parentId Parent task ID
   * @param deletedTaskId Deleted task ID
   * @returns TaskOperationResult indicating success or failure
   */
  async reorderSiblingTasksAfterDeletion(
    parentId: string,
    deletedTaskId: string
  ): Promise<TaskOperationResult<void>> {
    try {
      if (!parentId || typeof parentId !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid parent ID', TaskErrorCode.INVALID_INPUT)
        };
      }

      if (!deletedTaskId || typeof deletedTaskId !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid deleted task ID', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Get all siblings with the same parent
      const siblings = await this.db.select()
        .from(tasks)
        .where(eq(tasks.parentId as any, parentId));

      // Extract the last part of the deleted ID
      const deletedParts = deletedTaskId.split('.');
      const deletedIndex = parseInt(deletedParts[deletedParts.length - 1], 10);

      if (isNaN(deletedIndex)) {
        return {
          success: false,
          error: new TaskError('Invalid task ID format', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Find siblings that need reordering (those with a higher index)
      const needsReordering = siblings.filter(sibling => {
        const siblingParts = sibling.id.split('.');
        const siblingIndex = parseInt(siblingParts[siblingParts.length - 1], 10);
        return siblingIndex > deletedIndex;
      });

      // Sort by ID to ensure proper sequential reordering
      needsReordering.sort((a, b) => {
        const aIndex = parseInt(a.id.split('.').pop() || '0', 10);
        const bIndex = parseInt(b.id.split('.').pop() || '0', 10);
        return aIndex - bIndex;
      });

      // For logging purposes
      if (needsReordering.length > 0) {
        console.log(`Reordering ${needsReordering.length} siblings after deletion of ${deletedTaskId}`);
      }

      // Actually update the task IDs sequentially
      for (const task of needsReordering) {
        const taskParts = task.id.split('.');
        const taskIndex = parseInt(taskParts[taskParts.length - 1], 10);
        const newIndex = taskIndex - 1;

        // Create the new ID
        taskParts[taskParts.length - 1] = newIndex.toString();
        const newId = taskParts.join('.');

        // Temporary store for old ID to handle dependencies
        const oldId = task.id;

        // Log the change
        console.log(`Changing task ID from ${oldId} to ${newId}`);

        // Update the task ID using the updateTaskId function
        const updateResult = await this.updateTaskId(oldId, newId);

        if (!updateResult.success) {
          return {
            success: false,
            error: updateResult.error || new TaskError(
              `Failed to update task ID from ${oldId} to ${newId}`,
              TaskErrorCode.DATABASE_ERROR
            )
          };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error reordering siblings:', error);
      return {
        success: false,
        error: new TaskError(
          `Error reordering siblings: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   * @param parentId Parent task ID
   * @param deletedTaskId Deleted task ID
   */
  async reorderSiblingTasksAfterDeletionLegacy(
    parentId: string,
    deletedTaskId: string
  ): Promise<boolean> {
    const result = await this.reorderSiblingTasksAfterDeletion(parentId, deletedTaskId);
    return result.success;
  }
  
  /**
   * Reorder root tasks after a deletion
   * @param deletedTaskId Deleted task ID
   * @returns TaskOperationResult indicating success or failure
   */
  async reorderRootTasksAfterDeletion(deletedTaskId: string): Promise<TaskOperationResult<void>> {
    try {
      if (!deletedTaskId || typeof deletedTaskId !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid deleted task ID', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Get all root tasks
      const rootTasks = await this.db.select()
        .from(tasks)
        .where(isNull(tasks.parentId));

      // The deleted ID is just a number for root tasks
      const deletedIndex = parseInt(deletedTaskId, 10);

      if (isNaN(deletedIndex)) {
        return {
          success: false,
          error: new TaskError('Invalid task ID format', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Find tasks that need reordering (those with a higher index)
      const needsReordering = rootTasks.filter(task => {
        const taskIndex = parseInt(task.id, 10);
        return taskIndex > deletedIndex;
      });

      // Sort by ID to ensure proper sequential reordering
      needsReordering.sort((a, b) => {
        const aIndex = parseInt(a.id, 10);
        const bIndex = parseInt(b.id, 10);
        return aIndex - bIndex;
      });

      // For logging purposes
      if (needsReordering.length > 0) {
        console.log(`Reordering ${needsReordering.length} root tasks after deletion of ${deletedTaskId}`);

        // Update each task's ID sequentially
        for (const task of needsReordering) {
          const taskIndex = parseInt(task.id, 10);
          const newIndex = taskIndex - 1;
          const newId = newIndex.toString();
          const oldId = task.id;

          // Log the change
          console.log(`Changing task ID from ${oldId} to ${newId}`);

          // Update the task ID and its dependencies
          const updateResult = await this.updateTaskId(oldId, newId);

          if (!updateResult.success) {
            return {
              success: false,
              error: updateResult.error || new TaskError(
                `Failed to update task ID from ${oldId} to ${newId}`,
                TaskErrorCode.DATABASE_ERROR
              )
            };
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error reordering root tasks:', error);
      return {
        success: false,
        error: new TaskError(
          `Error reordering root tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   * @param deletedTaskId Deleted task ID
   */
  async reorderRootTasksAfterDeletionLegacy(deletedTaskId: string): Promise<boolean> {
    const result = await this.reorderRootTasksAfterDeletion(deletedTaskId);
    return result.success;
  }
}