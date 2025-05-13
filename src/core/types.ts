import { tasks, dependencies } from '@/db/schema';

// Use type inference for table types
// Keep this as a private type to avoid duplicate export errors
type TaskBase = typeof tasks.$inferSelect;

/**
 * Task interface that extends the inferred database type
 * This is the main Task interface used throughout the codebase
 * Re-exported to ensure TypeScript recognizes it as an exported interface
 */
export interface Task extends TaskBase {
  // Additional properties can be added here if needed
}
export type NewTask = typeof tasks.$inferInsert;
export type Dependency = typeof dependencies.$inferSelect;
export type NewDependency = typeof dependencies.$inferInsert;

/**
 * Valid task status values
 */
export type TaskStatus = 'todo' | 'in-progress' | 'done';

/**
 * Valid task readiness values
 */
export type TaskReadiness = 'draft' | 'ready' | 'blocked';

/**
 * Dependency relationship types between tasks
 */
export type DependencyType = 'child' | 'after' | 'sibling';

/**
 * Task object with nested children tasks
 */
export interface TaskWithChildren extends Task {
  children?: TaskWithChildren[];
}

/**
 * Typed metadata for tasks
 */
export interface TaskMetadata {
  priority?: number;
  dueDate?: string;
  completionDate?: string;
  tags?: string[];
  assignee?: string;
  effort?: number;
  notes?: string;
  [key: string]: unknown;
}

/**
 * Filters for searching tasks
 */
export interface SearchFilters {
  status?: TaskStatus | TaskStatus[];
  readiness?: TaskReadiness | TaskReadiness[];
  tags?: string[];
  query?: string;
  metadata?: Partial<TaskMetadata>;
}

/**
 * Options for creating a new task
 */
export interface TaskInsertOptions {
  title: string;
  description?: string;
  body?: string;
  childOf?: string;
  after?: string;
  status?: TaskStatus;
  readiness?: TaskReadiness;
  tags?: string[];
  metadata?: Partial<TaskMetadata>;
}

/**
 * Options for updating an existing task
 */
export interface TaskUpdateOptions {
  id: string;
  title?: string;
  description?: string;
  body?: string;
  status?: TaskStatus;
  readiness?: TaskReadiness;
  tags?: string[];
  metadata?: Partial<TaskMetadata> | null;
}

/**
 * Output format for commands
 */
export type OutputFormat = 'text' | 'json' | 'dot' | 'mermaid';

/**
 * Global configuration for TaskMaster
 */
export interface TaskMasterConfig {
  dbPath: string;
  inMemory: boolean;
  debugMode?: boolean;
  aiProvider?: string;
  maxResults?: number;
}

/**
 * Result of a task operation
 */
export interface TaskOperationResult<T> {
  success: boolean;
  data?: T;
  error?: TaskError;
}

/**
 * Custom error types for task operations
 */
export class TaskError extends Error {
  public code: TaskErrorCode;

  constructor(message: string, code: TaskErrorCode) {
    super(message);
    this.name = 'TaskError';
    this.code = code;
  }
}

/**
 * Error codes for task operations
 */
export enum TaskErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  GENERAL_ERROR = 'GENERAL_ERROR'
}

/**
 * Type guard to check if a string is a valid task status
 */
export function isTaskStatus(value: string): value is TaskStatus {
  return ['todo', 'in-progress', 'done'].includes(value);
}

/**
 * Type guard to check if a string is a valid task readiness
 */
export function isTaskReadiness(value: string): value is TaskReadiness {
  return ['draft', 'ready', 'blocked'].includes(value);
}

/**
 * Type guard to check if a string is a valid dependency type
 */
export function isDependencyType(value: string): value is DependencyType {
  return ['child', 'after', 'sibling'].includes(value);
}

/**
 * Validates that metadata has the correct shape
 * Performs deep validation of metadata objects to ensure they can be properly serialized
 */
export function validateMetadata(data: unknown): data is TaskMetadata {
  // Check if the data is a valid object (not null and not an array)
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }

  // Check if all properties in the object are valid for serialization
  try {
    // Recursive function to check for circular references and invalid values
    function validateObject(obj: Record<string, unknown>, seen = new Set<object>()): boolean {
      // Check for circular references
      if (seen.has(obj)) {
        return false;
      }

      // Add this object to the set of objects we've seen
      seen.add(obj);

      // Check each property
      for (const [key, value] of Object.entries(obj)) {
        // Skip undefined values (they'll be removed during serialization anyway)
        if (value === undefined) {
          continue;
        }

        // Check nested objects recursively
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            // For arrays, check each element
            for (const item of value) {
              if (typeof item === 'object' && item !== null && !validateObject(item as Record<string, unknown>, new Set(seen))) {
                return false;
              }
            }
          } else {
            // For objects, recursively validate
            if (!validateObject(value as Record<string, unknown>, new Set(seen))) {
              return false;
            }
          }
        }

        // Check for non-serializable values
        if (typeof value === 'function' || value instanceof RegExp || value instanceof Date) {
          return false;
        }
      }

      return true;
    }

    // Start validation
    return validateObject(data as Record<string, unknown>);
  } catch (error) {
    // If any error occurs during validation, consider it invalid
    return false;
  }
}
export interface HierarchyTask extends Task {
  children?: HierarchyTask[];
  depth?: number;
}
export interface TaskSearch {
  query?: string;
  status?: TaskStatus | TaskStatus[];
  readiness?: TaskReadiness | TaskReadiness[];
  tags?: string[];
  metadata?: Record<string, any>;
}
export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  readiness?: TaskReadiness;
  tags?: string[];
  metadata?: Record<string, any>;
  parentId?: string;
}