/**
 * Terminal Session Recovery Integration for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides standalone functions for terminal session recovery,
 * including recovery attempts and configuration for recoverable sessions.
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.ts';
import { TerminalFingerprint, TerminalSessionState } from './terminal-session-types.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import {
  tryRecoverSession as attemptRecovery,
  enableSessionRecovery as enableRecovery
} from './terminal-session-recovery.ts';

// Create logger for terminal recovery integration
const logger = createLogger('TerminalSessionRecovery');

/**
 * Try to recover a session using fingerprint matching
 * @param recoveryManager The recovery manager instance
 * @param fingerprint Terminal fingerprint to match against
 * @returns Recovered session or null if recovery failed
 */
export async function tryToRecoverSession(
  recoveryManager: SessionRecoveryManager | null,
  fingerprint?: TerminalFingerprint
): Promise<TerminalSessionState | null> {
  if (!recoveryManager) {
    logger.debug('Session recovery not enabled');
    return null;
  }

  try {
    return await attemptRecovery(recoveryManager, fingerprint);
  } catch (error) {
    logger.error('Error recovering session:', error);
    return null;
  }
}

/**
 * Enable session recovery for a terminal session
 * @param manager Event emitter (terminal session manager)
 * @param db Database connection
 * @param recoveryManager Recovery manager
 * @param sessionId Session ID
 * @returns Whether session recovery was successfully enabled
 */
export async function enableRecoveryForSession(
  manager: EventEmitter,
  db: BetterSQLite3Database,
  recoveryManager: SessionRecoveryManager | null,
  sessionId: string
): Promise<boolean> {
  if (!recoveryManager) {
    logger.debug('Cannot enable session recovery: No recovery manager');
    return false;
  }

  try {
    return await enableRecovery(
      db,
      recoveryManager,
      sessionId
    );
  } catch (error) {
    logger.error('Error enabling session recovery:', error);
    return false;
  }
}