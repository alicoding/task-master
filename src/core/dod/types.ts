/**
 * Core types for Definition of Done (DoD) feature
 */

/**
 * Definition of Done item
 */
export interface DoDItem {
  id: string;
  description: string;
  completed?: boolean;
}

/**
 * Project-level Definition of Done configuration
 */
export interface ProjectDoD {
  enabled: boolean;
  defaultItems: DoDItem[];
  tagItems?: Record<string, DoDItem[]>;
}

/**
 * Task-level Definition of Done
 */
export interface TaskDoD {
  enabled: boolean;
  items: DoDItem[];
}

/**
 * Error codes for DoD operations
 */
export enum DoDErrorCode {
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_EXISTS = 'CONFIG_EXISTS',
  INVALID_CONFIG = 'INVALID_CONFIG',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  ITEM_EXISTS = 'ITEM_EXISTS',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  GENERAL_ERROR = 'GENERAL_ERROR'
}

/**
 * Result of a DoD operation
 */
export interface DoDOperationResult<T> {
  success: boolean;
  data?: T;
  error?: DoDError;
}

/**
 * DoD-specific error
 */
export class DoDError extends Error {
  public code: DoDErrorCode;

  constructor(message: string, code: DoDErrorCode) {
    super(message);
    this.name = 'DoDError';
    this.code = code;
  }
}

/**
 * DoD management options for task creation/update
 */
export interface DoDOptions {
  enableDoD?: boolean;
  disableDoD?: boolean;
  dodItems?: string[]; // List of DoD item descriptions to add
}
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