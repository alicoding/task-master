/**
 * Type augmentation for core/types.ts to add missing exports
 */

declare module '../core/types.ts' {
  import { Task } from '../db/schema.ts';
  
  // Task with hierarchy information
  export interface HierarchyTask extends Task {
    children?: HierarchyTask[];
    depth?: number;
  }

  // Search parameters for tasks
  export interface TaskSearch {
    query?: string;
    status?: TaskStatus | TaskStatus[];
    readiness?: TaskReadiness | TaskReadiness[];
    tags?: string[];
    metadata?: Record<string, any>;
  }

  // Input for creating a task
  export interface TaskCreateInput {
    title: string;
    description?: string;
    status?: TaskStatus;
    readiness?: TaskReadiness;
    tags?: string[];
    metadata?: Record<string, any>;
    parentId?: string;
  }

  // Augment TaskOperationResult to include common properties
  export interface TaskOperationResult<T> {
    success: boolean;
    data?: T;
    error?: TaskError;
    // Add commonly missing properties
    id?: string;
    title?: string;
    parentId?: string;
    metadata?: Record<string, any>;
    map?: <U>(fn: (item: any) => U) => U[];
  }
}

// Add missing DoD type
declare module '../core/dod/types.ts' {
  export interface DoD {
    id: string;
    taskId: string;
    checks: DoDCheck[];
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface DoDCheck {
    id: string;
    title: string;
    completed: boolean;
    required: boolean;
  }
}