/**
 * Terminal Session Manager Adapter for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides type definitions and interface adapters for the
 * Terminal Session Manager, reducing duplication in the main class file.
 */

import { TerminalFingerprint, TerminalSessionState, TerminalIntegrationStatus, SessionActivityType } from './terminal-session-types.ts';

/**
 * Activity metrics result interface
 */
export interface ActivityMetrics {
  taskCount: number;
  fileCount: number;
  lastActivity: Date | null;
  activeTime: number;
  activityScore: number;
}

/**
 * Time window query options interface
 */
export interface TimeWindowQueryOptions {
  type?: string;
  status?: string;
  containsTime?: Date;
  minDuration?: number;
  maxDuration?: number;
  taskId?: string;
  limit?: number;
}

/**
 * Time window creation options interface
 */
export interface TimeWindowCreationOptions {
  name?: string;
  type?: string;
  status?: string;
  metadata?: Record<string, any>;
}

/**
 * Terminal session manager method signatures
 */
export interface TerminalSessionManagerInterface {
  initialize(): Promise<TerminalSessionState | null>;
  detectSession(): Promise<TerminalSessionState | null>;
  updateSession(updates: Partial<TerminalSessionState>): Promise<void>;
  trackTaskUsage(taskId: string): Promise<void>;
  trackFileActivity(fileId: number): Promise<void>;
  recordActivity(activityType: SessionActivityType, metadata?: Record<string, any>): Promise<void>;
  getActivityMetrics(): Promise<ActivityMetrics | null>;
  disconnectSession(): Promise<void>;
  getCurrentSession(): TerminalSessionState | null;
  getIntegrationStatus(): Promise<TerminalIntegrationStatus>;
  tryRecoverSession(fingerprint?: TerminalFingerprint): Promise<TerminalSessionState | null>;
  enableSessionRecovery(): Promise<boolean>;
  findSessionTimeWindows(options?: TimeWindowQueryOptions): Promise<any[]>;
  createSessionTimeWindow(startTime: Date, endTime: Date, options?: TimeWindowCreationOptions): Promise<any | null>;
  autoDetectSessionTimeWindows(): Promise<any[]>;
}