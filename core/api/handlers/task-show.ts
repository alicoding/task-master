/**
 * Show Task command handler
 * Retrieves a task or list of tasks with flexible formatting
 */

import { BaseCommandHandler, CommandParams } from '../command.js';
import { CommandContext } from '../context.js';
import { Task, TaskWithChildren } from '../../types.js';

/**
 * Parameters for showing tasks
 */
export interface ShowTaskParams extends CommandParams {
  id?: string;
  format?: string;
  includeChildren?: boolean;
  includeParents?: boolean;
  includeMetadata?: boolean;
}

/**
 * Show task result - can be a single task, list, or hierarchical structure
 */
export type ShowTaskResult = 
  | Task
  | TaskWithChildren
  | Task[]
  | TaskWithChildren[]
  | { task: Task, children: Task[], parents: Task[] };

/**
 * Show Task command handler
 */
export class ShowTaskHandler extends BaseCommandHandler<ShowTaskParams, ShowTaskResult> {
  constructor() {
    super('show', 'Show task(s) details');
  }
  
  /**
   * Execute the show task command
   */
  async executeCommand(
    context: CommandContext,
    params: ShowTaskParams
  ): Promise<ShowTaskResult> {
    // Get repository from context
    const repo = context.getRepository();
    
    // If an ID is provided, show a specific task
    if (params.id) {
      // Get the task
      const task = await repo.getTask(params.id);
      if (!task) {
        throw new Error(`Task ${params.id} not found`);
      }
      
      // If we need to include children or parents
      if (params.includeChildren || params.includeParents) {
        const result: { task: Task, children: Task[], parents: Task[] } = {
          task,
          children: [],
          parents: []
        };
        
        // Get children if requested
        if (params.includeChildren) {
          result.children = await repo.getChildTasks(params.id);
        }
        
        // Get parents if requested
        if (params.includeParents) {
          // Build parent chain
          const parents: Task[] = [];
          let currentId = task.parentId;
          
          while (currentId) {
            const parentTask = await repo.getTask(currentId);
            if (!parentTask) break;
            
            parents.unshift(parentTask); // Add to beginning of array
            currentId = parentTask.parentId;
          }
          
          result.parents = parents;
        }
        
        return result;
      }
      
      // Otherwise just return the task
      return task;
    }
    
    // If no ID is provided, show all tasks
    // Handle different format options
    if (params.format === 'hierarchy' || params.format === 'tree') {
      // Return hierarchical structure
      return await repo.buildTaskHierarchy();
    }
    
    // Return flat list of all tasks
    return await repo.getAllTasks();
  }
}