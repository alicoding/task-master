/**
 * Terminal Session Lifecycle Adapter for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides adapter methods for lifecycle operations in terminal sessions,
 * further reducing the size of the main terminal-session-manager class.
 */

import { EventEmitter } from 'events';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { TerminalSessionState, TerminalSessionManagerConfig } from './terminal-session-types.ts';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import { TimeWindowManager } from './time-window-manager.ts';
import * as integration from './terminal-session-manager-integration.ts';
import { createLogger } from '../utils/logger.ts';

// Create logger for terminal lifecycle
const logger = createLogger('TerminalSessionLifecycle');

/**
 * Lifecycle Adapter class to handle terminal session lifecycle operations
 */
export class TerminalSessionLifecycleAdapter {
  private _emitter: EventEmitter;
  private _db: BetterSQLite3Database;
  private _config: TerminalSessionManagerConfig;
  private _recoveryManager: SessionRecoveryManager | null;
  private _timeWindowManager: TimeWindowManager | null;
  private _currentSession: TerminalSessionState | null;
  private _detectingSession: boolean;
  private _inactivityTimer: NodeJS.Timeout | null;
  private _updateSession: (updates: Partial<TerminalSessionState>) => Promise<void>;
  private _setSession: (session: TerminalSessionState | null) => void;
  private _setDetectingSession: (detecting: boolean) => void;

  /**
   * Create a new Lifecycle Adapter
   */
  constructor(
    emitter: EventEmitter,
    db: BetterSQLite3Database,
    config: TerminalSessionManagerConfig,
    managers: {
      recoveryManager: SessionRecoveryManager | null;
      timeWindowManager: TimeWindowManager | null;
    },
    state: {
      currentSession: TerminalSessionState | null;
      detectingSession: boolean;
      inactivityTimer: NodeJS.Timeout | null;
    },
    callbacks: {
      updateSession: (updates: Partial<TerminalSessionState>) => Promise<void>;
      setSession: (session: TerminalSessionState | null) => void;
      setDetectingSession: (detecting: boolean) => void;
    }
  ) {
    this._emitter = emitter;
    this._db = db;
    this._config = config;
    this._recoveryManager = managers.recoveryManager;
    this._timeWindowManager = managers.timeWindowManager;
    this._currentSession = state.currentSession;
    this._detectingSession = state.detectingSession;
    this._inactivityTimer = state.inactivityTimer;
    this._updateSession = callbacks.updateSession;
    this._setSession = callbacks.setSession;
    this._setDetectingSession = callbacks.setDetectingSession;
  }

  /**
   * Initialize the terminal session manager and detect current session
   */
  async initialize(): Promise<TerminalSessionState | null> {
    try {
      return await integration.initializeSession(
        this._emitter, 
        this._db, 
        this._config,
        { 
          recoveryManager: this._recoveryManager,
          timeWindowManager: this._timeWindowManager
        },
        this._currentSession,
        {
          detectingSession: this._detectingSession,
          inactivityTimer: this._inactivityTimer
        },
        this._updateSession,
        this._setSession,
        this._setDetectingSession
      );
    } catch (error) {
      logger.error('Error initializing terminal session:', error);
      return null;
    }
  }
  
  /**
   * Detect current terminal session
   * @returns Terminal session state or null if not in a terminal
   */
  async detectSession(): Promise<TerminalSessionState | null> {
    try {
      return await integration.detectSessionState(
        this._emitter,
        this._db,
        this._config,
        {
          recoveryManager: this._recoveryManager,
          timeWindowManager: this._timeWindowManager
        },
        this._currentSession,
        {
          detectingSession: this._detectingSession
        },
        this._setSession,
        this._setDetectingSession
      );
    } catch (error) {
      logger.error('Error detecting terminal session:', error);
      return null;
    }
  }

  /**
   * Update current session with provided values
   * @param updates Session state updates
   */
  async updateSession(updates: Partial<TerminalSessionState> = {}): Promise<void> {
    try {
      await integration.updateSessionState(
        this._emitter,
        this._db,
        this._currentSession,
        updates,
        {
          persistSessions: this._config.persistSessions,
          trackTaskUsage: this._config.trackTaskUsage
        },
        this._timeWindowManager,
        this._updateSession
      );
    } catch (error) {
      logger.error('Error updating terminal session:', error);
    }
  }

  /**
   * Disconnect current session
   */
  async disconnectSession(): Promise<void> {
    await integration.disconnectSessionState(
      this._emitter,
      this._db,
      this._currentSession,
      {
        persistSessions: this._config.persistSessions
      },
      {
        inactivityTimer: this._inactivityTimer
      },
      (session) => {
        this._setSession(session);
        // Reset inactivity timer - would need to be propagated back to the session manager
      }
    );
  }
}