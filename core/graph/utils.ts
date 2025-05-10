/**
 * Utility functions for task graph operations
 */

import { Task } from '../../db/schema.js';
import { TaskWithChildren } from '../types.js';

/**
 * Parse and compare task IDs
 */
export function compareTaskIds(id1: string, id2: string): number {
  const parts1 = id1.split('.').map(Number);
  const parts2 = id2.split('.').map(Number);
  
  // Compare each part of the ID
  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] !== parts2[i]) {
      return parts1[i] - parts2[i];
    }
  }
  
  // If all common parts are equal, the shorter ID comes first
  return parts1.length - parts2.length;
}

/**
 * Generate a new ID based on the old ID and an offset
 */
export function generateNewId(oldId: string, offset: number): string {
  const parts = oldId.split('.');
  const lastPart = parseInt(parts.pop() || '0', 10);
  const newLastPart = lastPart + offset;
  
  // Don't allow negative or zero values for the last part
  if (newLastPart <= 0) {
    throw new Error(`Invalid ID generation: ${oldId} with offset ${offset}`);
  }
  
  return [...parts, newLastPart.toString()].join('.');
}

/**
 * Check if a task is a descendant of another
 */
export function isDescendant(taskId: string, potentialAncestorId: string): boolean {
  // A task is a descendant if its ID starts with the ancestor's ID followed by a dot
  return taskId.startsWith(potentialAncestorId + '.');
}

/**
 * Find descendants in a collection of tasks
 */
export function findDescendants(tasks: Task[], ancestorId: string): Task[] {
  return tasks.filter(task => isDescendant(task.id, ancestorId));
}