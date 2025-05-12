/**
 * Terminal Session Initialization for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides initialization and setup functionality for terminal sessions.
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.ts';
import {
  TerminalFingerprint,
  TerminalSessionState
} from './terminal-session-types.ts';
import {
  isInTerminal,
  getTerminalFingerprint,
  getWindowSize,
  dbSessionToState
} from './terminal-session-utils.ts';
import {
  findExistingSession,
  createSession
} from './terminal-session-index.ts';
import { tryRecoverSession } from './terminal-session-recovery.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { SessionRecoveryManager } from './session-recovery-manager.ts';
import { terminalSessions } from '../../db/schema-extensions.ts';
import { eq } from 'drizzle-orm';

// Create logger for terminal initialization
const logger = createLogger('TerminalSessionInitialization');

/**
 * Initialize event listeners for a session
 * @param disconnectHandler Function to handle disconnection
 */
export function initializeEventListeners(disconnectHandler: () => void): void {
  // Set up event listeners
  process.on('exit', disconnectHandler);
  process.on('SIGINT', () => {
    disconnectHandler();
    process.exit(0);
  });
}

/**
 * Detect current terminal session
 * @param db Database connection
 * @param persistSessions Whether to persist sessions
 * @param enableReconnection Whether to enable reconnection
 * @param recoveryManager Session recovery manager
 * @returns Terminal session state or null if not in a terminal
 */
export async function detectTerminalSession(
  db: BetterSQLite3Database,
  persistSessions: boolean,
  enableReconnection: boolean,
  recoveryManager: SessionRecoveryManager | null
): Promise<TerminalSessionState | null> {
  try {
    // Check if we're in a terminal
    if (!isInTerminal()) {
      logger.debug('Not in a terminal, skipping session detection');
      return null;
    }
    
    // Get terminal fingerprint
    const fingerprint = getTerminalFingerprint();
    
    if (!fingerprint) {
      logger.debug('Could not get terminal fingerprint, skipping session detection');
      return null;
    }
    
    logger.debug('Terminal fingerprint:', fingerprint);
    
    // Try to reconnect to an existing session
    if (enableReconnection && persistSessions) {
      // First try to find an exact match in the database
      const existingSession = await findExistingSession(db, fingerprint);

      if (existingSession) {
        logger.debug(`Found existing session: ${existingSession.id}`);
        return dbSessionToState(existingSession, fingerprint);
      }

      // If no exact match, try recovery as a fallback
      if (recoveryManager) {
        logger.debug('No exact session match, attempting recovery');
        const recoveredSession = await tryRecoverSession(recoveryManager, fingerprint);

        if (recoveredSession) {
          logger.debug(`Recovered session: ${recoveredSession.id}`);
          return recoveredSession;
        }
      }
    }
    
    // Create a new session
    if (persistSessions) {
      const sessionId = uuidv4();
      await createSession(db, sessionId, fingerprint);
      
      // Get session state
      const dbSession = await db.query.terminalSessions.findFirst({
        where: eq(terminalSessions.id, sessionId)
      });
      
      if (dbSession) {
        logger.debug(`Created new persistent session: ${sessionId}`);
        return dbSessionToState(dbSession, fingerprint);
      }
    } else {
      // Create in-memory session
      const sessionId = uuidv4();
      const windowSize = getWindowSize();
      
      const session: TerminalSessionState = {
        id: sessionId,
        fingerprint,
        startTime: new Date(),
        lastActive: new Date(),
        status: 'active',
        windowSize,
        recentTaskIds: [],
        connectionCount: 1,
        environmentVariables: {}
      };
      
      logger.debug(`Created new in-memory session: ${sessionId}`);
      return session;
    }
    
    return null;
  } catch (error) {
    logger.error('Error detecting terminal session:', error);
    return null;
  }
}

/**
 * Check session inactivity and update status if needed
 * @param sessionId Session ID
 * @param lastActive Last active time
 * @param status Current status
 * @param inactivityTimeout Inactivity timeout in minutes
 * @param updateHandler Function to handle status update
 */
export async function checkSessionInactivity(
  sessionId: string,
  lastActive: Date,
  status: string,
  inactivityTimeout: number,
  updateHandler: (updates: { status: string }) => Promise<void>
): Promise<void> {
  if (status !== 'active') {
    return;
  }
  
  try {
    // Calculate inactive time in minutes
    const now = new Date();
    const inactiveTime = (now.getTime() - lastActive.getTime()) / (60 * 1000);
    
    // If inactive for too long, mark as inactive
    if (inactiveTime >= inactivityTimeout) {
      await updateHandler({ status: 'inactive' });
      
      logger.debug(`Marked terminal session as inactive: ${sessionId}`);
    }
  } catch (error) {
    logger.error('Error checking session inactivity:', error);
  }
}