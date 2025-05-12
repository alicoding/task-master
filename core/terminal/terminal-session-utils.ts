/**
 * Terminal Session Utilities for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides utility functions for terminal session management.
 */

import { execSync } from 'child_process';
import os from 'os';
import tty from 'tty';
import { createLogger } from '../utils/logger.ts';
import {
  TerminalFingerprint,
  TerminalDetectionResult,
  TerminalSessionState,
  TerminalSession
} from './terminal-session-types.ts';

// Create logger for terminal utilities
const logger = createLogger('TerminalSessionUtils');

/**
 * Check if current process is running in a terminal
 * @returns True if in a terminal, false otherwise
 */
export function isInTerminal(): boolean {
  return Boolean(process.stdout.isTTY);
}

/**
 * Get the terminal fingerprint for identification
 * @returns Terminal fingerprint or null if not in a terminal
 */
export function getTerminalFingerprint(): TerminalFingerprint | null {
  try {
    if (!isInTerminal()) {
      return null;
    }
    
    // Get TTY path
    let ttyPath = '';
    try {
      // Try to get TTY path using tty module
      if (process.stdin.isTTY && tty.isatty(process.stdin.fd)) {
        // @ts-ignore - Node.js type definitions don't include ReadStream.path
        ttyPath = (process.stdin as any).path || '';
      }
      
      // If that fails, try using external command
      if (!ttyPath) {
        ttyPath = execSync('tty 2>/dev/null || echo ""').toString().trim();
      }
    } catch (e) {
      // Fallback to process.env properties
      ttyPath = process.env.TTY || '';
    }
    
    // Get process information
    const pid = process.pid;
    const ppid = process.ppid;
    
    // Get user information
    const user = process.env.USER || process.env.USERNAME || os.userInfo().username;
    
    // Get shell information
    let shell = process.env.SHELL || '';
    if (!shell) {
      // Try to detect shell from environment
      if (process.env.BASH_VERSION) {
        shell = 'bash';
      } else if (process.env.ZSH_VERSION) {
        shell = 'zsh';
      } else if (process.env.FISH_VERSION) {
        shell = 'fish';
      } else {
        // Default to a common shell based on platform
        shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
      }
    }
    
    // Get terminal environment
    const termEnv = process.env.TERM || '';
    
    // Get SSH connection if applicable
    const sshConnection = process.env.SSH_CONNECTION || undefined;
    
    // Get tmux/screen session if applicable
    const tmuxSession = process.env.TMUX ? 
      process.env.TMUX.split(',')[0] : undefined;
    
    const screenSession = process.env.STY || undefined;
    
    return {
      tty: ttyPath,
      pid,
      ppid,
      user,
      shell,
      termEnv,
      sshConnection,
      tmuxSession,
      screenSession
    };
  } catch (error) {
    logger.error('Error getting terminal fingerprint:', error);
    return null;
  }
}

/**
 * Get current terminal window size
 * @returns Window size object with columns and rows
 */
export function getWindowSize(): { columns: number; rows: number } {
  if (process.stdout.isTTY) {
    return {
      columns: process.stdout.columns || 80,
      rows: process.stdout.rows || 24
    };
  }
  
  return { columns: 80, rows: 24 };
}

/**
 * Set environment variables for terminal integration
 * @param session Terminal session state
 */
export function setEnvironmentVariables(session: TerminalSessionState): Record<string, string> {
  try {
    // Set terminal session environment variables
    process.env.TM_SESSION_ID = session.id;
    process.env.TM_TTY = session.fingerprint.tty;
    process.env.TM_PID = String(session.fingerprint.pid);
    process.env.TM_USER = session.fingerprint.user;
    process.env.TM_SHELL = session.fingerprint.shell;
    
    // Create environment variables object
    const envVars = {
      TM_SESSION_ID: session.id,
      TM_TTY: session.fingerprint.tty,
      TM_PID: String(session.fingerprint.pid),
      TM_USER: session.fingerprint.user,
      TM_SHELL: session.fingerprint.shell
    };
    
    logger.debug('Set environment variables for terminal integration');
    
    return envVars;
  } catch (error) {
    logger.error('Error setting environment variables:', error);
    return {};
  }
}

/**
 * Convert database session record to in-memory state
 * @param dbSession Database session record
 * @param fingerprint Terminal fingerprint
 * @returns In-memory session state
 */
export function dbSessionToState(
  dbSession: TerminalSession, 
  fingerprint: TerminalFingerprint
): TerminalSessionState {
  // Get window size
  const windowSize = {
    columns: dbSession.windowColumns || 80,
    rows: dbSession.windowRows || 24
  };
  
  // Get recent task IDs
  const recentTaskIds: string[] = [];
  if (dbSession.currentTaskId) {
    recentTaskIds.push(dbSession.currentTaskId);
  }
  
  // Get environment variables
  const environmentVariables: Record<string, string> = {
    TM_SESSION_ID: dbSession.id,
    TM_TTY: dbSession.tty || '',
    TM_PID: String(dbSession.pid || ''),
    TM_USER: dbSession.user || '',
    TM_SHELL: dbSession.shell || ''
  };
  
  // Create session state
  return {
    id: dbSession.id,
    fingerprint,
    startTime: dbSession.startTime,
    lastActive: dbSession.lastActive,
    status: dbSession.status as 'active' | 'inactive' | 'disconnected',
    windowSize,
    currentTaskId: dbSession.currentTaskId,
    recentTaskIds,
    connectionCount: dbSession.connectionCount || 1,
    environmentVariables
  };
}

/**
 * Format duration in milliseconds to human readable string
 * @param ms Duration in milliseconds
 * @returns Human readable duration string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format date nicely
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString();
}