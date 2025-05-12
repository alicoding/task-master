/**
 * Terminal Session Lifecycle for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides lifecycle functions for terminal sessions,
 * including creation, reconnection, and disconnection.
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.ts';
import {
  TerminalFingerprint,
  TerminalSession,
  SessionOperationResult
} from './terminal-session-types.ts';
import {
  getWindowSize
} from './terminal-session-utils.ts';
import { terminalSessions } from '../../db/schema-extensions.ts';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { findExistingSession } from './terminal-session-finder.ts';

// Create logger for terminal lifecycle operations
const logger = createLogger('TerminalSessionLifecycle');

/**
 * Create a new terminal session
 * @param db Database connection
 * @param sessionId Session ID
 * @param fingerprint Terminal fingerprint
 */
export async function createSession(
  db: BetterSQLite3Database,
  sessionId: string,
  fingerprint: TerminalFingerprint
): Promise<SessionOperationResult> {
  try {
    const windowSize = getWindowSize();
    
    // Prepare metadata
    const metadata: Record<string, any> = {
      termEnv: fingerprint.termEnv
    };
    
    if (fingerprint.sshConnection) {
      metadata.sshConnection = fingerprint.sshConnection;
    }
    
    if (fingerprint.tmuxSession) {
      metadata.tmuxSession = fingerprint.tmuxSession;
    }
    
    if (fingerprint.screenSession) {
      metadata.screenSession = fingerprint.screenSession;
    }
    
    // Create new session record
    await db.insert(terminalSessions).values({
      id: sessionId,
      tty: fingerprint.tty,
      pid: fingerprint.pid,
      ppid: fingerprint.ppid,
      windowColumns: windowSize.columns,
      windowRows: windowSize.rows,
      user: fingerprint.user,
      shell: fingerprint.shell,
      startTime: new Date(),
      lastActive: new Date(),
      status: 'active',
      connectionCount: 1,
      metadata: JSON.stringify(metadata)
    });
    
    logger.debug(`Created new terminal session: ${sessionId}`);
    
    return {
      success: true,
      sessionId,
      message: 'Session created successfully'
    };
  } catch (error) {
    logger.error('Error creating terminal session:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Failed to create session'
    };
  }
}

/**
 * Reconnect to an existing session
 * @param db Database connection
 * @param sessionId Session ID to reconnect to
 * @param fingerprint Current terminal fingerprint
 * @returns Updated session or null if reconnection failed
 */
export async function reconnectSession(
  db: BetterSQLite3Database,
  sessionId: string,
  fingerprint: TerminalFingerprint
): Promise<TerminalSession | null> {
  try {
    // Get current session
    const currentSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, sessionId)
    });
    
    if (!currentSession) {
      logger.error(`Session not found: ${sessionId}`);
      return null;
    }
    
    // Get window size
    const windowSize = getWindowSize();
    
    // Update session metadata
    const metadata: Record<string, any> = JSON.parse(currentSession.metadata || '{}');
    
    if (fingerprint.termEnv) {
      metadata.termEnv = fingerprint.termEnv;
    }
    
    if (fingerprint.sshConnection) {
      metadata.sshConnection = fingerprint.sshConnection;
    }
    
    if (fingerprint.tmuxSession) {
      metadata.tmuxSession = fingerprint.tmuxSession;
    }
    
    if (fingerprint.screenSession) {
      metadata.screenSession = fingerprint.screenSession;
    }
    
    // Update connection count
    const connectionCount = (currentSession.connectionCount || 0) + 1;
    
    // Update session record
    await db.update(terminalSessions)
      .set({
        tty: fingerprint.tty,
        pid: fingerprint.pid,
        ppid: fingerprint.ppid,
        windowColumns: windowSize.columns,
        windowRows: windowSize.rows,
        lastActive: new Date(),
        status: 'active',
        connectionCount,
        metadata: JSON.stringify(metadata)
      })
      .where(eq(terminalSessions.id, sessionId));
    
    // Get updated session
    const updatedSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, sessionId)
    });
    
    logger.debug(`Reconnected to terminal session: ${sessionId} (connection #${connectionCount})`);
    
    return updatedSession;
  } catch (error) {
    logger.error('Error reconnecting to terminal session:', error);
    return null;
  }
}

/**
 * Disconnect a session
 * @param db Database connection
 * @param sessionId Session ID to disconnect
 */
export async function disconnectSession(
  db: BetterSQLite3Database,
  sessionId: string
): Promise<SessionOperationResult> {
  try {
    await db.update(terminalSessions)
      .set({
        status: 'disconnected',
        lastActive: new Date(),
        lastDisconnect: new Date()
      })
      .where(eq(terminalSessions.id, sessionId));
    
    logger.debug(`Disconnected terminal session: ${sessionId}`);
    
    return {
      success: true,
      sessionId,
      message: 'Session disconnected successfully'
    };
  } catch (error) {
    logger.error('Error disconnecting terminal session:', error);
    
    return {
      success: false,
      sessionId,
      error: error instanceof Error ? error.message : String(error),
      message: 'Failed to disconnect session'
    };
  }
}