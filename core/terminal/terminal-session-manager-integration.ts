/**
 * Terminal Session Manager Integration for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides a unified integration point for all terminal session manager
 * functionality, consolidating the various specialized modules into a cohesive API.
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.ts';
import {
  TerminalSessionManagerConfig,
  TerminalFingerprint,
  TerminalSessionState,
  TerminalIntegrationStatus,
  SessionActivityType
} from './terminal-session-types.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import { TimeWindowManager } from './time-window-manager.ts';

// Import from event handler module
import {
  bindEvents,
  setupEventHandlers,
  setupRecoveryEventForwarding,
  cleanupEventHandlers
} from './terminal-session-event-handler.ts';

// Import setup functions
import { setupRecoveryManager, getTimeWindowManager } from './terminal-session-recovery.ts';

// Import from lifecycle integration module
import {
  initializeTerminalSession,
  detectTerminalSession,
  updateTerminalSession,
  disconnectTerminalSession
} from './terminal-session-lifecycle-integration.ts';

// Import from activity integration module
import {
  trackTaskUsageInSession,
  trackFileActivityInSession,
  recordSessionActivity,
  getSessionActivityMetrics
} from './terminal-session-activity-integration.ts';

// Import from recovery integration module
import {
  tryToRecoverSession,
  enableRecoveryForSession
} from './terminal-session-recovery-integration.ts';

// Import from status integration module
import {
  getTerminalIntegrationStatus
} from './terminal-session-status-integration.ts';

// Import from time window integration module
import {
  findTimeWindows,
  createTimeWindow,
  autoDetectTimeWindows
} from './terminal-session-time-window-integration.ts';

// Create logger for terminal manager integration
const logger = createLogger('TerminalSessionManagerIntegration');

/**
 * Initialize managers needed for terminal session functionality
 * @param db Database connection
 * @param config Configuration options
 * @returns Initialized managers
 */
export function initializeManagers(
  db: BetterSQLite3Database,
  config: TerminalSessionManagerConfig,
  emitter: EventEmitter
): {
  recoveryManager: SessionRecoveryManager | null;
  timeWindowManager: TimeWindowManager | null;
} {
  let recoveryManager: SessionRecoveryManager | null = null;
  let timeWindowManager: TimeWindowManager | null = null;
  
  // Create recovery manager if configuration enables it
  if (config.enableReconnection) {
    recoveryManager = setupRecoveryManager(db);
    timeWindowManager = getTimeWindowManager(recoveryManager);
    
    // Set up event forwarding from recovery manager
    setupRecoveryEventForwarding(emitter, recoveryManager);
    
    logger.debug('Session Recovery Manager and Time Window Manager initialized');
  }
  
  logger.debug('Terminal Session Manager initialized with config:', {
    persistSessions: config.persistSessions,
    trackTaskUsage: config.trackTaskUsage,
    inactivityTimeout: config.inactivityTimeout,
    enableReconnection: config.enableReconnection
  });
  
  return { recoveryManager, timeWindowManager };
}

/**
 * Set up event handlers for the terminal session manager
 * @param emitter Event emitter
 * @param disconnectFn Function to disconnect the session
 */
export function setupSessionEventHandlers(
  emitter: EventEmitter,
  disconnectFn: () => Promise<void>
): void {
  // Bind methods to preserve 'this' context
  bindEvents(emitter);
  
  // Set up event listeners for process exit
  setupEventHandlers(disconnectFn);
}

/**
 * Initialize and detect a terminal session
 * @param emitter Event emitter
 * @param db Database connection
 * @param config Configuration options
 * @param managers Terminal session managers
 * @param currentSession Current session reference
 * @param state Session detection state
 * @param updateFn Function to update the session
 * @returns Detected or initialized session
 */
export async function initializeSession(
  emitter: EventEmitter,
  db: BetterSQLite3Database,
  config: TerminalSessionManagerConfig,
  managers: {
    recoveryManager: SessionRecoveryManager | null;
    timeWindowManager: TimeWindowManager | null;
  },
  currentSession: TerminalSessionState | null,
  state: {
    detectingSession: boolean;
    inactivityTimer: NodeJS.Timeout | null;
  },
  updateFn: (updates: Partial<TerminalSessionState>) => Promise<void>,
  setSession: (session: TerminalSessionState | null) => void,
  setDetectingSession: (detecting: boolean) => void
): Promise<TerminalSessionState | null> {
  return initializeTerminalSession(
    emitter,
    db,
    {
      persistSessions: config.persistSessions,
      enableReconnection: config.enableReconnection,
      inactivityTimeout: config.inactivityTimeout,
      setEnvironmentVariables: config.setEnvironmentVariables
    },
    managers.recoveryManager,
    currentSession,
    state.detectingSession,
    setDetectingSession,
    updateFn,
    setSession
  );
}

/**
 * Detect a terminal session
 * @param emitter Event emitter
 * @param db Database connection
 * @param config Configuration options
 * @param managers Terminal session managers
 * @param currentSession Current session reference
 * @param state Session detection state
 * @param setSession Function to set the current session
 * @param setDetectingSession Function to update detection state
 * @returns Detected session
 */
export async function detectSessionState(
  emitter: EventEmitter,
  db: BetterSQLite3Database,
  config: TerminalSessionManagerConfig,
  managers: {
    recoveryManager: SessionRecoveryManager | null;
    timeWindowManager: TimeWindowManager | null;
  },
  currentSession: TerminalSessionState | null,
  state: {
    detectingSession: boolean;
  },
  setSession: (session: TerminalSessionState | null) => void,
  setDetectingSession: (detecting: boolean) => void
): Promise<TerminalSessionState | null> {
  return detectTerminalSession(
    emitter,
    db,
    {
      persistSessions: config.persistSessions,
      enableReconnection: config.enableReconnection,
    },
    managers.recoveryManager,
    currentSession,
    state.detectingSession,
    setDetectingSession,
    setSession
  );
}

/**
 * Update a terminal session state
 * @param emitter Event emitter
 * @param db Database connection
 * @param currentSession Current session reference
 * @param updates Session updates to apply
 * @param config Configuration options
 * @param timeWindowManager Time window manager
 * @param updateFn Optional function to update the session state
 */
export async function updateSessionState(
  emitter: EventEmitter,
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  updates: Partial<TerminalSessionState>,
  config: {
    persistSessions: boolean;
    trackTaskUsage: boolean;
  },
  timeWindowManager: TimeWindowManager | null,
  updateFn?: (updates: Partial<TerminalSessionState>) => Promise<void>
): Promise<void> {
  await updateTerminalSession(
    emitter,
    db,
    currentSession,
    updates,
    config,
    timeWindowManager
  );

  // If updateFn is provided, call it with the updates
  if (updateFn && currentSession) {
    await updateFn(updates);
  }
}

/**
 * Track task usage in a terminal session
 * @param db Database connection
 * @param currentSession Current session reference
 * @param taskId Task ID to track
 * @param config Configuration options
 * @param timeWindowManager Time window manager
 * @param updateFn Function to update the session
 */
export async function trackSessionTaskUsage(
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  taskId: string,
  config: {
    trackTaskUsage: boolean;
  },
  timeWindowManager: TimeWindowManager | null,
  updateFn: (updates: Partial<TerminalSessionState>) => Promise<void>
): Promise<void> {
  if (!currentSession || !config.trackTaskUsage) {
    return;
  }
  
  const updates = await trackTaskUsageInSession(
    db,
    currentSession,
    taskId,
    config.trackTaskUsage,
    timeWindowManager
  );
  
  if (Object.keys(updates).length > 0) {
    await updateFn(updates);
  }
}

/**
 * Track file activity in a terminal session
 * @param db Database connection
 * @param currentSession Current session reference
 * @param fileId File ID to track
 * @param config Configuration options
 * @param updateFn Function to update the session
 */
export async function trackSessionFileActivity(
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  fileId: number,
  config: {
    trackFileChanges: boolean;
  },
  updateFn: (updates: Partial<TerminalSessionState>) => Promise<void>
): Promise<void> {
  if (!currentSession || !config.trackFileChanges) {
    return;
  }
  
  const success = await trackFileActivityInSession(
    db,
    currentSession.id,
    fileId,
    config.trackFileChanges
  );
  
  if (success) {
    // Update last active timestamp
    await updateFn({ lastActive: new Date() });
  }
}

/**
 * Record a custom activity in a terminal session
 * @param db Database connection
 * @param currentSession Current session reference
 * @param activityType Type of activity
 * @param metadata Activity metadata
 * @param timeWindowManager Time window manager
 * @param updateFn Function to update the session
 */
export async function recordSessionActivity(
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  activityType: SessionActivityType,
  metadata: Record<string, any>,
  timeWindowManager: TimeWindowManager | null,
  updateFn: (updates: Partial<TerminalSessionState>) => Promise<void>
): Promise<void> {
  if (!currentSession) {
    return;
  }

  // Import the function directly to avoid recursive call
  const { recordSessionActivity: recordActivity } = await import('./terminal-session-activity-integration.ts');

  const success = await recordActivity(
    db,
    currentSession,
    activityType,
    metadata,
    timeWindowManager
  );

  if (success) {
    // Update last active timestamp
    await updateFn({ lastActive: new Date() });
  }
}

/**
 * Get activity metrics for a terminal session
 * @param db Database connection
 * @param currentSession Current session reference
 * @returns Activity metrics
 */
export async function getSessionActivityMetrics(
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null
): Promise<{
  taskCount: number;
  fileCount: number;
  lastActivity: Date | null;
  activeTime: number;
  activityScore: number;
} | null> {
  if (!currentSession) {
    return null;
  }

  // Import the function directly to avoid recursive call
  const { getSessionActivityMetrics: getActivityMetrics } = await import('./terminal-session-activity-integration.ts');

  return getActivityMetrics(db, currentSession.id);
}

/**
 * Disconnect a terminal session
 * @param emitter Event emitter
 * @param db Database connection
 * @param currentSession Current session reference
 * @param config Configuration options
 * @param state Session state
 * @param setSession Function to set the current session
 */
export async function disconnectSessionState(
  emitter: EventEmitter,
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  config: {
    persistSessions: boolean;
  },
  state: {
    inactivityTimer: NodeJS.Timeout | null;
  },
  setSession: (session: TerminalSessionState | null) => void
): Promise<void> {
  if (!currentSession) {
    return;
  }
  
  // Use the lifecycle integration module for session disconnection
  await disconnectTerminalSession(
    emitter,
    db,
    currentSession,
    config,
    state.inactivityTimer,
    setSession
  );
  
  // Clean up event handlers
  cleanupEventHandlers(state.inactivityTimer);
}

/**
 * Get integration status for a terminal session
 * @param db Database connection
 * @param currentSession Current session reference
 * @param config Configuration options
 * @param recoveryManager Recovery manager
 * @returns Terminal integration status
 */
export async function getSessionIntegrationStatus(
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  config: {
    trackTaskUsage: boolean;
    trackFileChanges: boolean;
    persistSessions: boolean;
  },
  recoveryManager: SessionRecoveryManager | null
): Promise<TerminalIntegrationStatus> {
  return getTerminalIntegrationStatus(
    db,
    currentSession,
    config,
    recoveryManager !== null
  );
}

/**
 * Try to recover a terminal session
 * @param recoveryManager Recovery manager
 * @param fingerprint Terminal fingerprint to match against
 * @returns Recovered session or null if recovery failed
 */
export async function recoverSession(
  recoveryManager: SessionRecoveryManager | null,
  fingerprint?: TerminalFingerprint
): Promise<TerminalSessionState | null> {
  return tryToRecoverSession(recoveryManager, fingerprint);
}

/**
 * Enable recovery for a terminal session
 * @param emitter Event emitter
 * @param db Database connection
 * @param currentSession Current session reference
 * @param recoveryManager Recovery manager
 * @returns Whether session recovery was successfully enabled
 */
export async function enableSessionRecovery(
  emitter: EventEmitter,
  db: BetterSQLite3Database,
  currentSession: TerminalSessionState | null,
  recoveryManager: SessionRecoveryManager | null
): Promise<boolean> {
  if (!currentSession) {
    return false;
  }
  
  return enableRecoveryForSession(
    emitter, 
    db, 
    recoveryManager, 
    currentSession.id
  );
}

/**
 * Find time windows for a terminal session
 * @param currentSession Current session reference
 * @param timeWindowManager Time window manager
 * @param options Time window criteria
 * @returns List of time windows
 */
export async function findSessionTimeWindows(
  currentSession: TerminalSessionState | null,
  timeWindowManager: TimeWindowManager | null,
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
  if (!currentSession) {
    return [];
  }
  
  return findTimeWindows(
    timeWindowManager,
    currentSession.id,
    options
  );
}

/**
 * Create a time window for a terminal session
 * @param currentSession Current session reference
 * @param timeWindowManager Time window manager
 * @param startTime Start time for the window
 * @param endTime End time for the window
 * @param options Window options
 * @returns Created time window
 */
export async function createSessionTimeWindow(
  currentSession: TerminalSessionState | null,
  timeWindowManager: TimeWindowManager | null,
  startTime: Date,
  endTime: Date,
  options: {
    name?: string;
    type?: string;
    status?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<any | null> {
  if (!currentSession) {
    return null;
  }
  
  return createTimeWindow(
    timeWindowManager,
    currentSession.id,
    startTime,
    endTime,
    options
  );
}

/**
 * Auto-detect time windows for a terminal session
 * @param currentSession Current session reference
 * @param timeWindowManager Time window manager
 * @returns List of detected time windows
 */
export async function autoDetectSessionTimeWindows(
  currentSession: TerminalSessionState | null,
  timeWindowManager: TimeWindowManager | null
): Promise<any[]> {
  if (!currentSession) {
    return [];
  }
  
  return autoDetectTimeWindows(
    timeWindowManager,
    currentSession.id
  );
}