/**
 * Remove Task command handler
 * Deletes a task from the system
 */

import { BaseCommandHandler, CommandParams } from '@/core/api/command';
import { CommandContext } from '@/core/api/context';

/**
 * Parameters for removing a task
 */
export interface RemoveTaskParams extends CommandParams {
  id: string;
  force?: boolean;
}

/**
 * Remove task result
 */
export interface RemoveTaskResult {
  id: string;
  success: boolean;
  message: string;
  childrenRemoved?: number;
}

/**
 * Remove Task command handler
 */
export class RemoveTaskHandler extends BaseCommandHandler<RemoveTaskParams, RemoveTaskResult> {
  constructor() {
    super('remove', 'Remove a task');
  }
  
  /**
   * Validate the parameters for removing a task
   */
  validateParams(params: RemoveTaskParams): true | string {
    if (!params.id || typeof params.id !== 'string') {
      return 'Task ID is required';
    }
    
    return true;
  }
  
  /**
   * Execute the remove task command
   */
  async executeCommand(
    context: CommandContext,
    params: RemoveTaskParams
  ): Promise<RemoveTaskResult> {
    // Get repository from context
    const repo = context.getRepository();
    const graph = context.getGraph();
    
    // Check if task exists
    const task = await repo.getTask(params.id);
    if (!task) {
      throw new Error(`Task ${params.id} not found`);
    }
    
    // Get child tasks
    const descendants = await graph.getDescendants(params.id);
    const hasChildren = descendants.length > 0;
    
    // Verify if we can remove this task
    if (hasChildren && !params.force) {
      return {
        id: params.id,
        success: false,
        message: `Task has ${descendants.length} descendants. Use 'force' parameter to remove them all.`
      };
    }
    
    // If this is a dry run, just return the result without making changes
    if (context.isDryRunMode()) {
      return {
        id: params.id,
        success: true,
        message: `Dry run: Would remove task ${params.id}${hasChildren ? ` and ${descendants.length} descendants` : ''}`,
        childrenRemoved: hasChildren ? descendants.length : 0
      };
    }
    
    // Remove the task and all its descendants if force is true
    if (params.force && hasChildren) {
      // Remove all descendants first
      for (const descendant of descendants) {
        await repo.removeTask(descendant.id);
      }
    }
    
    // Remove the task itself
    await repo.removeTask(params.id);
    
    // Handle ID ordering reindexing
    await graph.handleTaskDeletion(params.id);
    
    return {
      id: params.id,
      success: true,
      message: `Task ${params.id} removed successfully${hasChildren && params.force ? ` along with ${descendants.length} descendants` : ''}`,
      childrenRemoved: hasChildren && params.force ? descendants.length : 0
    };
  }
}