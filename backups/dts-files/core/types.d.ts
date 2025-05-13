import { Task } from '../db/schema';
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
export type OutputFormat = 'text' | 'json';
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
export declare class TaskError extends Error {
    code: TaskErrorCode;
    constructor(message: string, code: TaskErrorCode);
}
/**
 * Error codes for task operations
 */
export declare enum TaskErrorCode {
    NOT_FOUND = "NOT_FOUND",
    INVALID_INPUT = "INVALID_INPUT",
    DATABASE_ERROR = "DATABASE_ERROR",
    DEPENDENCY_ERROR = "DEPENDENCY_ERROR",
    PERMISSION_ERROR = "PERMISSION_ERROR",
    GENERAL_ERROR = "GENERAL_ERROR"
}
/**
 * Type guard to check if a string is a valid task status
 */
export declare function isTaskStatus(value: string): value is TaskStatus;
/**
 * Type guard to check if a string is a valid task readiness
 */
export declare function isTaskReadiness(value: string): value is TaskReadiness;
/**
 * Type guard to check if a string is a valid dependency type
 */
export declare function isDependencyType(value: string): value is DependencyType;
/**
 * Validates that metadata has the correct shape
 * Performs deep validation of metadata objects to ensure they can be properly serialized
 */
export declare function validateMetadata(data: unknown): data is TaskMetadata;
