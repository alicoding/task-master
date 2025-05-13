/**
 * Graph Task command handler
 * Visualizes task hierarchy in various formats
 */

import { BaseCommandHandler, CommandParams } from '@/core/api/command';
import { CommandContext } from '@/core/api/context';

/**
 * Parameters for graph visualization
 */
export interface GraphTaskParams extends CommandParams {
  format?: string;
  textStyle?: string;
  jsonStyle?: string;
  showMetadata?: boolean;
  useColor?: boolean;
  filter?: string[];
  status?: string;
  readiness?: string;
  rootId?: string;
}

/**
 * Graph Task command handler
 */
export class GraphTaskHandler extends BaseCommandHandler<GraphTaskParams, string | object> {
  constructor() {
    super('graph', 'Visualize task hierarchy as a graph');
  }
  
  /**
   * Validate the parameters for graph visualization
   */
  validateParams(params: GraphTaskParams): true | string {
    // Check format if provided
    if (params.format && !['text', 'json', 'dot', 'mermaid'].includes(params.format)) {
      return 'Format must be one of: text, json, dot, mermaid';
    }
    
    // Check text style if provided
    if (params.textStyle && !['simple', 'tree', 'detailed', 'compact'].includes(params.textStyle)) {
      return 'Text style must be one of: simple, tree, detailed, compact';
    }
    
    // Check JSON style if provided
    if (params.jsonStyle && !['flat', 'tree', 'graph', 'ai'].includes(params.jsonStyle)) {
      return 'JSON style must be one of: flat, tree, graph, ai';
    }
    
    // Check status if provided
    if (params.status && !['todo', 'in-progress', 'done'].includes(params.status)) {
      return 'Status must be one of: todo, in-progress, done';
    }
    
    // Check readiness if provided
    if (params.readiness && !['draft', 'ready', 'blocked'].includes(params.readiness)) {
      return 'Readiness must be one of: draft, ready, blocked';
    }
    
    return true;
  }
  
  /**
   * Execute the graph visualization command
   */
  async executeCommand(
    context: CommandContext,
    params: GraphTaskParams
  ): Promise<string | object> {
    // Get repository and graph from context
    const repo = context.getRepository();
    const graph = context.getGraph();
    
    // Set defaults
    const format = params.format || 'text';
    const textStyle = params.textStyle || 'tree';
    const jsonStyle = params.jsonStyle || 'tree';
    const showMetadata = params.showMetadata === true;
    const useColor = params.useColor === true;
    
    // Get the task hierarchy
    let tasks = await repo.buildTaskHierarchy();
    
    // Filter by root ID if provided
    if (params.rootId) {
      // Find the specific subtree
      const rootTask = tasks.find(task => task.id === params.rootId);
      if (!rootTask) {
        throw new Error(`Root task ${params.rootId} not found`);
      }
      tasks = [rootTask];
    }
    
    // Apply filters if provided
    if (params.filter || params.status || params.readiness) {
      tasks = this.filterTasks(tasks, {
        tags: params.filter,
        status: params.status,
        readiness: params.readiness
      });
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
   * Filter tasks based on specified criteria
   */
  private filterTasks(tasks: any[], filters: { 
    tags?: string[], 
    status?: string, 
    readiness?: string 
  }): any[] {
    return tasks.filter(task => {
      let keep = true;
      
      // Filter by tags if provided
      if (filters.tags && filters.tags.length > 0) {
        const taskTags = task.tags || [];
        // Task matches if it has any of the specified tags
        keep = filters.tags.some(tag => taskTags.includes(tag));
      }
      
      // Filter by status if provided
      if (keep && filters.status) {
        keep = task.status === filters.status;
      }
      
      // Filter by readiness if provided
      if (keep && filters.readiness) {
        keep = task.readiness === filters.readiness;
      }
      
      // Process children
      if (task.children && task.children.length > 0) {
        task.children = this.filterTasks(task.children, filters);
        
        // Keep parent if it has matching children, even if it doesn't match the filters
        if (!keep && task.children.length > 0) {
          keep = true;
        }
      }
      
      return keep;
    });
  }
}