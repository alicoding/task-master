/**
 * Terminal Session Manager for Task Master CLI
 * Implements Task 17.7: Terminal Integration
 *
 * This module provides functionality for detecting, tracking, and managing
 * terminal sessions, allowing for task-session associations and terminal
 * status indicators.
 *
 * Refactored as part of Task 17.8.9: Modularize terminal-session-manager.ts
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.ts';
import {
  TerminalFingerprint,
  TerminalSessionState,
  TerminalIntegrationStatus,
  SessionActivityType
} from './terminal-session-types.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import { TimeWindowManager } from './time-window-manager.ts';

// Import the modularized components
import { TerminalSessionConfiguration } from './terminal-session-configuration.ts';
import { TerminalSessionTimeWindowAdapter } from './terminal-session-time-window-adapter.ts';
import { TerminalSessionRecoveryAdapter } from './terminal-session-recovery-adapter.ts';
import { TerminalSessionActivityAdapter } from './terminal-session-activity-adapter.ts';
import { TerminalSessionStatusAdapter } from './terminal-session-status-adapter.ts';
import { TerminalSessionLifecycleAdapter } from './terminal-session-lifecycle-adapter.ts';
import { bindEvents, setupEventHandlers, cleanupEventHandlers } from './terminal-session-event-handler.ts';
import * as StateHandler from './terminal-session-state-handler.ts';
import * as Activity from './terminal-session-activity.ts';
import * as TimeWindowIntegration from './terminal-session-time-window-integration.ts';

// Import adapter interfaces
import {
  ActivityMetrics,
  TimeWindowQueryOptions,
  TimeWindowCreationOptions,
  TerminalSessionManagerInterface
} from './terminal-session-manager-adapter.ts';

// Create logger for terminal integration
const logger = createLogger('TerminalSessionManager');

/**
 * Terminal Session Manager
 *
 * Manages terminal sessions for the Task Master CLI, providing features
 * for session detection, tracking, and integration with the shell.
 * 
 * The implementation details are delegated to specialized adapters and
 * the factory module for initialization to keep this class focused on
 * providing a clean API.
 */
export class TerminalSessionManager extends EventEmitter implements TerminalSessionManagerInterface {
  // Database connection
  protected _db: BetterSQLite3Database;
  
  // Configuration manager
  protected _configManager: TerminalSessionConfiguration;
  
  // Core state properties
  protected _currentSession: TerminalSessionState | null = null;
  protected _detectingSession = false;
  protected _inactivityTimer: NodeJS.Timeout | null = null;

  // Managers
  protected _recoveryManager: SessionRecoveryManager | null = null;
  protected _timeWindowManager: TimeWindowManager | null = null;
  
  // Adapters that implement specialized functionality
  protected _timeWindowAdapter: TerminalSessionTimeWindowAdapter | null = null;
  protected _recoveryAdapter: TerminalSessionRecoveryAdapter | null = null;
  protected _activityAdapter: TerminalSessionActivityAdapter | null = null;
  protected _statusAdapter: TerminalSessionStatusAdapter | null = null;
  protected _lifecycleAdapter: TerminalSessionLifecycleAdapter | null = null;
  
  /**
   * Create a new Terminal Session Manager
   * @param db SQLite database connection
   * @param configManager Configuration manager
   */
  constructor(
    db: BetterSQLite3Database,
    configManager: TerminalSessionConfiguration
  ) {
    super();
    this._db = db;
    this._configManager = configManager;

    // Bind event handling methods
    bindEvents(this);

    // Set up event handlers for process exit and termination
    setupEventHandlers(() => {
      this.disconnectSession().catch(err => {
        logger.error('Error disconnecting session on exit:', err);
      });
    });

    // The rest of initialization is handled by the factory module
    // See terminal-session-factory.ts which calls initializeTerminalSessionCore
  }
  
  /**
   * Initialize the terminal session manager and detect current session
   */
  async initialize(): Promise<TerminalSessionState | null> {
    if (this._lifecycleAdapter) {
      return this._lifecycleAdapter.initialize();
    }

    // Fallback using state handler module directly
    return StateHandler.initializeSessionDetection(
      this,
      this._db,
      this._configManager.getValue('persistSessions'),
      this._configManager.getValue('enableReconnection'),
      this._recoveryManager,
      this._currentSession,
      this._detectingSession,
      (value) => { this._detectingSession = value; }
    );
  }

  /**
   * Detect current terminal session
   * @returns Terminal session state or null if not in a terminal
   */
  async detectSession(): Promise<TerminalSessionState | null> {
    if (this._lifecycleAdapter) {
      return this._lifecycleAdapter.detectSession();
    }

    // Fallback using state handler module directly
    return StateHandler.detectSession(
      this._db,
      this._configManager.getValue('persistSessions'),
      this._configManager.getValue('enableReconnection'),
      this._recoveryManager
    );
  }

  /**
   * Update current session state
   * @param updates Session updates to apply
   */
  async updateSession(updates: Partial<TerminalSessionState> = {}): Promise<void> {
    if (!this._currentSession) {
      await this.initialize();
      if (!this._currentSession) {
        return;
      }
    }

    if (this._lifecycleAdapter) {
      await this._lifecycleAdapter.updateSession(updates);
    } else {
      // Fallback using state handler module directly
      await StateHandler.updateSession(
        this,
        this._db,
        this._currentSession,
        updates,
        this._configManager.getValue('persistSessions'),
        this._configManager.getValue('trackTaskUsage'),
        this._timeWindowManager
      );
    }
  }

  /**
   * Update session with task usage
   * @param taskId Task ID to track
   */
  async trackTaskUsage(taskId: string): Promise<void> {
    if (!this._currentSession) {
      await this.initialize();
      if (!this._currentSession) {
        return;
      }
    }

    if (this._activityAdapter) {
      await this._activityAdapter.trackTaskUsage(taskId);
    } else {
      // Fallback using activity module directly
      const config = this._configManager.getConfig();
      const updates = await Activity.updateSessionWithTask(
        this._db,
        this._currentSession,
        taskId,
        config.trackTaskUsage,
        this._timeWindowManager
      );

      // Apply the updates to the current session
      await this.updateSession(updates);
    }
  }

  /**
   * Track file activity in the session
   * @param fileId File ID to track
   */
  async trackFileActivity(fileId: number): Promise<void> {
    if (!this._currentSession) {
      await this.initialize();
      if (!this._currentSession) {
        return;
      }
    }

    if (this._activityAdapter) {
      await this._activityAdapter.trackFileActivity(fileId);
    } else {
      // Fallback using activity module directly
      await Activity.trackFileActivityForSession(
        this._db,
        this._currentSession.id,
        fileId,
        this._configManager.getValue('trackFileChanges')
      );
    }
  }

  /**
   * Record an activity in the session
   * @param activityType Type of activity
   * @param metadata Activity metadata
   */
  async recordActivity(
    activityType: SessionActivityType,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    if (!this._currentSession) {
      await this.initialize();
      if (!this._currentSession) {
        return;
      }
    }

    if (this._activityAdapter) {
      await this._activityAdapter.recordActivity(activityType, metadata);
    } else {
      // Fallback using activity module directly
      await Activity.createSessionActivity(
        this._db,
        this._currentSession,
        activityType,
        metadata,
        this._timeWindowManager
      );
    }
  }

  /**
   * Get activity metrics for the current session
   */
  async getActivityMetrics(): Promise<ActivityMetrics | null> {
    if (!this._currentSession) {
      await this.initialize();
      if (!this._currentSession) {
        return null;
      }
    }

    if (this._activityAdapter) {
      return this._activityAdapter.getActivityMetrics();
    } else {
      // Fallback using activity module directly
      const metrics = await Activity.getSessionActivitySummary(
        this._db,
        this._currentSession.id
      );

      return {
        taskCount: metrics.taskCount,
        fileCount: metrics.fileCount,
        lastActivity: metrics.lastActivity,
        activeTime: metrics.activeTime,
        activityScore: metrics.activityScore
      };
    }
  }
  
  /**
   * Disconnect current session
   */
  async disconnectSession(): Promise<void> {
    if (!this._currentSession) {
      logger.debug('No session to disconnect');
      return;
    }

    if (this._lifecycleAdapter) {
      await this._lifecycleAdapter.disconnectSession();
      this._inactivityTimer = null;
    } else {
      // Fallback using state handler module directly
      await StateHandler.disconnectCurrentSession(
        this,
        this._db,
        this._currentSession,
        this._configManager.getValue('persistSessions'),
        this._inactivityTimer,
        () => { this._currentSession = null; }
      );
      this._inactivityTimer = null;
    }
  }

  /**
   * Get current terminal session
   * @returns Current terminal session or null if not in a terminal
   */
  getCurrentSession(): TerminalSessionState | null {
    return this._currentSession;
  }

  /**
   * Get terminal integration status
   * @returns Terminal integration status
   */
  async getIntegrationStatus(): Promise<TerminalIntegrationStatus> {
    if (this._statusAdapter) {
      return this._statusAdapter.getIntegrationStatus();
    } else {
      // Fallback using state handler module directly
      const config = this._configManager.getConfig();
      return StateHandler.getSessionIntegrationStatus(
        this._db,
        this._currentSession,
        config.trackTaskUsage,
        config.trackFileChanges,
        config.persistSessions,
        config.enableReconnection
      );
    }
  }

  /**
   * Try to recover a session using the SessionRecoveryManager
   * @param fingerprint Terminal fingerprint to match against
   * @returns Recovered session or null if recovery failed
   */
  async tryRecoverSession(fingerprint?: TerminalFingerprint): Promise<TerminalSessionState | null> {
    if (this._recoveryAdapter) {
      return this._recoveryAdapter.tryRecoverSession(fingerprint);
    } else {
      // Fallback using state handler module directly
      return StateHandler.tryRecoverSession(
        this._recoveryManager,
        fingerprint
      );
    }
  }

  /**
   * Enable session recovery for the current session
   * This marks the current session as recoverable and configures recovery options
   * @returns Whether session recovery was successfully enabled
   */
  async enableSessionRecovery(): Promise<boolean> {
    if (!this._currentSession) {
      await this.initialize();
      if (!this._currentSession) {
        return false;
      }
    }

    if (this._recoveryAdapter) {
      return this._recoveryAdapter.enableSessionRecovery();
    } else {
      // Fallback using state handler module directly
      return StateHandler.enableSessionRecovery(
        this,
        this._db,
        this._recoveryManager,
        this._currentSession.id
      );
    }
  }

  /**
   * Get the Time Window Manager instance
   * @returns Time Window Manager or null if not available
   */
  getTimeWindowManager(): TimeWindowManager | null {
    return this._timeWindowManager;
  }

  /**
   * Find time windows for the current session
   * @param options Time window criteria
   * @returns List of time windows or empty array if no windows found
   */
  async findSessionTimeWindows(options: TimeWindowQueryOptions = {}): Promise<any[]> {
    if (!this._currentSession) {
      await this.initialize();
      if (!this._currentSession) {
        return [];
      }
    }

    if (this._timeWindowAdapter) {
      return this._timeWindowAdapter.findTimeWindows(options);
    } else {
      // Fallback using time window integration module directly
      return TimeWindowIntegration.findTimeWindows(
        this._timeWindowManager,
        this._currentSession.id,
        options
      );
    }
  }

  /**
   * Create a time window for the current session
   * @param startTime Start time for the window
   * @param endTime End time for the window
   * @param options Window options
   * @returns Created time window or null if creation failed
   */
  async createSessionTimeWindow(
    startTime: Date,
    endTime: Date,
    options: TimeWindowCreationOptions = {}
  ): Promise<any | null> {
    if (!this._currentSession) {
      await this.initialize();
      if (!this._currentSession) {
        return null;
      }
    }

    if (this._timeWindowAdapter) {
      return this._timeWindowAdapter.createTimeWindow(startTime, endTime, options);
    } else {
      // Fallback using time window integration module directly
      return TimeWindowIntegration.createTimeWindow(
        this._timeWindowManager,
        this._currentSession.id,
        startTime,
        endTime,
        options
      );
    }
  }

  /**
   * Auto-detect time windows for the current session
   * @returns List of detected time windows or empty array if detection failed
   */
  async autoDetectSessionTimeWindows(): Promise<any[]> {
    if (!this._currentSession) {
      await this.initialize();
      if (!this._currentSession) {
        return [];
      }
    }

    if (this._timeWindowAdapter) {
      return this._timeWindowAdapter.autoDetectTimeWindows();
    } else {
      // Fallback using time window integration module directly
      return TimeWindowIntegration.autoDetectTimeWindows(
        this._timeWindowManager,
        this._currentSession.id
      );
    }
  }
  
  /**
   * Get the configuration manager
   * @returns Terminal session configuration manager
   */
  getConfigManager(): TerminalSessionConfiguration {
    return this._configManager;
  }

  /**
   * Clean up resources and event handlers
   * This should be called when the application is shutting down
   * to prevent memory leaks and properly close connections.
   */
  async cleanup(): Promise<void> {
    try {
      // Disconnect session if active
      if (this._currentSession) {
        await this.disconnectSession();
      }

      // Clean up event handlers
      cleanupEventHandlers(this._inactivityTimer);

      // Clear adapters
      this._timeWindowAdapter = null;
      this._recoveryAdapter = null;
      this._activityAdapter = null;
      this._statusAdapter = null;
      this._lifecycleAdapter = null;

      // Clear managers
      this._timeWindowManager = null;
      this._recoveryManager = null;

      logger.info('Terminal session manager cleaned up successfully');
    } catch (error) {
      logger.error('Error cleaning up terminal session manager:', error);
    }
  }
}