import { Task } from '../db/schema.js';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskReadiness = 'draft' | 'ready' | 'blocked';
export type DependencyType = 'child' | 'after' | 'sibling';

export interface TaskWithChildren extends Task {
  children?: TaskWithChildren[];
}

export interface SearchFilters {
  status?: TaskStatus;
  readiness?: TaskReadiness;
  tags?: string[];
  query?: string;
  metadata?: Record<string, any>;
}

export interface TaskInsertOptions {
  title: string;
  childOf?: string;
  after?: string;
  status?: TaskStatus;
  readiness?: TaskReadiness;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TaskUpdateOptions {
  id: string;
  title?: string;
  status?: TaskStatus;
  readiness?: TaskReadiness;
  tags?: string[];
  metadata?: Record<string, any> | null;
}

export type OutputFormat = 'text' | 'json';

export interface TaskMasterConfig {
  dbPath: string;
  inMemory: boolean;
}