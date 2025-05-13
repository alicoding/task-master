/**
 * Task Graph - Core functionality for task hierarchy and visualization
 *
 * This module provides the main functionality for task graph visualization and traversal.
 * It includes methods for building and querying task graphs, as well as formatting tasks
 * in various output formats (text, JSON, DOT, Mermaid) for visualization and export.
 *
 * @module TaskGraph
 */
import { Task } from '../../db/schema';
import { TaskRepository } from '../repo';
import { HierarchyTask, TaskOperationResult } from '../types';
/**
 * TaskGraph class for managing task hierarchy and visualization
 *
 * The TaskGraph class provides methods for building, traversing, and visualizing
 * task hierarchies. It allows for creating graph representations of tasks,
 * querying for task relationships, and formatting tasks in various output formats.
 *
 * @class
 */
export declare class TaskGraph {
    private repo;
    constructor(repo: TaskRepository);
    /**
     * Build a graph representation of tasks
     *
     * Creates an adjacency list representation of the task hierarchy as a Map.
     * Each key in the map is a task ID, and the value is a Set of child task IDs.
     *
     * @returns {Promise<TaskOperationResult<Map<string, Set<string>>>>} A result object containing
     * the graph as a Map of task IDs to Sets of child task IDs, or an error if the operation fails
     */
    buildGraph(): Promise<TaskOperationResult<Map<string, Set<string>>>>;
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
    formatHierarchyText(tasks?: HierarchyTask[], format?: string, // Updated default format
    options?: any): Promise<string>;
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
    formatTaskView(task: Task, format?: string, options?: any): Promise<string>;
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
    formatTaskList(tasks: Task[], format?: string, options?: any): Promise<string>;
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
    formatHierarchyJson(tasks?: HierarchyTask[], format?: string): Promise<any>;
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
    formatHierarchyDot(tasks?: HierarchyTask[]): Promise<string>;
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
    formatHierarchyMermaid(tasks?: HierarchyTask[]): Promise<string>;
    /**
     * Get nodes in a subgraph starting from a root node
     *
     * Performs a depth-first search from the specified root node
     * and returns all nodes that can be reached from it.
     *
     * @param {string} rootId - The ID of the root node to start the search from
     * @returns {Promise<TaskOperationResult<Set<string>>>} A set of all node IDs in the subgraph
     */
    getSubgraphNodes(rootId: string): Promise<TaskOperationResult<Set<string>>>;
    /**
     * Get all descendants of a task
     *
     * Retrieves all tasks that are descendants of the specified task,
     * based on the task ID hierarchy (e.g., 1.1, 1.1.1 are descendants of 1).
     *
     * @param {string} taskId - The ID of the task whose descendants to retrieve
     * @returns {Promise<TaskOperationResult<Task[]>>} An array of all descendant tasks
     */
    getDescendants(taskId: string): Promise<TaskOperationResult<Task[]>>;
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
    handleTaskDeletion(taskId: string): Promise<TaskOperationResult<boolean>>;
}
