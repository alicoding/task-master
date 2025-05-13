/**
 * Utility functions for task graph operations
 *
 * This module provides utility functions for working with task IDs and relationships
 * in the task graph. It includes functions for comparing task IDs, generating new IDs,
 * and identifying ancestor-descendant relationships between tasks.
 *
 * @module TaskGraphUtils
 */
import { Task } from '../../db/schema';
/**
 * Parse and compare task IDs
 *
 * Compares two task IDs based on their hierarchical structure (e.g., 1.2.3).
 * Task IDs are split into parts, and each part is compared numerically.
 * If all common parts are equal, the shorter ID comes first.
 *
 * @param {string} id1 - First task ID to compare
 * @param {string} id2 - Second task ID to compare
 * @returns {number} Negative if id1 < id2, positive if id1 > id2, zero if equal
 * @example
 * // Returns negative number (id1 < id2)
 * compareTaskIds('1.1', '1.2')
 *
 * // Returns positive number (id1 > id2)
 * compareTaskIds('1.2', '1.1')
 *
 * // Returns negative number (shorter ID comes first)
 * compareTaskIds('1', '1.1')
 */
export declare function compareTaskIds(id1: string, id2: string): number;
/**
 * Generate a new ID based on the old ID and an offset
 *
 * Creates a new task ID by adding an offset to the last part of the old ID.
 * For example, with oldId = '1.2' and offset = 1, the result is '1.3'.
 * The function throws an error if the resulting ID would have a non-positive last part.
 *
 * @param {string} oldId - The original task ID
 * @param {number} offset - The offset to add to the last part of the ID
 * @returns {string} The new task ID
 * @throws {Error} If the resulting ID would have a last part <= 0
 * @example
 * // Returns '1.3'
 * generateNewId('1.2', 1)
 *
 * // Returns '1.1.2'
 * generateNewId('1.1.1', 1)
 *
 * // Throws an error
 * generateNewId('1.1', -1)
 */
export declare function generateNewId(oldId: string, offset: number): string;
/**
 * Check if a task is a descendant of another
 *
 * Determines if one task is a descendant of another by comparing their IDs.
 * A task is considered a descendant if its ID starts with the potential ancestor's ID
 * followed by a dot. For example, task '1.1' is a descendant of task '1'.
 *
 * @param {string} taskId - The ID of the task to check
 * @param {string} potentialAncestorId - The ID of the potential ancestor task
 * @returns {boolean} True if taskId is a descendant of potentialAncestorId, false otherwise
 * @example
 * // Returns true
 * isDescendant('1.1', '1')
 *
 * // Returns true
 * isDescendant('1.1.2', '1')
 *
 * // Returns false
 * isDescendant('2.1', '1')
 *
 * // Returns false (a task is not its own descendant)
 * isDescendant('1', '1')
 */
export declare function isDescendant(taskId: string, potentialAncestorId: string): boolean;
/**
 * Find descendants in a collection of tasks
 *
 * Filters a collection of tasks to find all descendants of a specified ancestor.
 * Uses the isDescendant function to determine the relationship between tasks.
 *
 * @param {Task[]} tasks - Array of tasks to search through
 * @param {string} ancestorId - The ID of the ancestor task
 * @returns {Task[]} Array of tasks that are descendants of the specified ancestor
 * @example
 * // Returns [task1_1, task1_1_1, task1_2] (all descendants of task1)
 * findDescendants([task1, task1_1, task1_1_1, task1_2, task2], '1')
 */
export declare function findDescendants(tasks: Task[], ancestorId: string): Task[];
