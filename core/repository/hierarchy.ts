import { eq, isNull } from 'drizzle-orm';
import { TaskCreationRepository } from './creation.js';
import { tasks } from '../../db/schema.js';

/**
 * Hierarchy functionality for the TaskRepository
 */
export class TaskHierarchyRepository extends TaskCreationRepository {
  /**
   * Build a task hierarchy for display
   * @returns Array of root tasks with their children
   */
  async buildTaskHierarchy() {
    const allTasks = await this.getAllTasks();
    const taskMap = new Map<string, any>();
    const rootTasks = [];
    
    // First, create a map of all tasks
    for (const task of allTasks) {
      taskMap.set(task.id, { ...task, children: [] });
    }
    
    // Then, build the hierarchy
    for (const task of allTasks) {
      if (task.parentId && taskMap.has(task.parentId)) {
        taskMap.get(task.parentId).children.push(taskMap.get(task.id));
      } else {
        rootTasks.push(taskMap.get(task.id));
      }
    }
    
    // Sort by id (which implicitly sorts by hierarchy)
    return rootTasks.sort((a, b) => {
      const aNum = parseInt(a.id.split('.')[0], 10);
      const bNum = parseInt(b.id.split('.')[0], 10);
      return aNum - bNum;
    });
  }
  
  /**
   * Reorder sibling tasks after a deletion
   * @param parentId Parent task ID
   * @param deletedTaskId Deleted task ID
   */
  async reorderSiblingTasksAfterDeletion(parentId: string, deletedTaskId: string): Promise<void> {
    try {
      // Get all siblings with the same parent
      const siblings = await this.db.select()
        .from(tasks)
        .where(eq(tasks.parentId, parentId));

      // Extract the last part of the deleted ID
      const deletedParts = deletedTaskId.split('.');
      const deletedIndex = parseInt(deletedParts[deletedParts.length - 1], 10);

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
        await this.updateTaskId(oldId, newId);
      }
    } catch (error) {
      console.error('Error reordering siblings:', error);
    }
  }
  
  /**
   * Reorder root tasks after a deletion
   * @param deletedTaskId Deleted task ID
   */
  async reorderRootTasksAfterDeletion(deletedTaskId: string): Promise<void> {
    try {
      // Get all root tasks
      const rootTasks = await this.db.select()
        .from(tasks)
        .where(isNull(tasks.parentId));

      // The deleted ID is just a number for root tasks
      const deletedIndex = parseInt(deletedTaskId, 10);

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
          await this.updateTaskId(oldId, newId);
        }
      }
    } catch (error) {
      console.error('Error reordering root tasks:', error);
    }
  }
}