import { Task, TaskWithChildren, TaskSearch, TaskCreateInput, TaskUpdateInput } from '@/core/types';

/**
 * Types of operations supported by the API
 */
export type ApiOperationType = 'add' | 'update' | 'delete' | 'get' | 'search' | 'export' | 'import';

/**
 * Base interface for all API operations
 */
export interface ApiOperation {
  type: ApiOperationType;
  data: any;
}

/**
 * Add operation - creates a new task
 */
export interface AddOperation extends ApiOperation {
  type: 'add';
  data: TaskCreateInput;
}

/**
 * Update operation - updates an existing task
 */
export interface UpdateOperation extends ApiOperation {
  type: 'update';
  data: TaskUpdateInput;
}

/**
 * Delete operation - removes a task
 */
export interface DeleteOperation extends ApiOperation {
  type: 'delete';
  data: {
    id: string;
  };
}

/**
 * Get operation - retrieves a specific task
 */
export interface GetOperation extends ApiOperation {
  type: 'get';
  data: {
    id: string;
  };
}

/**
 * Search operation - finds tasks matching criteria
 */
export interface SearchOperation extends ApiOperation {
  type: 'search';
  data: TaskSearch;
}

/**
 * Export operation - exports tasks with filtering options
 */
export interface ExportOperation extends ApiOperation {
  type: 'export';
  data: {
    format?: 'json' | 'flat' | 'hierarchical';
    filter?: string;
    output?: string;
  };
}

/**
 * Import operation - imports tasks from external source
 */
export interface ImportOperation extends ApiOperation {
  type: 'import';
  data: {
    tasks: Task[];
    dryRun?: boolean;
  };
}

/**
 * Union type of all operation types
 */
export type Operation = 
  | AddOperation
  | UpdateOperation
  | DeleteOperation
  | GetOperation
  | SearchOperation
  | ExportOperation
  | ImportOperation;

/**
 * Format for batch operations input
 */
export interface BatchOperations {
  operations: Operation[];
}

/**
 * Result of an API operation
 */
export interface OperationResult {
  status: 'success' | 'error' | 'skipped' | 'simulated';
  operation: Operation;
  result?: any;
  error?: string;
}

/**
 * Statistics about executed operations
 */
export interface OperationStats {
  success: number;
  failed: number;
  skipped: number;
}

/**
 * Results of a batch operation
 */
export interface BatchResult {
  status: 'completed' | 'failed';
  dryRun: boolean;
  results: OperationStats & {
    details: OperationResult[];
  };
}

/**
 * Format for exporting tasks
 */
export interface ExportResult {
  type: 'full' | 'flat' | 'hierarchical';
  tasks: Task[] | Record<string, any>[];
  count: number;
  timestamp: string;
  filter: string | null;
}

/**
 * Results of an import operation
 */
export interface ImportResult {
  success: boolean;
  dryRun: boolean;
  results: {
    added: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
}

/**
 * Interface for API client configuration
 */
export interface ApiClientConfig {
  baseUrl?: string;
  token?: string;
  debug?: boolean;
}