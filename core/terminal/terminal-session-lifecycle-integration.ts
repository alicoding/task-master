/**
 * Terminal Session Lifecycle Integration for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides standalone functions for terminal session lifecycle,
 * including initialization, detection, updating, and disconnection.
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.ts';
import {
  TerminalSessionState
} from './terminal-session-types.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import { TimeWindowManager } from './time-window-manager.ts';
import {
  initializeSessionDetection,
  updateSession as handleSessionUpdate,
  disconnectCurrentSession
} from './terminal-session-state-handler.ts';
import { setupInactivityTimer, emitSessionDetected } from './terminal-session-event-handler.ts';
import { setEnvironmentVariables } from './terminal-session-utils.ts';

// Create logger for terminal lifecycle integration
const logger = createLogger('TerminalSessionLifecycle');

/**
 * Initialize the terminal session and detect current session
 * @param manager Event emitter (terminal session manager)
 * @param db Database connection
 * @param config Configuration options
 * @param recoveryManager Session recovery manager
 * @param currentSession Current session reference
 * @param detectingSession Detection state reference
 * @param setDetectingSession Function to update detection state
 * @param inactivityTimeout Inactivity timeout in milliseconds
 * @param updateSessionFn Function to update session state
 * @param setSessionFn Function to update current session reference
 * @returns Detected or initialized session
 */
export async function initializeTerminalSession(
  manager: EventEmitter,
  db: BetterSQLite3Database,
  config: {
    persistSessions: boolean;
    enableReconnection: boolean;
    inactivityTimeout: number;
    setEnvironmentVariables: boolean;
  },
  recoveryManager: SessionRecoveryManager | null,
  currentSession: TerminalSessionState | null,
  detectingSession: boolean,
  setDetectingSession: (value: boolean) => void,
  updateSessionFn: (updates: Partial<TerminalSessionState>) => Promise<void>,
  setSessionFn: (session: TerminalSessionState | null) => void
): Promise<TerminalSessionState | null> {
  try {
    // Use the state handler module to detect session
    const session = await initializeSessionDetection(
      manager,
      db,
      config.persistSessions,
      config.enableReconnection,
      recoveryManager,
      currentSession,
      detectingSession,
      setDetectingSession
    );
    
    if (session) {
      setSessionFn(session);
      
      // Set up inactivity timer if configured
      let inactivityTimer: NodeJS.Timeout | null = null;
      if (config.inactivityTimeout > 0) {
        inactivityTimer = setupInactivityTimer(
          manager,
          () => currentSession,
          config.inactivityTimeout,
          updateSessionFn
        );
      }
      
      // Set environment variables if configured
      if (config.setEnvironmentVariables) {
        const envVars = setEnvironmentVariables(session);
        session.environmentVariables = envVars;
      }
      
      // Emit session detected event
      emitSessionDetected(manager, session);
      
      logger.debug(`Terminal session detected: ${session.id}`);
    } else {
      logger.debug('No terminal session detected');
    }
    
    return session;
  } catch (error) {
    logger.error('Error initializing terminal session:', error);
    return null;
  }
}

/**
 * Detect current terminal session
 * @param manager Event emitter (terminal session manager)
 * @param db Database connection
 * @param config Configuration options
 * @param recoveryManager Session recovery manager
 * @param currentSession Current session reference
 * @param detectingSession Detection state reference
 * @param setDetectingSession Function to update detection state
 * @param setSessionFn Function to update current session reference
 * @returns Detected session
 */
export async function detectTerminalSession(
  manager: EventEmitter,
  db: BetterSQLite3Database,
  config: {
    persistSessions: boolean;
    enableReconnection: boolean;
  },
  recoveryManager: SessionRecoveryManager | null,
  currentSession: TerminalSessionState | null,
  detectingSession: boolean,
  setDetectingSession: (value: boolean) => void,
  setSessionFn: (session: TerminalSessionState | null) => void
): Promise<TerminalSessionState | null> {
  try {
    // Use state handler for session detection
    const session = await initializeSessionDetection(
      manager,
      db,
      config.persistSessions,
      config.enableReconnection,
      recoveryManager,
      currentSession,
      detectingSession,
      setDetectingSession
    );
    
    if (session) {
      setSessionFn(session);
    }
    
    return session;
  } catch (error) {
    logger.error('Error detecting terminal session:', error);
    return null;
  }
}

/**
 * Update current session state
 * @param manager Event emitter (terminal session manager)
 * @param db Database connection
 * @param currentSession Current session reference
 * @param updates Session updates to apply
 * @param config Configuration options
 * @param timeWindowManager Time window manager
 */
export async function updateTerminalSession(
  manager: EventEmitter,
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  updates: Partial<TerminalSessionState> = {},
  config: {
    persistSessions: boolean;
    trackTaskUsage: boolean;
  },
  timeWindowManager: TimeWindowManager | null
): Promise<void> {
  if (!currentSession) {
    return;
  }
  
  // Use state handler for session updates
  await handleSessionUpdate(
    manager,
    db,
    currentSession,
    updates,
    config.persistSessions,
    config.trackTaskUsage,
    timeWindowManager
  );
}

/**
 * Disconnect current session
 * @param manager Event emitter (terminal session manager)
 * @param db Database connection
 * @param currentSession Current session reference
 * @param config Configuration options
 * @param inactivityTimer Inactivity timer reference
 * @param setSessionFn Function to update current session reference
 */
export async function disconnectTerminalSession(
  manager: EventEmitter,
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  config: {
    persistSessions: boolean;
  },
  inactivityTimer: NodeJS.Timeout | null,
  setSessionFn: (session: TerminalSessionState | null) => void
): Promise<void> {
  if (!currentSession) {
    return;
  }
  
  // Use state handler for session disconnection
  await disconnectCurrentSession(
    manager,
    db,
    currentSession,
    config.persistSessions,
    inactivityTimer,
    () => setSessionFn(null)
  );
}