/**
 * Terminal Session Recovery Integration for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides integration with the SessionRecoveryManager for terminal sessions.
 */

import { createLogger } from '../utils/logger.ts';
import {
  TerminalFingerprint,
  TerminalSessionState
} from './terminal-session-types.ts';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import { TimeWindowManager } from './time-window-manager.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { terminalSessions } from '../../db/schema-extensions.ts';
import { eq } from 'drizzle-orm';

// Create logger for terminal recovery integration
const logger = createLogger('TerminalSessionRecovery');

/**
 * Setup recovery manager for terminal sessions
 * @param db Database connection 
 * @returns Session recovery manager instance
 */
export function setupRecoveryManager(
  db: BetterSQLite3Database
): SessionRecoveryManager {
  // Create the recovery manager
  const recoveryManager = new SessionRecoveryManager(db);
  
  logger.debug('Session Recovery Manager initialized');
  
  return recoveryManager;
}

/**
 * Get time window manager from recovery manager
 * @param recoveryManager Session recovery manager
 * @returns Time window manager
 */
export function getTimeWindowManager(
  recoveryManager: SessionRecoveryManager
): TimeWindowManager {
  return recoveryManager.getTimeWindowManager();
}

/**
 * Try to recover a session using the SessionRecoveryManager
 * @param recoveryManager Session recovery manager
 * @param fingerprint Terminal fingerprint to match against
 * @returns Recovered session or null if recovery failed
 */
export async function tryRecoverSession(
  recoveryManager: SessionRecoveryManager,
  fingerprint?: TerminalFingerprint
): Promise<TerminalSessionState | null> {
  try {
    logger.debug('Attempting to recover session');
    
    // Use the recovery manager to find and recover the most appropriate session
    const recoveredSession = await recoveryManager.recoverMostRecentSession(fingerprint);
    
    if (recoveredSession) {
      logger.info(`Successfully recovered session: ${recoveredSession.id}`);
      return recoveredSession;
    }
    
    logger.debug('No suitable session found for recovery');
    return null;
  } catch (error) {
    logger.error('Error recovering session:', error);
    return null;
  }
}

/**
 * Enable session recovery for a session
 * @param db Database connection
 * @param recoveryManager Session recovery manager
 * @param sessionId Session ID to enable recovery for
 * @returns Whether session recovery was successfully enabled
 */
export async function enableSessionRecovery(
  db: BetterSQLite3Database,
  recoveryManager: SessionRecoveryManager,
  sessionId: string
): Promise<boolean> {
  try {
    // Get the session
    const session = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, sessionId)
    });
    
    if (!session) {
      logger.debug(`Cannot enable session recovery: Session ${sessionId} not found`);
      return false;
    }
    
    // Currently no additional configuration is needed
    // as sessions are recoverable by default
    
    logger.debug(`Session recovery enabled for session: ${sessionId}`);
    
    return true;
  } catch (error) {
    logger.error('Error enabling session recovery:', error);
    return false;
  }
}

/**
 * Recover a specific session by ID
 * @param recoveryManager Session recovery manager
 * @param sessionId Session ID to recover
 * @returns Recovered session or null if recovery failed
 */
export async function recoverSpecificSession(
  recoveryManager: SessionRecoveryManager,
  sessionId: string
): Promise<TerminalSessionState | null> {
  try {
    const recoveredSession = await recoveryManager.recoverSession(sessionId);
    
    if (recoveredSession) {
      logger.info(`Successfully recovered session: ${sessionId}`);
      return recoveredSession;
    }
    
    logger.error(`Failed to recover session: ${sessionId}`);
    return null;
  } catch (error) {
    logger.error('Error recovering specific session:', error);
    return null;
  }
}

/**
 * Recover all disconnected sessions for the current user
 * @param recoveryManager Session recovery manager
 * @returns Recovery result summary
 */
export async function recoverAllUserSessions(
  recoveryManager: SessionRecoveryManager
): Promise<{
  total: number;
  successful: number;
  failed: number;
  sessions: Array<{ id: string; success: boolean; error?: string }>
}> {
  try {
    const result = await recoveryManager.recoverAllUserSessions();
    
    logger.info(`Recovered ${result.successful}/${result.total} sessions`);
    
    return result;
  } catch (error) {
    logger.error('Error recovering all user sessions:', error);
    
    return {
      total: 0,
      successful: 0,
      failed: 0,
      sessions: []
    };
  }
}