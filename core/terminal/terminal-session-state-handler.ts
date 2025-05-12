/**
 * Terminal Session State Handler for Task Master CLI
 * Implements Task 17.7: Terminal Integration
 * 
 * This module provides state management functionality for terminal sessions,
 * extracted from TerminalSessionManager to improve modularity.
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.ts';
import {
  TerminalSessionState,
  TerminalFingerprint,
  TerminalIntegrationStatus
} from './terminal-session-types.ts';
import { setEnvironmentVariables } from './terminal-session-utils.ts';
import { disconnectSession, recordTaskUsage } from './terminal-session-index.ts';
import {
  detectTerminalSession,
  checkSessionInactivity
} from './terminal-session-initialization.ts';
import { getIntegrationStatus } from './terminal-session-status.ts';
import {
  createTaskActivityWindow,
  findSessionTimeWindows,
  createSessionTimeWindow,
  autoDetectSessionTimeWindows
} from './terminal-session-time-windows.ts';
import {
  tryRecoverSession as attemptRecovery,
  enableSessionRecovery as enableRecovery
} from './terminal-session-recovery.ts';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { terminalSessions } from '../../db/schema-extensions.ts';
import { eq } from 'drizzle-orm';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import { TimeWindowManager } from './time-window-manager.ts';
import { emitSessionDetected, emitSessionUpdated, emitSessionDisconnected, emitSessionRecoveryEnabled } from './terminal-session-event-handler.ts';

// Create logger for terminal state management
const logger = createLogger('TerminalSessionStateHandler');

/**
 * Initialize terminal session detection 
 * @param manager The terminal session manager instance
 * @param db The database connection
 * @param persistSessions Whether to persist sessions to database
 * @param enableReconnection Whether session reconnection is enabled
 * @param recoveryManager The recovery manager instance
 * @returns Detected terminal session or null if not in a terminal
 */
export async function initializeSessionDetection(
  manager: EventEmitter,
  db: BetterSQLite3Database,
  persistSessions: boolean,
  enableReconnection: boolean,
  recoveryManager: SessionRecoveryManager | null,
  currentSession: TerminalSessionState | null,
  detectingSession: boolean,
  updateDetectingSession: (value: boolean) => void
): Promise<TerminalSessionState | null> {
  try {
    if (currentSession) {
      return currentSession;
    }
    
    if (detectingSession) {
      // Wait for detection to complete
      return new Promise((resolve) => {
        manager.once('session:detected', () => {
          resolve(currentSession);
        });
      });
    }
    
    updateDetectingSession(true);
    
    // Detect terminal and create/reconnect to session
    const session = await detectSession(
      db,
      persistSessions,
      enableReconnection,
      recoveryManager
    );
    
    updateDetectingSession(false);
    return session;
  } catch (error) {
    updateDetectingSession(false);
    logger.error('Error initializing terminal session:', error);
    return null;
  }
}

/**
 * Detect current terminal session
 * @param db The database connection
 * @param persistSessions Whether to persist sessions to database
 * @param enableReconnection Whether session reconnection is enabled
 * @param recoveryManager The recovery manager instance
 * @returns Terminal session state or null if not in a terminal
 */
export async function detectSession(
  db: BetterSQLite3Database,
  persistSessions: boolean,
  enableReconnection: boolean,
  recoveryManager: SessionRecoveryManager | null
): Promise<TerminalSessionState | null> {
  try {
    const session = await detectTerminalSession(
      db,
      persistSessions,
      enableReconnection,
      recoveryManager
    );
    
    return session;
  } catch (error) {
    logger.error('Error detecting terminal session:', error);
    return null;
  }
}

/**
 * Set up environment variables for a session
 * @param session The terminal session
 * @returns Environment variables record
 */
export function setupEnvironmentVariables(
  session: TerminalSessionState
): Record<string, string> {
  const envVars = setEnvironmentVariables(session);
  return envVars;
}

/**
 * Update current session state
 * @param manager The event emitter (terminal session manager)
 * @param db The database connection
 * @param currentSession The current terminal session
 * @param updates Session updates to apply
 * @param persistSessions Whether to persist sessions to database
 * @param trackTaskUsage Whether to track task usage
 * @param timeWindowManager The time window manager instance
 */
export async function updateSession(
  manager: EventEmitter,
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState,
  updates: Partial<TerminalSessionState> = {},
  persistSessions: boolean,
  trackTaskUsage: boolean,
  timeWindowManager: TimeWindowManager | null
): Promise<void> {
  if (!currentSession) {
    return;
  }
  
  try {
    const now = new Date();
    
    // Update in-memory session
    Object.assign(currentSession, {
      ...updates,
      lastActive: now
    });
    
    // Update persistent session
    if (persistSessions) {
      const dbUpdates: Partial<any> = {
        lastActive: now
      };
      
      if (updates.currentTaskId !== undefined) {
        dbUpdates.currentTaskId = updates.currentTaskId;
      }
      
      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
      }
      
      if (updates.windowSize !== undefined) {
        dbUpdates.windowColumns = updates.windowSize.columns;
        dbUpdates.windowRows = updates.windowSize.rows;
      }
      
      await db.update(terminalSessions)
        .set(dbUpdates)
        .where(eq(terminalSessions.id, currentSession.id));
      
      // If current task is updated, record it in session tasks
      if (updates.currentTaskId && trackTaskUsage) {
        await recordTaskUsage(db, currentSession.id, updates.currentTaskId);
        
        // Find or create a time window for this task activity
        if (timeWindowManager) {
          try {
            await createTaskActivityWindow(
              timeWindowManager,
              currentSession.id,
              updates.currentTaskId,
              now
            );
          } catch (windowError) {
            logger.warn(`Error creating task time window: ${windowError}`);
            // Continue with session update even if window creation fails
          }
        }
      }
    }
    
    // Emit update event
    emitSessionUpdated(manager, currentSession);
  } catch (error) {
    logger.error('Error updating terminal session:', error);
  }
}

/**
 * Disconnect current session
 * @param manager The event emitter (terminal session manager)
 * @param db The database connection
 * @param currentSession The current terminal session
 * @param persistSessions Whether to persist sessions to database
 * @param inactivityTimer The inactivity timer to clear
 * @param clearSession Function to clear current session reference
 */
export async function disconnectCurrentSession(
  manager: EventEmitter,
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState,
  persistSessions: boolean,
  inactivityTimer: NodeJS.Timeout | null,
  clearSession: () => void
): Promise<void> {
  if (!currentSession) {
    return;
  }
  
  try {
    // Clear inactivity timer
    if (inactivityTimer) {
      clearInterval(inactivityTimer);
    }
    
    // Update session state
    currentSession.status = 'disconnected';
    currentSession.lastActive = new Date();
    
    // Update persistent session
    if (persistSessions) {
      await disconnectSession(db, currentSession.id);
    }
    
    // Emit disconnect event
    emitSessionDisconnected(manager, currentSession);
    
    logger.debug(`Disconnected terminal session: ${currentSession.id}`);
    
    // Clear current session
    clearSession();
  } catch (error) {
    logger.error('Error disconnecting terminal session:', error);
  }
}

/**
 * Get terminal integration status
 * @param db The database connection
 * @param currentSession The current terminal session
 * @param trackTaskUsage Whether to track task usage
 * @param trackFileChanges Whether to track file changes
 * @param persistSessions Whether to persist sessions to database
 * @param recoveryEnabled Whether session recovery is enabled
 * @returns Terminal integration status
 */
export async function getSessionIntegrationStatus(
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  trackTaskUsage: boolean,
  trackFileChanges: boolean,
  persistSessions: boolean,
  recoveryEnabled: boolean
): Promise<TerminalIntegrationStatus> {
  return getIntegrationStatus(
    db,
    currentSession,
    trackTaskUsage,
    trackFileChanges,
    persistSessions,
    recoveryEnabled
  );
}

/**
 * Try to recover a session
 * @param recoveryManager The recovery manager instance
 * @param fingerprint Terminal fingerprint to match against
 * @returns Recovered session or null if recovery failed
 */
export async function tryRecoverSession(
  recoveryManager: SessionRecoveryManager | null,
  fingerprint?: TerminalFingerprint
): Promise<TerminalSessionState | null> {
  if (!recoveryManager) {
    logger.debug('Session recovery not enabled');
    return null;
  }

  return attemptRecovery(recoveryManager, fingerprint);
}

/**
 * Enable session recovery for the current session
 * @param manager The event emitter (terminal session manager)
 * @param db The database connection
 * @param recoveryManager The recovery manager instance
 * @param sessionId The current session ID
 * @returns Whether session recovery was successfully enabled
 */
export async function enableSessionRecovery(
  manager: EventEmitter,
  db: BetterSQLite3Database,
  recoveryManager: SessionRecoveryManager | null,
  sessionId: string
): Promise<boolean> {
  if (!recoveryManager) {
    logger.debug('Cannot enable session recovery: No recovery manager');
    return false;
  }

  const result = await enableRecovery(
    db,
    recoveryManager,
    sessionId
  );

  if (result) {
    // Emit event
    emitSessionRecoveryEnabled(manager, sessionId);
  }

  return result;
}

/**
 * Find time windows for a session
 * @param timeWindowManager The time window manager instance
 * @param sessionId The session ID
 * @param options Time window criteria
 * @returns List of time windows or empty array if no windows found
 */
export async function findTimeWindowsForSession(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string,
  options: {
    type?: string;
    status?: string;
    containsTime?: Date;
    minDuration?: number;
    maxDuration?: number;
    taskId?: string;
    limit?: number;
  } = {}
): Promise<any[]> {
  if (!timeWindowManager) {
    logger.debug('Cannot find time windows: No time window manager');
    return [];
  }
  
  return findSessionTimeWindows(
    timeWindowManager,
    sessionId,
    options
  );
}

/**
 * Create a time window for a session
 * @param timeWindowManager The time window manager instance
 * @param sessionId The session ID
 * @param startTime Start time for the window
 * @param endTime End time for the window
 * @param options Window options
 * @returns Created time window or null if creation failed
 */
export async function createTimeWindowForSession(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string,
  startTime: Date,
  endTime: Date,
  options: {
    name?: string;
    type?: string;
    status?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<any | null> {
  if (!timeWindowManager) {
    logger.debug('Cannot create time window: No time window manager');
    return null;
  }
  
  return createSessionTimeWindow(
    timeWindowManager,
    sessionId,
    startTime,
    endTime,
    options
  );
}

/**
 * Auto-detect time windows for a session
 * @param timeWindowManager The time window manager instance
 * @param sessionId The session ID
 * @returns List of detected time windows or empty array if detection failed
 */
export async function autoDetectTimeWindowsForSession(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string
): Promise<any[]> {
  if (!timeWindowManager) {
    logger.debug('Cannot auto-detect time windows: No time window manager');
    return [];
  }
  
  return autoDetectSessionTimeWindows(
    timeWindowManager,
    sessionId
  );
}