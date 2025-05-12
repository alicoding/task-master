/**
 * Terminal Session Types for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides type definitions and interfaces for terminal session management.
 */

/**
 * Configuration options for terminal session manager
 */
export interface TerminalSessionManagerConfig {
  // Whether to create persistent sessions
  persistSessions: boolean;
  
  // Whether to track task usage in sessions
  trackTaskUsage: boolean;
  
  // Whether to track file changes in sessions
  trackFileChanges: boolean;
  
  // Whether to reconnect to previous sessions
  enableReconnection: boolean;
  
  // Whether to set environment variables for integration
  setEnvironmentVariables: boolean;
  
  // Session inactivity timeout in minutes (0 for never)
  inactivityTimeout: number;
  
  // Maximum session history to maintain
  maxSessionHistory: number;
}

/**
 * Default configuration for terminal session manager
 */
export const DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG: TerminalSessionManagerConfig = {
  persistSessions: true,
  trackTaskUsage: true,
  trackFileChanges: true,
  enableReconnection: true,
  setEnvironmentVariables: true,
  inactivityTimeout: 60, // 60 minutes
  maxSessionHistory: 20
};

/**
 * Terminal fingerprint for session identification
 */
export interface TerminalFingerprint {
  tty: string;
  pid: number;
  ppid: number;
  user: string;
  shell: string;
  termEnv: string;
  sshConnection?: string;
  tmuxSession?: string;
  screenSession?: string;
}

/**
 * Terminal session state
 */
export interface TerminalSessionState {
  id: string;
  fingerprint: TerminalFingerprint;
  startTime: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'disconnected';
  windowSize: { columns: number; rows: number };
  currentTaskId?: string;
  recentTaskIds: string[];
  connectionCount: number;
  environmentVariables: Record<string, string>;
}

/**
 * Terminal integration status
 */
export interface TerminalIntegrationStatus {
  enabled: boolean;
  sessionId: string;
  tty: string;
  status: 'active' | 'inactive' | 'disconnected';
  currentTaskId?: string;
  taskCount: number;
  fileCount: number;
  sessionDuration: number; // in milliseconds
  shellIntegrated: boolean;
  recovery?: {
    enabled: boolean;
    recoveryCount: number;
    lastRecovery?: Date;
    recoverySource?: string;
  };
}

/**
 * Task indicator data for displaying task info in prompts
 */
export interface TaskIndicatorData {
  id: string;
  title: string;
  status: string;
}

/**
 * Terminal session display options for CLI output
 */
export interface SessionDisplayOptions {
  format?: string;
  color?: boolean;
  compact?: boolean;
  detailed?: boolean;
}

/**
 * Session activity type enum
 */
export enum SessionActivityType {
  TASK = 'task',
  FILE = 'file',
  COMMAND = 'command',
  WINDOW = 'window'
}

/**
 * Result of a session operation
 */
export interface SessionOperationResult {
  success: boolean;
  sessionId?: string;
  error?: string;
  message?: string;
  data?: any;
}

/**
 * Terminal detection result
 */
export interface TerminalDetectionResult {
  isTerminal: boolean;
  tty?: string;
  pid?: number;
  user?: string;
  shell?: string;
  columns?: number;
  rows?: number;
}