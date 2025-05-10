import { eq, isNull } from 'drizzle-orm';
import { BaseTaskRepository } from './base.js';
import { tasks, dependencies, Task, NewTask } from '../../db/schema.js';
import { TaskInsertOptions } from '../types.js';

/**
 * Task creation functionality for the TaskRepository
 */
export class TaskCreationRepository extends BaseTaskRepository {
  /**
   * Generate hierarchical task ID
   * @param options Task creation options
   * @returns Generated task ID
   */
  private async generateTaskId(options: TaskInsertOptions): Promise<string> {
    if (options.childOf) {
      const parent = await this.getTask(options.childOf);
      if (!parent) {
        throw new Error(`Parent task with ID ${options.childOf} not found`);
      }
      
      const siblings = await this.db.select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.parentId, options.childOf));
      
      return `${options.childOf}.${siblings.length + 1}`;
    }
    
    if (options.after) {
      const afterTask = await this.getTask(options.after);
      if (!afterTask) {
        throw new Error(`Task with ID ${options.after} not found`);
      }
      
      const parts = options.after.split('.');
      const lastPart = parseInt(parts[parts.length - 1], 10);
      
      // If it's a root-level task (e.g., "1")
      if (parts.length === 1) {
        return `${lastPart + 1}`;
      }
      
      // If it's a nested task (e.g., "1.2")
      const parentPrefix = parts.slice(0, -1).join('.');
      return `${parentPrefix}.${lastPart + 1}`;
    }
    
    // If it's a new root task
    const rootTasks = await this.db.select({ id: tasks.id })
      .from(tasks)
      .where(isNull(tasks.parentId));
    
    return `${rootTasks.length + 1}`;
  }
  
  /**
   * Create a new task
   * @param options Task creation options
   * @returns The created task
   */
  async createTask(options: TaskInsertOptions): Promise<Task> {
    const id = await this.generateTaskId(options);
    
    const newTask: NewTask = {
      id,
      title: options.title,
      status: options.status || 'todo',
      readiness: options.readiness || 'draft',
      tags: options.tags || [],
      parentId: options.childOf || null,
      metadata: options.metadata || {},
    };
    
    await this.db.insert(tasks).values(newTask);
    
    // If this task has relationships, add them
    if (options.childOf) {
      await this.db.insert(dependencies).values({
        fromTaskId: options.childOf,
        toTaskId: id,
        type: 'child',
      });
    }
    
    if (options.after) {
      await this.db.insert(dependencies).values({
        fromTaskId: options.after,
        toTaskId: id,
        type: 'after',
      });
    }
    
    return this.getTask(id) as Promise<Task>;
  }
  
  /**
   * Update a task's ID
   * @param oldId Current task ID
   * @param newId New task ID
   * @returns true if successful, false otherwise
   */
  async updateTaskId(oldId: string, newId: string): Promise<boolean> {
    // Get the task
    const task = await this.getTask(oldId);
    if (!task) {
      return false;
    }

    // Create a new task with the updated ID
    const newTask: NewTask = {
      ...task,
      id: newId
    };

    // Insert the new task
    try {
      await this.db.insert(tasks).values(newTask);

      // Update any dependency references where this task is a parent
      await this.db.update(tasks)
        .set({ parentId: newId })
        .where(eq(tasks.parentId, oldId));

      // Update any dependency references in the dependencies table
      await this.updateDependencyReferences(oldId, newId);

      // Also update any tasks with IDs that are children of this task
      // This is needed for cases where we rename a parent and need to rename all its children
      const allTasks = await this.getAllTasks();
      const childTaskPattern = `${oldId}.`;

      // Find all tasks that start with the old ID followed by a dot
      const childTasks = allTasks.filter(t => t.id.startsWith(childTaskPattern));

      // Update each child task ID
      for (const childTask of childTasks) {
        const childOldId = childTask.id;
        const childNewId = childTask.id.replace(childTaskPattern, `${newId}.`);

        // Recursive call to update this child's ID
        console.log(`Updating child task ID from ${childOldId} to ${childNewId}`);
        await this.updateTaskId(childOldId, childNewId);
      }

      // Delete the old task
      await this.db.delete(tasks)
        .where(eq(tasks.id, oldId));

      return true;
    } catch (error) {
      console.error('Error updating task ID:', error);
      return false;
    }
  }
  
  /**
   * Update dependency references
   * @param oldId Old task ID
   * @param newId New task ID
   */
  async updateDependencyReferences(oldId: string, newId: string): Promise<void> {
    // Update from task ID references
    await this.db.update(dependencies)
      .set({ fromTaskId: newId })
      .where(eq(dependencies.fromTaskId, oldId));
    
    // Update to task ID references
    await this.db.update(dependencies)
      .set({ toTaskId: newId })
      .where(eq(dependencies.toTaskId, oldId));
  }
}