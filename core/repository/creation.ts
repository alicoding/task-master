import { eq, isNull } from 'drizzle-orm';
import { BaseTaskRepository } from './base';
import { tasks, dependencies, Task, NewTask } from '../../db/schema';
import { TaskInsertOptions, TaskOperationResult, TaskError, TaskErrorCode } from '../types';
import { tasks, dependencies, Task, NewTask } from '../../db/schema';
import { tasks, dependencies, Task, NewTask } from '../../db/schema';

/**
 * Task creation functionality for the TaskRepository
 */
export class TaskCreationRepository extends BaseTaskRepository {
  /**
   * Generate hierarchical task ID
   * @param options Task creation options
   * @returns TaskOperationResult containing the generated task ID or an error
   */
  private async generateTaskId(options: TaskInsertOptions): Promise<TaskOperationResult<string>> {
    try {
      if (options.childOf) {
        try {
          // For compatibility during migration, use a direct SQL query to check parent
          const parent = this.sqlite.prepare(
            'SELECT id FROM tasks WHERE id = ?'
          ).get(options.childOf);

          if (!parent) {
            return {
              success: false,
              error: new TaskError(
                `Parent task with ID ${options.childOf} not found`,
                TaskErrorCode.NOT_FOUND
              )
            };
          }
        } catch (error) {
          return {
            success: false,
            error: new TaskError(
              `Error checking parent task: ${error instanceof Error ? error.message : 'Unknown error'}`,
              TaskErrorCode.DATABASE_ERROR
            )
          };
        }

        // Use direct SQL for siblings to avoid drizzle issues
        // Query the database to count how many existing child tasks there are
        // Fix for SQLite query - use single quotes for literal '.' character
        const result = this.sqlite.prepare(
          "SELECT MAX(CAST(SUBSTR(id, INSTR(id, '.') + 1) AS INTEGER)) as max_child_num FROM tasks WHERE parent_id = ? OR id LIKE ?"
        ).get(options.childOf, `${options.childOf}.%`);

        console.log('Child task query result:', JSON.stringify(result));

        // Additional direct query to see all child tasks
        const allChildTasks = this.sqlite.prepare(
          'SELECT id, title, parent_id FROM tasks WHERE parent_id = ? OR id LIKE ?'
        ).all(options.childOf, `${options.childOf}.%`);

        console.log('All child tasks:', JSON.stringify(allChildTasks));

        const maxChildNum = result && result['max_child_num'] ? parseInt(result['max_child_num'], 10) : 0;
        console.log(`Max child number found: ${maxChildNum}, next child ID will be: ${options.childOf}.${maxChildNum + 1}`);

        return {
          success: true,
          data: `${options.childOf}.${maxChildNum + 1}`
        };
      }

      if (options.after) {
        const afterTaskResult = await this.getTask(options.after);

        if (!afterTaskResult.success || !afterTaskResult.data) {
          return {
            success: false,
            error: new TaskError(
              `Task with ID ${options.after} not found`,
              TaskErrorCode.NOT_FOUND
            )
          };
        }

        const parts = options.after.split('.');
        const lastPart = parseInt(parts[parts.length - 1], 10);

        if (isNaN(lastPart)) {
          return {
            success: false,
            error: new TaskError(
              `Invalid task ID format: ${options.after}`,
              TaskErrorCode.INVALID_INPUT
            )
          };
        }

        // If it's a root-level task (e.g., "1")
        if (parts.length === 1) {
          return {
            success: true,
            data: `${lastPart + 1}`
          };
        }

        // If it's a nested task (e.g., "1.2")
        const parentPrefix = parts.slice(0, -1).join('.');
        return {
          success: true,
          data: `${parentPrefix}.${lastPart + 1}`
        };
      }

      // If it's a new root task - use a direct SQL statement with sqlite
      const rootTasks = this.sqlite.prepare(
        'SELECT id FROM tasks WHERE parent_id IS NULL'
      ).all();

      return {
        success: true,
        data: `${rootTasks.length + 1}`
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error generating task ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }
  
  /**
   * Create a new task
   * @param options Task creation options
   * @returns TaskOperationResult containing the created task or an error
   */
  async createTask(options: TaskInsertOptions): Promise<TaskOperationResult<Task>> {
    try {
      if (!options.title) {
        return {
          success: false,
          error: new TaskError('Task title is required', TaskErrorCode.INVALID_INPUT)
        };
      }

      const idResult = await this.generateTaskId(options);

      if (!idResult.success || !idResult.data) {
        return {
          success: false,
          error: idResult.error || new TaskError(
            'Failed to generate task ID',
            TaskErrorCode.GENERAL_ERROR
          )
        };
      }

      const id = idResult.data;

      // Process the metadata to ensure proper JSON structure
      let metadataValue = {};

      if (options.metadata) {
        if (typeof options.metadata === 'string') {
          try {
            // If metadata is already a string, parse it
            metadataValue = JSON.parse(options.metadata);
          } catch (e) {
            console.warn('Warning: Invalid JSON metadata string, using empty object');
          }
        } else {
          try {
            // Ensure proper serialization/deserialization to fix object structure
            // This prevents the "string key index" issue with objects
            metadataValue = JSON.parse(JSON.stringify(options.metadata));
          } catch (e) {
            console.warn('Warning: Failed to process metadata, using empty object');
          }
        }
      }

      let newTask: NewTask = {
        id,
        title: options.title,
        status: options.status || 'todo',
        readiness: options.readiness || 'draft',
        tags: options.tags ? (Array.isArray(options.tags) ? options.tags : [options.tags]) : [],
        parentId: options.childOf || null,
        metadata: metadataValue,
      };

      // Debug info
      console.log(`Creating task with ID: ${id}, Parent ID: ${options.childOf || 'none'}, Title: ${options.title}`);

      // Add description and body fields safely (they might not exist in older DB schemas)
      try {
        newTask = {
          ...newTask,
          description: options.description || null,
          body: options.body || null
        };
      } catch (e) {
        console.warn('Warning: Description/body fields not available. Please run database migration.');
      }

      await this.db.insert(tasks).values(newTask);

      // If this task has relationships, add them
      if (options.childOf) {
        try {
          // Skip the ORM and use direct SQL
          console.log(`Creating dependency: Parent=${options.childOf}, Child=${id}`);

          try {
            this.sqlite.prepare(
              'INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES (?, ?, ?)'
            ).run(options.childOf, id, 'child');
            console.log('Dependency created successfully with direct SQL');
          } catch (sqlError) {
            console.error(`SQL Error creating dependency: ${sqlError instanceof Error ? sqlError.message : 'Unknown error'}`);
          }
        } catch (error) {
          console.warn(`Warning: Could not create dependency relationship: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue even if dependency creation fails - the task itself is still created
        }
      }

      if (options.after) {
        try {
          // Skip the ORM and use direct SQL
          console.log(`Creating after dependency: Previous=${options.after}, Next=${id}`);

          try {
            this.sqlite.prepare(
              'INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES (?, ?, ?)'
            ).run(options.after, id, 'after');
            console.log('After dependency created successfully with direct SQL');
          } catch (sqlError) {
            console.error(`SQL Error creating after dependency: ${sqlError instanceof Error ? sqlError.message : 'Unknown error'}`);
          }
        } catch (error) {
          console.warn(`Warning: Could not create after dependency relationship: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue even if dependency creation fails - the task itself is still created
        }
      }

      const taskResult = await this.getTask(id);

      if (!taskResult.success || !taskResult.data) {
        return {
          success: false,
          error: taskResult.error || new TaskError(
            `Task was created but could not be retrieved with ID ${id}`,
            TaskErrorCode.DATABASE_ERROR
          )
        };
      }

      return {
        success: true,
        data: taskResult.data
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   * @param options Task creation options
   * @returns The created task or undefined if there was an error
   */
  async createTaskLegacy(options: TaskInsertOptions): Promise<Task | undefined> {
    const result = await this.createTask(options);
    return result.success && result.data ? result.data : undefined;
  }
  
  /**
   * Update a task's ID
   * @param oldId Current task ID
   * @param newId New task ID
   * @returns TaskOperationResult indicating success or failure
   */
  async updateTaskId(oldId: string, newId: string): Promise<TaskOperationResult<boolean>> {
    try {
      if (!oldId || typeof oldId !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid old task ID', TaskErrorCode.INVALID_INPUT)
        };
      }

      if (!newId || typeof newId !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid new task ID', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Get the task
      const taskResult = await this.getTask(oldId);

      if (!taskResult.success || !taskResult.data) {
        return {
          success: false,
          error: taskResult.error || new TaskError(
            `Task with ID ${oldId} not found`,
            TaskErrorCode.NOT_FOUND
          )
        };
      }

      const task = taskResult.data;

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
        const dependenciesResult = await this.updateDependencyReferences(oldId, newId);

        if (!dependenciesResult.success) {
          console.error(`Warning: Failed to update dependency references: ${dependenciesResult.error?.message}`);
          // Continue with the update even if this part failed
        }

        // Also update any tasks with IDs that are children of this task
        // This is needed for cases where we rename a parent and need to rename all its children
        const allTasksResult = await this.getAllTasks();

        if (!allTasksResult.success || !allTasksResult.data) {
          // Even if this fails, we've already done the main update, so log and continue
          console.error('Warning: Could not update child tasks - getAllTasks failed');
        } else {
          const allTasks = allTasksResult.data;
          const childTaskPattern = `${oldId}.`;

          // Find all tasks that start with the old ID followed by a dot
          const childTasks = allTasks.filter(t => t.id.startsWith(childTaskPattern));

          // Update each child task ID
          for (const childTask of childTasks) {
            const childOldId = childTask.id;
            const childNewId = childTask.id.replace(childTaskPattern, `${newId}.`);

            // Recursive call to update this child's ID
            console.log(`Updating child task ID from ${childOldId} to ${childNewId}`);
            const childUpdateResult = await this.updateTaskId(childOldId, childNewId);

            if (!childUpdateResult.success) {
              console.error(`Warning: Failed to update child task ID from ${childOldId} to ${childNewId}: ${childUpdateResult.error?.message}`);
              // Continue with other updates even if this one failed
            }
          }
        }

        // Delete the old task
        await this.db.delete(tasks)
          .where(eq(tasks.id, oldId));

        return { success: true, data: true };
      } catch (error) {
        console.error('Error updating task ID:', error);
        return {
          success: false,
          error: new TaskError(
            `Database error updating task ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
            TaskErrorCode.DATABASE_ERROR
          )
        };
      }
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error updating task ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   * @param oldId Current task ID
   * @param newId New task ID
   * @returns true if successful, false otherwise
   */
  async updateTaskIdLegacy(oldId: string, newId: string): Promise<boolean> {
    const result = await this.updateTaskId(oldId, newId);
    return result.success && result.data ? result.data : false;
  }
  
  /**
   * Update dependency references
   * @param oldId Old task ID
   * @param newId New task ID
   * @returns TaskOperationResult indicating success or failure
   */
  async updateDependencyReferences(oldId: string, newId: string): Promise<TaskOperationResult<void>> {
    try {
      if (!oldId || typeof oldId !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid old task ID', TaskErrorCode.INVALID_INPUT)
        };
      }

      if (!newId || typeof newId !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid new task ID', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Update from task ID references
      await this.db.update(dependencies)
        .set({ from_task_id: newId })
        .where(eq(dependencies.from_task_id, oldId));

      // Update to task ID references
      await this.db.update(dependencies)
        .set({ to_task_id: newId })
        .where(eq(dependencies.to_task_id, oldId));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error updating dependency references: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   * @param oldId Old task ID
   * @param newId New task ID
   */
  async updateDependencyReferencesLegacy(oldId: string, newId: string): Promise<void> {
    const result = await this.updateDependencyReferences(oldId, newId);
    if (!result.success) {
      console.error(`Warning: Failed to update dependency references: ${result.error?.message}`);
    }
  }
}