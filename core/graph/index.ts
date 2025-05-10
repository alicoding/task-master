/**
 * Task Graph - Core functionality for task hierarchy and visualization
 */

import { Task } from '../../db/schema.js';
import { TaskRepository } from '../repo.js';
import { TaskWithChildren } from '../types.js';
import { formatHierarchyText } from './formatters/text.js';
import { formatHierarchyJson } from './formatters/json.js';
import { formatHierarchyDot } from './formatters/dot.js';
import { formatHierarchyMermaid } from './formatters/mermaid.js';
import { isDescendant, findDescendants } from './utils.js';

/**
 * TaskGraph class for managing task hierarchy and visualization
 */
export class TaskGraph {
  private repo: TaskRepository;
  
  constructor(repo: TaskRepository) {
    this.repo = repo;
  }
  
  /**
   * Build a graph representation of tasks
   */
  async buildGraph(): Promise<Map<string, Set<string>>> {
    const tasks = await this.repo.getAllTasks();
    const graph = new Map<string, Set<string>>();
    
    // Initialize graph with empty adjacency sets
    tasks.forEach(task => {
      graph.set(task.id, new Set<string>());
    });
    
    // Add parent-child relationships to the graph
    tasks.forEach(task => {
      if (task.parentId && graph.has(task.parentId)) {
        graph.get(task.parentId)?.add(task.id);
      }
    });
    
    return graph;
  }
  
  /**
   * Format tasks for human-readable text display
   */
  async formatHierarchyText(
    tasks: TaskWithChildren[] = [],
    format: string = 'simple',
    options: any = {}
  ): Promise<string> {
    if (!tasks || tasks.length === 0) {
      const hierarchy = await this.repo.buildTaskHierarchy();
      tasks = hierarchy;
    }
    
    return formatHierarchyText(tasks, format, options);
  }
  
  /**
   * Format tasks for machine-readable JSON
   */
  async formatHierarchyJson(
    tasks: TaskWithChildren[] = [],
    format: string = 'flat'
  ): Promise<any> {
    if (!tasks || tasks.length === 0) {
      const hierarchy = await this.repo.buildTaskHierarchy();
      tasks = hierarchy;
    }
    
    return formatHierarchyJson(tasks, format);
  }
  
  /**
   * Format tasks in DOT format for Graphviz
   */
  async formatHierarchyDot(tasks: TaskWithChildren[] = []): Promise<string> {
    if (!tasks || tasks.length === 0) {
      const hierarchy = await this.repo.buildTaskHierarchy();
      tasks = hierarchy;
    }

    return formatHierarchyDot(tasks);
  }

  /**
   * Format tasks in Mermaid flowchart format
   */
  async formatHierarchyMermaid(tasks: TaskWithChildren[] = []): Promise<string> {
    if (!tasks || tasks.length === 0) {
      const hierarchy = await this.repo.buildTaskHierarchy();
      tasks = hierarchy;
    }

    return formatHierarchyMermaid(tasks);
  }
  
  /**
   * Get nodes in a subgraph starting from a root node
   */
  async getSubgraphNodes(rootId: string): Promise<Set<string>> {
    const graph = await this.buildGraph();
    const visited = new Set<string>();
    
    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      
      const neighbors = graph.get(nodeId) || new Set<string>();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }
    };
    
    dfs(rootId);
    return visited;
  }
  
  /**
   * Get all descendants of a task
   */
  async getDescendants(taskId: string): Promise<Task[]> {
    const allTasks = await this.repo.getAllTasks();
    return allTasks.filter(task => isDescendant(task.id, taskId));
  }
  
  /**
   * Handle task deletion and ID reassignment
   */
  async handleTaskDeletion(taskId: string): Promise<void> {
    // For now, implement a simplified version that only reorders sibling IDs
    // but doesn't attempt to rename tasks (this is safer and still delivers the reordering feature)
    const task = await this.repo.getTask(taskId);
    if (!task) return;
    
    // Get the parent ID
    const parentId = task.parentId;
    
    // Implement ordering behavior at the repository level to make it simpler and more reliable
    if (parentId) {
      // Reorder sibling IDs after deletion
      await this.repo.reorderSiblingTasksAfterDeletion(parentId, taskId);
    } else {
      // Reorder root tasks after deletion
      await this.repo.reorderRootTasksAfterDeletion(taskId);
    }
  }
}