/**
 * Terminal Session Status Adapter for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides adapter methods for status operations in terminal sessions,
 * further reducing the size of the main terminal-session-manager class.
 */

import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { TerminalSessionState, TerminalIntegrationStatus } from './terminal-session-types.ts';
import { TerminalSessionConfiguration } from './terminal-session-configuration.ts';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import * as integration from './terminal-session-manager-integration.ts';

/**
 * Status Adapter class to handle terminal session status operations
 */
export class TerminalSessionStatusAdapter {
  private _db: BetterSQLite3Database;
  private _sessionAccessor: () => TerminalSessionState | null;
  private _configManager: TerminalSessionConfiguration;
  private _recoveryManager: SessionRecoveryManager | null;

  /**
   * Create a new Status Adapter
   * 
   * @param db Database connection
   * @param sessionAccessor Function to access the current session
   * @param configManager Terminal session configuration
   * @param recoveryManager Recovery manager instance
   */
  constructor(
    db: BetterSQLite3Database,
    sessionAccessor: () => TerminalSessionState | null,
    configManager: TerminalSessionConfiguration,
    recoveryManager: SessionRecoveryManager | null
  ) {
    this._db = db;
    this._sessionAccessor = sessionAccessor;
    this._configManager = configManager;
    this._recoveryManager = recoveryManager;
  }

  /**
   * Get terminal integration status
   * @returns Terminal integration status
   */
  async getIntegrationStatus(): Promise<TerminalIntegrationStatus> {
    const config = this._configManager.getConfig();
    return integration.getSessionIntegrationStatus(
      this._db,
      this._sessionAccessor(),
      {
        trackTaskUsage: config.trackTaskUsage,
        trackFileChanges: config.trackFileChanges,
        persistSessions: config.persistSessions
      },
      this._recoveryManager
    );
  }

  /**
   * Get current terminal session
   * @returns Current terminal session or null if not in a terminal
   */
  getCurrentSession(): TerminalSessionState | null {
    return this._sessionAccessor();
  }

  /**
   * Get the configuration manager
   * @returns Terminal session configuration manager
   */
  getConfigManager(): TerminalSessionConfiguration {
    return this._configManager;
  }
}