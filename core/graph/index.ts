/**
 * Task Graph - Core functionality for task hierarchy and visualization
 *
 * This module provides the main functionality for task graph visualization and traversal.
 * It includes methods for building and querying task graphs, as well as formatting tasks
 * in various output formats (text, JSON, DOT, Mermaid) for visualization and export.
 *
 * @module TaskGraph
 */

import { Task } from '../../db/schema.ts';
import { TaskRepository } from '../repo.ts';
import { TaskWithChildren, HierarchyTask, TaskOperationResult, TaskError, TaskErrorCode } from '../types.ts';
import {
  formatHierarchyText,
  formatTaskView,
  formatTaskList,
  createUiConfig,
  parseCliOptions
} from './formatters/text.ts';
import { formatHierarchyJson } from './formatters/json.ts';
import { formatHierarchyDot } from './formatters/dot.ts';
import { formatHierarchyMermaid } from './formatters/mermaid.ts';
import { isDescendant, findDescendants } from './utils.ts';

/**
 * TaskGraph class for managing task hierarchy and visualization
 *
 * The TaskGraph class provides methods for building, traversing, and visualizing
 * task hierarchies. It allows for creating graph representations of tasks,
 * querying for task relationships, and formatting tasks in various output formats.
 *
 * @class
 */
export class TaskGraph {
  private repo: TaskRepository;

  constructor(repo: TaskRepository) {
    this.repo = repo;
  }

  /**
   * Build a graph representation of tasks
   *
   * Creates an adjacency list representation of the task hierarchy as a Map.
   * Each key in the map is a task ID, and the value is a Set of child task IDs.
   *
   * @returns {Promise<TaskOperationResult<Map<string, Set<string>>>>} A result object containing
   * the graph as a Map of task IDs to Sets of child task IDs, or an error if the operation fails
   */
  async buildGraph(): Promise<TaskOperationResult<Map<string, Set<string>>>> {
    try {
      const tasksResult = await this.repo.getAllTasks();

      if (!tasksResult.success || !tasksResult.data) {
        return {
          success: false,
          error: tasksResult.error || new TaskError('Failed to retrieve tasks', TaskErrorCode.DATABASE_ERROR)
        };
      }

      const tasks = tasksResult.data;
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

      return {
        success: true,
        data: graph
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error building graph: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Format tasks for human-readable text display
   *
   * Formats a hierarchy of tasks as a human-readable text representation.
   * If no tasks are provided, the method will attempt to build the task hierarchy first.
   *
   * @param {HierarchyTask[]} tasks - Optional array of hierarchy tasks to format
   * @param {string} format - The text format to use ('simple', 'tree', 'enhanced', etc.)
   * @param {any} options - Formatting options like color, unicode support, etc.
   * @returns {Promise<string>} A formatted text representation of the task hierarchy
   */
  async formatHierarchyText(
    tasks: HierarchyTask[] = [],
    format: string = 'enhanced', // Updated default format
    options: any = {}
  ): Promise<string> {
    if (!tasks || tasks.length === 0) {
      const hierarchyResult = await this.repo.buildTaskHierarchy();

      if (hierarchyResult.success && hierarchyResult.data) {
        tasks = hierarchyResult.data;
      } else {
        console.warn('Warning: Failed to build hierarchy, using empty tasks list');
        tasks = [];
      }
    }

    return formatHierarchyText(tasks, format, options);
  }

  /**
   * Format a single task with enhanced visual display
   *
   * Formats a single task with various display options, providing a detailed
   * view of the task's properties such as title, description, status, etc.
   *
   * @param {Task} task - The task to format
   * @param {string} format - The display format ('simple', 'boxed', 'polished', etc.)
   * @param {any} options - Formatting options like color, unicode support, etc.
   * @returns {Promise<string>} A formatted text representation of the task
   */
  async formatTaskView(
    task: Task,
    format: string = 'polished',
    options: any = {}
  ): Promise<string> {
    return formatTaskView(task, format, options);
  }

  /**
   * Format a list of tasks with enhanced visual display
   *
   * Formats a list of tasks with various display options, suitable for
   * displaying multiple tasks in a compact but informative way.
   *
   * @param {Task[]} tasks - Array of tasks to format
   * @param {string} format - The display format ('table', 'list', etc.)
   * @param {any} options - Formatting options like color, unicode support, etc.
   * @returns {Promise<string>} A formatted text representation of the task list
   */
  async formatTaskList(
    tasks: Task[],
    format: string = 'table',
    options: any = {}
  ): Promise<string> {
    return formatTaskList(tasks, format, options);
  }

  /**
   * Format tasks for machine-readable JSON
   *
   * Formats a hierarchy of tasks as a JSON representation, suitable for
   * machine processing or integration with other tools.
   * If no tasks are provided, the method will attempt to build the task hierarchy first.
   *
   * @param {HierarchyTask[]} tasks - Optional array of hierarchy tasks to format
   * @param {string} format - The JSON format to use ('flat', 'nested', etc.)
   * @returns {Promise<any>} A JSON representation of the task hierarchy
   */
  async formatHierarchyJson(
    tasks: HierarchyTask[] = [],
    format: string = 'flat'
  ): Promise<any> {
    if (!tasks || tasks.length === 0) {
      const hierarchyResult = await this.repo.buildTaskHierarchy();

      if (hierarchyResult.success && hierarchyResult.data) {
        tasks = hierarchyResult.data;
      } else {
        console.warn('Warning: Failed to build hierarchy, using empty tasks list');
        tasks = [];
      }
    }

    return formatHierarchyJson(tasks, format);
  }

  /**
   * Format tasks in DOT format for Graphviz
   *
   * Converts the task hierarchy to DOT graph description language,
   * which can be used with Graphviz to generate visual graphs.
   * If no tasks are provided, the method will attempt to build the task hierarchy first.
   *
   * @param {HierarchyTask[]} tasks - Optional array of hierarchy tasks to format
   * @returns {Promise<string>} A DOT language representation of the task hierarchy
   */
  async formatHierarchyDot(tasks: HierarchyTask[] = []): Promise<string> {
    if (!tasks || tasks.length === 0) {
      const hierarchyResult = await this.repo.buildTaskHierarchy();

      if (hierarchyResult.success && hierarchyResult.data) {
        tasks = hierarchyResult.data;
      } else {
        console.warn('Warning: Failed to build hierarchy, using empty tasks list');
        tasks = [];
      }
    }

    return formatHierarchyDot(tasks);
  }

  /**
   * Format tasks in Mermaid flowchart format
   *
   * Converts the task hierarchy to Mermaid flowchart syntax,
   * which can be used to generate visual flowcharts in Markdown documents.
   * If no tasks are provided, the method will attempt to build the task hierarchy first.
   *
   * @param {HierarchyTask[]} tasks - Optional array of hierarchy tasks to format
   * @returns {Promise<string>} A Mermaid flowchart representation of the task hierarchy
   */
  async formatHierarchyMermaid(tasks: HierarchyTask[] = []): Promise<string> {
    if (!tasks || tasks.length === 0) {
      const hierarchyResult = await this.repo.buildTaskHierarchy();

      if (hierarchyResult.success && hierarchyResult.data) {
        tasks = hierarchyResult.data;
      } else {
        console.warn('Warning: Failed to build hierarchy, using empty tasks list');
        tasks = [];
      }
    }

    return formatHierarchyMermaid(tasks);
  }

  /**
   * Get nodes in a subgraph starting from a root node
   *
   * Performs a depth-first search from the specified root node
   * and returns all nodes that can be reached from it.
   *
   * @param {string} rootId - The ID of the root node to start the search from
   * @returns {Promise<TaskOperationResult<Set<string>>>} A set of all node IDs in the subgraph
   */
  async getSubgraphNodes(rootId: string): Promise<TaskOperationResult<Set<string>>> {
    try {
      const graphResult = await this.buildGraph();

      if (!graphResult.success || !graphResult.data) {
        return {
          success: false,
          error: graphResult.error || new TaskError('Failed to build graph', TaskErrorCode.GENERAL_ERROR)
        };
      }

      const graph = graphResult.data;
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

      return {
        success: true,
        data: visited
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error getting subgraph nodes: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Get all descendants of a task
   *
   * Retrieves all tasks that are descendants of the specified task,
   * based on the task ID hierarchy (e.g., 1.1, 1.1.1 are descendants of 1).
   *
   * @param {string} taskId - The ID of the task whose descendants to retrieve
   * @returns {Promise<TaskOperationResult<Task[]>>} An array of all descendant tasks
   */
  async getDescendants(taskId: string): Promise<TaskOperationResult<Task[]>> {
    try {
      const tasksResult = await this.repo.getAllTasks();

      if (!tasksResult.success || !tasksResult.data) {
        return {
          success: false,
          error: tasksResult.error || new TaskError('Failed to retrieve tasks', TaskErrorCode.DATABASE_ERROR)
        };
      }

      const allTasks = tasksResult.data;
      const descendants = allTasks.filter(task => isDescendant(task.id, taskId));

      return {
        success: true,
        data: descendants
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error getting task descendants: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }

  /**
   * Handle task deletion and ID reassignment
   *
   * Manages the reordering of task IDs after a task is deleted,
   * ensuring that the task hierarchy remains consistent.
   * This implementation focuses on reordering sibling task IDs
   * to maintain a clean sequential numbering.
   *
   * @param {string} taskId - The ID of the task being deleted
   * @returns {Promise<TaskOperationResult<boolean>>} Success or failure of the operation
   */
  async handleTaskDeletion(taskId: string): Promise<TaskOperationResult<boolean>> {
    try {
      // For now, implement a simplified version that only reorders sibling IDs
      // but doesn't attempt to rename tasks (this is safer and still delivers the reordering feature)
      const taskResult = await this.repo.getTask(taskId);

      if (!taskResult.success || !taskResult.data) {
        return {
          success: false,
          error: taskResult.error || new TaskError(`Task with ID ${taskId} not found`, TaskErrorCode.NOT_FOUND)
        };
      }

      const task = taskResult.data;

      // Get the parent ID
      const parentId = task.parentId;

      // Implement ordering behavior at the repository level to make it simpler and more reliable
      if (parentId) {
        // Reorder sibling IDs after deletion
        const reorderResult = await this.repo.reorderSiblingTasksAfterDeletion(parentId, taskId);

        if (!reorderResult.success) {
          return reorderResult;
        }
      } else {
        // Reorder root tasks after deletion
        const reorderResult = await this.repo.reorderRootTasksAfterDeletion(taskId);

        if (!reorderResult.success) {
          return reorderResult;
        }
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error handling task deletion: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }
}