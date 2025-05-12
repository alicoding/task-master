/**
 * Terminal Session Recovery Adapter for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides adapter methods for session recovery operations,
 * further reducing the size of the main terminal-session-manager class.
 */

import { EventEmitter } from 'events';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { TerminalFingerprint, TerminalSessionState } from './terminal-session-types.ts';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import * as integration from './terminal-session-manager-integration.ts';

/**
 * Recovery Adapter class to handle all session recovery operations
 */
export class TerminalSessionRecoveryAdapter {
  private _emitter: EventEmitter;
  private _db: BetterSQLite3Database;
  private _sessionAccessor: () => TerminalSessionState | null;
  private _recoveryManager: SessionRecoveryManager | null;

  /**
   * Create a new Recovery Adapter
   * 
   * @param emitter Event emitter for recovery events
   * @param db Database connection
   * @param sessionAccessor Function to access the current session
   * @param recoveryManager Recovery manager instance 
   */
  constructor(
    emitter: EventEmitter,
    db: BetterSQLite3Database,
    sessionAccessor: () => TerminalSessionState | null,
    recoveryManager: SessionRecoveryManager | null
  ) {
    this._emitter = emitter;
    this._db = db;
    this._sessionAccessor = sessionAccessor;
    this._recoveryManager = recoveryManager;
  }

  /**
   * Try to recover a session using the SessionRecoveryManager
   * @param fingerprint Terminal fingerprint to match against
   * @returns Recovered session or null if recovery failed
   */
  async tryRecoverSession(fingerprint?: TerminalFingerprint): Promise<TerminalSessionState | null> {
    return integration.recoverSession(
      this._recoveryManager,
      fingerprint
    );
  }

  /**
   * Enable session recovery for the current session
   * This marks the current session as recoverable and configures recovery options
   * @returns Whether session recovery was successfully enabled
   */
  async enableSessionRecovery(): Promise<boolean> {
    return integration.enableSessionRecovery(
      this._emitter,
      this._db,
      this._sessionAccessor(),
      this._recoveryManager
    );
  }

  /**
   * Get the recovery manager instance
   * @returns Recovery manager or null if not available
   */
  getRecoveryManager(): SessionRecoveryManager | null {
    return this._recoveryManager;
  }
}