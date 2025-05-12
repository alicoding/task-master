/**
 * Terminal Session Activity Adapter for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides adapter methods for tracking activity in terminal sessions,
 * further reducing the size of the main terminal-session-manager class.
 */

import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { SessionActivityType, TerminalSessionState } from './terminal-session-types.ts';
import { TimeWindowManager } from './time-window-manager.ts';
import { ActivityMetrics } from './terminal-session-manager-adapter.ts';
import * as integration from './terminal-session-manager-integration.ts';

/**
 * Activity Adapter class to handle all session activity operations
 */
export class TerminalSessionActivityAdapter {
  private _db: BetterSQLite3Database;
  private _sessionAccessor: () => TerminalSessionState | null;
  private _timeWindowManager: TimeWindowManager | null;
  private _configAccessor: {
    trackTaskUsage: () => boolean;
    trackFileChanges: () => boolean;
  };
  private _updateSession: (updates: Partial<TerminalSessionState>) => Promise<void>;

  /**
   * Create a new Activity Adapter
   * 
   * @param db Database connection
   * @param sessionAccessor Function to access the current session
   * @param timeWindowManager Time window manager instance
   * @param configAccessor Object with functions to access configuration values
   * @param updateSession Function to update the session
   */
  constructor(
    db: BetterSQLite3Database,
    sessionAccessor: () => TerminalSessionState | null,
    timeWindowManager: TimeWindowManager | null,
    configAccessor: {
      trackTaskUsage: () => boolean;
      trackFileChanges: () => boolean;
    },
    updateSession: (updates: Partial<TerminalSessionState>) => Promise<void>
  ) {
    this._db = db;
    this._sessionAccessor = sessionAccessor;
    this._timeWindowManager = timeWindowManager;
    this._configAccessor = configAccessor;
    this._updateSession = updateSession;
  }

  /**
   * Update session with task usage
   * @param taskId Task ID to track
   */
  async trackTaskUsage(taskId: string): Promise<void> {
    await integration.trackSessionTaskUsage(
      this._db,
      this._sessionAccessor(),
      taskId,
      {
        trackTaskUsage: this._configAccessor.trackTaskUsage()
      },
      this._timeWindowManager,
      this._updateSession
    );
  }

  /**
   * Track file activity in the session
   * @param fileId File ID to track
   */
  async trackFileActivity(fileId: number): Promise<void> {
    await integration.trackSessionFileActivity(
      this._db,
      this._sessionAccessor(),
      fileId,
      {
        trackFileChanges: this._configAccessor.trackFileChanges()
      },
      this._updateSession
    );
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
    await integration.recordSessionActivity(
      this._db,
      this._sessionAccessor(),
      activityType,
      metadata,
      this._timeWindowManager,
      this._updateSession
    );
  }

  /**
   * Get activity metrics for the current session
   */
  async getActivityMetrics(): Promise<ActivityMetrics | null> {
    return integration.getSessionActivityMetrics(
      this._db,
      this._sessionAccessor()
    );
  }
}