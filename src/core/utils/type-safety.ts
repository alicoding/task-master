/**
 * Type safety utilities for common TypeScript error patterns
 * 
 * This module provides utility functions and type guards to handle
 * common TypeScript error patterns in a systematic way.
 */

import { Task, TaskStatus, TaskReadiness } from '../types';

/**
 * Type for operation results that may contain data
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Safely access properties from objects that might be undefined or null
 * @param obj The object to access properties from
 * @param path The dot-notation path to the property
 * @param defaultValue Default value to return if property is not found
 */
export function safeAccess<T>(obj: any, path: string, defaultValue: T): T {
  if (!obj) return defaultValue;
  
  const parts = path.split('.');
  let current: any = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    
    // Handle string JSON metadata
    if (part === 'metadata' && typeof current[part] === 'string') {
      try {
        current = JSON.parse(current[part]);
      } catch (e) {
        return defaultValue;
      }
    } else {
      current = current[part];
    }
  }
  
  return current === undefined || current === null ? defaultValue : current;
}

/**
 * Type guard to check if a value is not null or undefined
 */
export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a result has data
 */
export function hasData<T>(result: OperationResult<T>): result is OperationResult<T> & { data: T } {
  return result.success && isNonNull(result.data);
}

/**
 * Get data safely from an operation result
 */
export function getOperationData<T>(result: OperationResult<T>, defaultValue: T): T {
  return hasData(result) ? result.data : defaultValue;
}

/**
 * Safely convert a string to TaskStatus type
 */
export function asTaskStatus(status: string): TaskStatus {
  const validStatuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
  return validStatuses.includes(status as TaskStatus) 
    ? (status as TaskStatus) 
    : 'todo';
}

/**
 * Safely convert a string to TaskReadiness type
 */
export function asTaskReadiness(readiness: string): TaskReadiness {
  const validReadiness: TaskReadiness[] = ['draft', 'ready', 'blocked'];
  return validReadiness.includes(readiness as TaskReadiness) 
    ? (readiness as TaskReadiness) 
    : 'draft';
}

/**
 * Safely parse JSON metadata
 */
export function parseMetadata<T = any>(metadata: unknown): T {
  if (!metadata) return {} as T;
  
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as T;
    } catch (e) {
      return {} as T;
    }
  }
  
  return metadata as T;
}

/**
 * Safely format tags array, handling null values
 */
export function formatTags(
  tags: string[] | null | undefined, 
  formatter?: (tag: string) => string,
  emptyText: string = 'none'
): string {
  if (!tags || tags.length === 0) {
    return emptyText;
  }
  
  return formatter 
    ? tags.map(tag => formatter(tag)).join(', ')
    : tags.join(', ');
}

/**
 * Type assertion for unknown types
 */
export function asType<T>(value: unknown): T {
  return value as T;
}

/**
 * Extract specific task data safely from a TaskOperationResult
 */
export function getTaskData<K extends keyof Task>(
  result: OperationResult<Task>, 
  key: K, 
  defaultValue: Task[K]
): Task[K] {
  if (!hasData(result)) return defaultValue;
  return isNonNull(result.data[key]) ? result.data[key] : defaultValue;
}

/**
 * Create an index signature for a plain object
 */
export function asIndexable<T extends Record<string, any>>(obj: T): { [key: string]: any } & T {
  return obj;
}