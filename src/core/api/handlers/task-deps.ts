/**
 * Dependencies Task command handler
 * Visualizes task dependencies in various formats
 */

import { BaseCommandHandler, CommandParams } from '@/core/api/command';
import { CommandContext } from '@/core/api/context';
import { TaskWithChildren } from '@/core/types';

/**
 * Parameters for dependency visualization
 */
export interface DepsTaskParams extends CommandParams {
  id?: string;
  depth?: number;
  direction?: string;
  format?: string;
  textStyle?: string;
  jsonStyle?: string;
  showMetadata?: boolean;
  useColor?: boolean;
}

/**
 * Dependencies Task command handler
 */
export class DepsTaskHandler extends BaseCommandHandler<DepsTaskParams, string | object> {
  constructor() {
    super('deps', 'Visualize task dependencies');
  }
  
  /**
   * Validate the parameters for dependency visualization
   */
  validateParams(params: DepsTaskParams): true | string {
    // Check format if provided
    if (params.format && !['text', 'json', 'dot', 'mermaid'].includes(params.format)) {
      return 'Format must be one of: text, json, dot, mermaid';
    }
    
    // Check text style if provided
    if (params.textStyle && !['simple', 'tree', 'detailed'].includes(params.textStyle)) {
      return 'Text style must be one of: simple, tree, detailed';
    }
    
    // Check JSON style if provided
    if (params.jsonStyle && !['flat', 'tree', 'graph'].includes(params.jsonStyle)) {
      return 'JSON style must be one of: flat, tree, graph';
    }
    
    // Check direction if provided
    if (params.direction && !['down', 'up', 'both'].includes(params.direction)) {
      return 'Direction must be one of: down, up, both';
    }
    
    // Check depth if provided
    if (params.depth !== undefined && (typeof params.depth !== 'number' || params.depth < 0)) {
      return 'Depth must be a non-negative number';
    }
    
    return true;
  }
  
  /**
   * Execute the dependency visualization command
   */
  async executeCommand(
    context: CommandContext,
    params: DepsTaskParams
  ): Promise<string | object> {
    // Get repository and graph from context
    const repo = context.getRepository();
    const graph = context.getGraph();
    
    // Set defaults
    const format = params.format || 'text';
    const textStyle = params.textStyle || 'tree';
    const jsonStyle = params.jsonStyle || 'graph';
    const showMetadata = params.showMetadata === true;
    const useColor = params.useColor === true;
    const direction = params.direction || 'down';
    const maxDepth = params.depth ?? Infinity;
    
    // Get tasks based on the specified dependencies
    let tasks: TaskWithChildren[] = [];
    
    if (params.id) {
      // Get specific task and its dependencies
      switch (direction) {
        case 'up':
          // Show parent relationships
          tasks = await this.getParentTree(repo, params.id, maxDepth);
          break;
          
        case 'down':
          // Show child relationships (default)
          tasks = await this.getTaskWithDescendants(repo, params.id, maxDepth);
          break;
          
        case 'both':
          // Show both parent and child relationships
          const descendants = await this.getTaskWithDescendants(repo, params.id, maxDepth);
          const ancestors = await this.getParentTree(repo, params.id, maxDepth);
          
          // Merge both trees
          tasks = [...descendants, ...ancestors.filter(task => 
            !descendants.some(d => d.id === task.id))];
          break;
      }
    } else {
      // Get all tasks in the hierarchy
      tasks = await repo.buildTaskHierarchy();
      
      // Apply depth limit if specified
      if (maxDepth !== Infinity) {
        tasks = this.limitHierarchyDepth(tasks, maxDepth);
      }
    }
    
    // Format based on the desired output format
    switch (format) {
      case 'json':
        // Format as JSON with specified style
        return await graph.formatHierarchyJson(tasks, jsonStyle);
        
      case 'dot':
        // Format as DOT for Graphviz
        return await graph.formatHierarchyDot(tasks);
        
      case 'mermaid':
        // Format as Mermaid flowchart
        return await graph.formatHierarchyMermaid(tasks);
        
      case 'text':
      default:
        // Format as text with specified style
        return await graph.formatHierarchyText(
          tasks,
          textStyle,
          { showMetadata, useColor }
        );
    }
  }
  
  /**
   * Get a task and all its descendants (child tasks)
   */
  private async getTaskWithDescendants(
    repo: any,
    taskId: string,
    maxDepth: number = Infinity,
    currentDepth: number = 0
  ): Promise<TaskWithChildren[]> {
    // Get the task
    const task = await repo.getTask(taskId);
    if (!task) return [];
    
    // Convert to TaskWithChildren
    const taskWithChildren: TaskWithChildren = {
      ...task,
      children: []
    };
    
    // If we haven't reached the max depth, get children
    if (currentDepth < maxDepth) {
      // Get child tasks
      const childTasks = await repo.getChildTasks(taskId);
      
      // Get descendants for each child recursively
      for (const childTask of childTasks) {
        const childDescendants = await this.getTaskWithDescendants(
          repo,
          childTask.id,
          maxDepth,
          currentDepth + 1
        );
        
        // Add to children
        if (childDescendants.length > 0) {
          taskWithChildren.children.push(childDescendants[0]);
        }
      }
    }
    
    return [taskWithChildren];
  }
  
  /**
   * Get the parent tree for a task
   */
  private async getParentTree(
    repo: any,
    taskId: string,
    maxDepth: number = Infinity,
    currentDepth: number = 0,
    visited: Set<string> = new Set()
  ): Promise<TaskWithChildren[]> {
    // Prevent circular references
    if (visited.has(taskId)) return [];
    visited.add(taskId);
    
    // Get the task
    const task = await repo.getTask(taskId);
    if (!task) return [];
    
    // Build the result
    const result: TaskWithChildren[] = [{
      ...task,
      children: []
    }];
    
    // If we haven't reached the max depth and the task has a parent, get the parent
    if (currentDepth < maxDepth && task.parentId) {
      const parentTree = await this.getParentTree(
        repo,
        task.parentId,
        maxDepth,
        currentDepth + 1,
        visited
      );
      
      if (parentTree.length > 0) {
        // Add this task as a child of its parent
        parentTree[0].children.push(result[0]);
        return parentTree;
      }
    }
    
    return result;
  }
  
  /**
   * Limit the hierarchy to a specified depth
   */
  private limitHierarchyDepth(
    tasks: TaskWithChildren[],
    maxDepth: number,
    currentDepth: number = 0
  ): TaskWithChildren[] {
    if (currentDepth >= maxDepth) {
      // Strip children at max depth
      return tasks.map(task => ({
        ...task,
        children: []
      }));
    }
    
    // Process children recursively
    return tasks.map(task => ({
      ...task,
      children: task.children 
        ? this.limitHierarchyDepth(task.children, maxDepth, currentDepth + 1)
        : []
    }));
  }
}