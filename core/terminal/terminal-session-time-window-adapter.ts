/**
 * Terminal Session Time Window Adapter for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides adapter methods for time window operations in terminal sessions,
 * further reducing the size of the main terminal-session-manager class.
 */

import { TimeWindowManager } from './time-window-manager.ts';
import { TerminalSessionState } from './terminal-session-types.ts';
import { TimeWindowQueryOptions, TimeWindowCreationOptions } from './terminal-session-manager-adapter.ts';
import * as integration from './terminal-session-manager-integration.ts';

/**
 * Time Window Adapter class to handle all time window operations
 */
export class TerminalSessionTimeWindowAdapter {
  private _currentSession: () => TerminalSessionState | null;
  private _timeWindowManager: TimeWindowManager | null;

  /**
   * Create a new Time Window Adapter
   * 
   * @param sessionAccessor Function to access the current session 
   * @param timeWindowManager Time window manager instance
   */
  constructor(
    sessionAccessor: () => TerminalSessionState | null,
    timeWindowManager: TimeWindowManager | null
  ) {
    this._currentSession = sessionAccessor;
    this._timeWindowManager = timeWindowManager;
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
  async findTimeWindows(options: TimeWindowQueryOptions = {}): Promise<any[]> {
    return integration.findSessionTimeWindows(
      this._currentSession(),
      this._timeWindowManager,
      options
    );
  }

  /**
   * Create a time window for the current session
   * @param startTime Start time for the window
   * @param endTime End time for the window
   * @param options Window options
   * @returns Created time window or null if creation failed
   */
  async createTimeWindow(
    startTime: Date,
    endTime: Date,
    options: TimeWindowCreationOptions = {}
  ): Promise<any | null> {
    return integration.createSessionTimeWindow(
      this._currentSession(),
      this._timeWindowManager,
      startTime,
      endTime,
      options
    );
  }
  
  /**
   * Auto-detect time windows for the current session
   * @returns List of detected time windows or empty array if detection failed
   */
  async autoDetectTimeWindows(): Promise<any[]> {
    return integration.autoDetectSessionTimeWindows(
      this._currentSession(),
      this._timeWindowManager
    );
  }
}