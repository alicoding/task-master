/**
 * Terminal Session Factory for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides factory functions for creating and initializing
 * terminal session manager instances with proper configuration.
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.ts';
import {
  TerminalSessionManagerConfig,
  DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG,
  TerminalSessionState,
  TerminalFingerprint
} from './terminal-session-types.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import { TimeWindowManager } from './time-window-manager.ts';
import { TerminalSessionConfiguration, createTerminalConfiguration } from './terminal-session-configuration.ts';
import { TerminalSessionTimeWindowAdapter } from './terminal-session-time-window-adapter.ts';
import { TerminalSessionRecoveryAdapter } from './terminal-session-recovery-adapter.ts';
import { TerminalSessionActivityAdapter } from './terminal-session-activity-adapter.ts';
import { TerminalSessionStatusAdapter } from './terminal-session-status-adapter.ts';
import { TerminalSessionLifecycleAdapter } from './terminal-session-lifecycle-adapter.ts';
import { TerminalSessionManager } from './terminal-session-manager-index.ts';
import * as integration from './terminal-session-manager-integration.ts';

// Create logger for terminal factory
const logger = createLogger('TerminalSessionFactory');

/**
 * Initialize the session managers required for terminal functionality
 *
 * @param db Database connection
 * @param config Configuration object
 * @param emitter Event emitter for events
 * @returns Object containing initialized managers
 */
export function initializeSessionManagers(
  db: BetterSQLite3Database,
  config: TerminalSessionManagerConfig,
  emitter: EventEmitter
): {
  recoveryManager: SessionRecoveryManager | null;
  timeWindowManager: TimeWindowManager | null;
} {
  return integration.initializeManagers(db, config, emitter);
}

/**
 * Initialize the adapters for terminal session functionality
 *
 * @param db Database connection
 * @param sessionManager The terminal session manager instance
 * @param managers The initialized managers
 * @param configManager Configuration manager instance
 * @returns Object containing initialized adapters
 */
export function initializeSessionAdapters(
  db: BetterSQLite3Database,
  sessionManager: TerminalSessionManager,
  managers: {
    recoveryManager: SessionRecoveryManager | null;
    timeWindowManager: TimeWindowManager | null;
  },
  configManager: TerminalSessionConfiguration
): {
  timeWindowAdapter: TerminalSessionTimeWindowAdapter;
  recoveryAdapter: TerminalSessionRecoveryAdapter;
  activityAdapter: TerminalSessionActivityAdapter;
  statusAdapter: TerminalSessionStatusAdapter;
  lifecycleAdapter: TerminalSessionLifecycleAdapter;
} {
  // Initialize time window adapter
  const timeWindowAdapter = new TerminalSessionTimeWindowAdapter(
    () => sessionManager.getCurrentSession(),
    managers.timeWindowManager
  );

  // Initialize recovery adapter
  const recoveryAdapter = new TerminalSessionRecoveryAdapter(
    sessionManager,
    db,
    () => sessionManager.getCurrentSession(),
    managers.recoveryManager
  );

  // Initialize activity adapter
  const activityAdapter = new TerminalSessionActivityAdapter(
    db,
    () => sessionManager.getCurrentSession(),
    managers.timeWindowManager,
    {
      trackTaskUsage: () => configManager.getValue('trackTaskUsage'),
      trackFileChanges: () => configManager.getValue('trackFileChanges')
    },
    sessionManager.updateSession.bind(sessionManager)
  );

  // Initialize status adapter
  const statusAdapter = new TerminalSessionStatusAdapter(
    db,
    () => sessionManager.getCurrentSession(),
    configManager,
    managers.recoveryManager
  );

  // Initialize lifecycle adapter
  const lifecycleAdapter = new TerminalSessionLifecycleAdapter(
    sessionManager,
    db,
    configManager.getConfig(),
    managers,
    {
      currentSession: sessionManager.getCurrentSession(),
      detectingSession: false,
      inactivityTimer: null
    },
    {
      updateSession: sessionManager.updateSession.bind(sessionManager),
      setSession: (session) => sessionManager['_currentSession'] = session,
      setDetectingSession: (detecting) => sessionManager['_detectingSession'] = detecting
    }
  );

  return {
    timeWindowAdapter,
    recoveryAdapter,
    activityAdapter,
    statusAdapter,
    lifecycleAdapter
  };
}

/**
 * Initialize event handlers for terminal session management
 * 
 * @param sessionManager Terminal session manager instance
 */
export function initializeEventHandlers(
  sessionManager: TerminalSessionManager
): void {
  integration.setupSessionEventHandlers(
    sessionManager,
    sessionManager.disconnectSession.bind(sessionManager)
  );
}

/**
 * Initialize session state - setup internal state trackers
 * 
 * @param sessionManager Terminal session manager instance
 */
export function initializeSessionState(
  sessionManager: TerminalSessionManager
): void {
  // Set up private state tracking (accessed directly since they're internal properties)
  sessionManager['_currentSession'] = null;
  sessionManager['_detectingSession'] = false;
  sessionManager['_inactivityTimer'] = null;
}

/**
 * Initialize terminal session integration components 
 * for the specified session manager
 * 
 * @param sessionManager Terminal session manager instance
 * @param db Database connection
 * @param configManager Configuration manager
 */
export function initializeIntegration(
  sessionManager: TerminalSessionManager,
  db: BetterSQLite3Database,
  configManager: TerminalSessionConfiguration
): void {
  // Initialize managers
  const managers = initializeSessionManagers(
    db,
    configManager.getConfig(),
    sessionManager
  );
  
  // Initialize adapters
  const adapters = initializeSessionAdapters(
    db,
    sessionManager,
    managers,
    configManager
  );
  
  // Store references to managers and adapters in the session manager
  sessionManager['_recoveryManager'] = managers.recoveryManager;
  sessionManager['_timeWindowManager'] = managers.timeWindowManager;
  sessionManager['_timeWindowAdapter'] = adapters.timeWindowAdapter;
  sessionManager['_recoveryAdapter'] = adapters.recoveryAdapter;
  sessionManager['_activityAdapter'] = adapters.activityAdapter;
  sessionManager['_statusAdapter'] = adapters.statusAdapter;
  sessionManager['_lifecycleAdapter'] = adapters.lifecycleAdapter;
}

/**
 * Initialize core terminal session functionality
 * 
 * @param sessionManager Terminal session manager instance
 * @param db Database connection
 * @param configManager Configuration manager
 */
export function initializeTerminalSessionCore(
  sessionManager: TerminalSessionManager,
  db: BetterSQLite3Database,
  configManager: TerminalSessionConfiguration
): void {
  // Initialize state tracking
  initializeSessionState(sessionManager);
  
  // Initialize all integration components
  initializeIntegration(sessionManager, db, configManager);
  
  // Set up event handlers
  initializeEventHandlers(sessionManager);
}

/**
 * Create a configured terminal session manager instance
 * 
 * @param db Database connection
 * @param configOptions Configuration options (partial)
 * @returns Configured terminal session manager instance
 */
export function createTerminalSessionManager(
  db: BetterSQLite3Database,
  configOptions: Partial<TerminalSessionManagerConfig> = {}
): TerminalSessionManager {
  logger.debug('Creating new terminal session manager');
  
  // Create the configuration manager
  const configManager = createTerminalConfiguration(db, configOptions);
  
  // Create the terminal session manager with minimal constructor
  const sessionManager = new TerminalSessionManager(db, configManager);
  
  // Initialize all required components
  initializeTerminalSessionCore(sessionManager, db, configManager);
  
  // Log successful creation
  logger.debug('Terminal session manager created successfully');
  
  return sessionManager;
}

/**
 * Initialize a terminal session manager and detect current session
 * This is a convenience function that creates and initializes a session manager
 * 
 * @param db Database connection
 * @param configOptions Configuration options
 * @returns Initialized terminal session manager and current session
 */
export async function createAndInitializeSessionManager(
  db: BetterSQLite3Database,
  configOptions: Partial<TerminalSessionManagerConfig> = {}
): Promise<{
  sessionManager: TerminalSessionManager;
  currentSession: TerminalSessionState | null;
}> {
  try {
    // Create the manager
    const sessionManager = createTerminalSessionManager(db, configOptions);
    
    // Initialize and detect session
    const currentSession = await sessionManager.initialize();
    
    logger.debug(
      currentSession 
        ? `Terminal session initialized with ID: ${currentSession.id}`
        : 'Terminal session initialization completed, but no active session detected'
    );
    
    return { sessionManager, currentSession };
  } catch (error) {
    logger.error('Failed to initialize terminal session manager:', error);
    // Create a manager anyway, but with no session
    const sessionManager = createTerminalSessionManager(db, configOptions);
    return { sessionManager, currentSession: null };
  }
}

/**
 * Try to recover a session using the provided or current fingerprint
 * 
 * @param sessionManager Terminal session manager
 * @param fingerprint Optional terminal fingerprint to match against
 * @returns Promise resolving to recovered session or null
 */
export async function tryRecoverSession(
  sessionManager: TerminalSessionManager,
  fingerprint?: TerminalFingerprint
): Promise<TerminalSessionState | null> {
  const recoveryAdapter = sessionManager['_recoveryAdapter'];
  if (!recoveryAdapter) {
    return null;
  }
  
  return recoveryAdapter.tryRecoverSession(fingerprint);
}

/**
 * Enable session recovery for the current session
 * 
 * @param sessionManager Terminal session manager
 * @returns Promise resolving to whether recovery was enabled
 */
export async function enableSessionRecovery(
  sessionManager: TerminalSessionManager
): Promise<boolean> {
  const recoveryAdapter = sessionManager['_recoveryAdapter'];
  if (!recoveryAdapter) {
    return false;
  }
  
  return recoveryAdapter.enableSessionRecovery();
}

/**
 * Update terminal session state with partial updates
 * 
 * @param sessionManager Terminal session manager
 * @param updates Partial session state updates
 */
export async function updateSessionState(
  sessionManager: TerminalSessionManager,
  updates: Partial<TerminalSessionState> = {}
): Promise<void> {
  const config = sessionManager.getConfigManager().getConfig();
  
  await integration.updateSessionState(
    sessionManager,
    sessionManager['_db'],
    sessionManager.getCurrentSession(),
    updates,
    {
      persistSessions: config.persistSessions,
      trackTaskUsage: config.trackTaskUsage
    },
    sessionManager['_timeWindowManager']
  );
}

/**
 * Create a terminal session configuration instance
 * Re-export from configuration module for convenience
 */
export { createTerminalConfiguration };

/**
 * Get default terminal session configuration
 * @returns Copy of default configuration
 */
export function getDefaultConfig(): TerminalSessionManagerConfig {
  return { ...DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG };
}