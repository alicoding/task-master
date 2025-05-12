/**
 * Terminal Session Operations for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides operations for terminal session management,
 * including session detection, creation, and updates.
 */

import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger.ts';
import {
  TerminalFingerprint,
  TerminalSessionState,
  TerminalSession,
  SessionOperationResult
} from './terminal-session-types.ts';
import {
  isInTerminal,
  getTerminalFingerprint,
  getWindowSize,
  dbSessionToState
} from './terminal-session-utils.ts';
import {
  terminalSessions,
  sessionTasks,
  fileSessionMapping
} from '../../db/schema-extensions.ts';
import { eq, and, or, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// Create logger for terminal operations
const logger = createLogger('TerminalSessionOperations');

/**
 * Find an existing session by terminal fingerprint
 * @param db Database connection
 * @param fingerprint Terminal fingerprint
 * @returns Terminal session or null if not found
 */
export async function findExistingSession(
  db: BetterSQLite3Database,
  fingerprint: TerminalFingerprint
): Promise<TerminalSession | null> {
  try {
    // Try to find by TTY path first
    if (fingerprint.tty) {
      const ttySession = await db.query.terminalSessions.findFirst({
        where: and(
          eq(terminalSessions.tty, fingerprint.tty),
          or(
            eq(terminalSessions.status, 'active'),
            eq(terminalSessions.status, 'inactive')
          )
        ),
        orderBy: desc(terminalSessions.lastActive)
      });
      
      if (ttySession) {
        return ttySession;
      }
    }
    
    // Try to find by PID/PPID combination
    const pidSession = await db.query.terminalSessions.findFirst({
      where: and(
        eq(terminalSessions.pid, fingerprint.pid),
        eq(terminalSessions.ppid, fingerprint.ppid),
        or(
          eq(terminalSessions.status, 'active'),
          eq(terminalSessions.status, 'inactive')
        )
      ),
      orderBy: desc(terminalSessions.lastActive)
    });
    
    if (pidSession) {
      return pidSession;
    }
    
    // Try more specific matches for tmux/screen
    if (fingerprint.tmuxSession) {
      // Find session with matching tmux session in metadata
      const tmuxSessions = await db.query.terminalSessions.findMany({
        where: or(
          eq(terminalSessions.status, 'active'),
          eq(terminalSessions.status, 'inactive')
        ),
        orderBy: desc(terminalSessions.lastActive)
      });
      
      for (const session of tmuxSessions) {
        try {
          const metadata = JSON.parse(session.metadata || '{}');
          if (metadata.tmuxSession === fingerprint.tmuxSession) {
            return session;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
    
    // No existing session found
    return null;
  } catch (error) {
    logger.error('Error finding existing session:', error);
    return null;
  }
}

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

/**
 * Record task usage in a session
 * @param db Database connection
 * @param sessionId Session ID
 * @param taskId Task ID to record
 */
export async function recordTaskUsage(
  db: BetterSQLite3Database,
  sessionId: string,
  taskId: string,
  maxHistory: number = 20
): Promise<SessionOperationResult> {
  try {
    // Check if task exists in session_tasks
    const existingTask = await db.query.sessionTasks.findFirst({
      where: and(
        eq(sessionTasks.sessionId, sessionId),
        eq(sessionTasks.taskId, taskId)
      )
    });
    
    if (existingTask) {
      // Update access time
      await db.update(sessionTasks)
        .set({ accessTime: new Date() })
        .where(and(
          eq(sessionTasks.sessionId, sessionId),
          eq(sessionTasks.taskId, taskId)
        ));
    } else {
      // Insert new record
      await db.insert(sessionTasks).values({
        sessionId,
        taskId,
        accessTime: new Date()
      });
    }
    
    logger.debug(`Recorded task usage: ${taskId} in session ${sessionId}`);
    
    return {
      success: true,
      sessionId,
      message: 'Task usage recorded successfully',
      data: { taskId }
    };
  } catch (error) {
    logger.error('Error recording task usage:', error);
    
    return {
      success: false,
      sessionId,
      error: error instanceof Error ? error.message : String(error),
      message: 'Failed to record task usage'
    };
  }
}

/**
 * Record file change in a session
 * @param db Database connection
 * @param sessionId Session ID
 * @param fileId File ID to record
 */
export async function recordFileChange(
  db: BetterSQLite3Database,
  sessionId: string,
  fileId: number
): Promise<SessionOperationResult> {
  try {
    // Check if file exists in file_session_mapping
    const existingMapping = await db.query.fileSessionMapping.findFirst({
      where: and(
        eq(fileSessionMapping.sessionId, sessionId),
        eq(fileSessionMapping.fileId, fileId)
      )
    });
    
    if (existingMapping) {
      // Update last modified time
      await db.update(fileSessionMapping)
        .set({ lastModified: new Date() })
        .where(and(
          eq(fileSessionMapping.sessionId, sessionId),
          eq(fileSessionMapping.fileId, fileId)
        ));
    } else {
      // Insert new record
      await db.insert(fileSessionMapping).values({
        sessionId,
        fileId,
        firstSeen: new Date(),
        lastModified: new Date()
      });
    }
    
    logger.debug(`Recorded file change: ${fileId} in session ${sessionId}`);
    
    return {
      success: true,
      sessionId,
      message: 'File change recorded successfully',
      data: { fileId }
    };
  } catch (error) {
    logger.error('Error recording file change:', error);
    
    return {
      success: false,
      sessionId,
      error: error instanceof Error ? error.message : String(error),
      message: 'Failed to record file change'
    };
  }
}

/**
 * Get recent tasks for a session
 * @param db Database connection
 * @param sessionId Session ID
 * @param limit Maximum number of tasks to return
 * @returns List of recent task IDs
 */
export async function getRecentTasks(
  db: BetterSQLite3Database,
  sessionId: string,
  limit: number = 10
): Promise<string[]> {
  try {
    const tasks = await db.select().from(sessionTasks)
      .where(eq(sessionTasks.sessionId, sessionId))
      .orderBy(desc(sessionTasks.accessTime))
      .limit(limit);
    
    return tasks.map(task => task.taskId);
  } catch (error) {
    logger.error('Error getting recent tasks:', error);
    return [];
  }
}

/**
 * Get all active sessions
 * @param db Database connection
 * @param includeInactive Whether to include inactive sessions
 * @returns List of terminal sessions
 */
export async function getActiveSessions(
  db: BetterSQLite3Database,
  includeInactive: boolean = false
): Promise<TerminalSession[]> {
  try {
    const query = db.select().from(terminalSessions);
    
    if (!includeInactive) {
      query.where(eq(terminalSessions.status, 'active'));
    } else {
      query.where(or(
        eq(terminalSessions.status, 'active'),
        eq(terminalSessions.status, 'inactive')
      ));
    }
    
    query.orderBy(desc(terminalSessions.lastActive));
    
    return await query;
  } catch (error) {
    logger.error('Error getting active sessions:', error);
    return [];
  }
}

/**
 * Get a specific session by ID
 * @param db Database connection
 * @param sessionId Session ID
 * @returns Terminal session or null if not found
 */
export async function getSessionById(
  db: BetterSQLite3Database,
  sessionId: string
): Promise<TerminalSession | null> {
  try {
    const session = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, sessionId)
    });
    
    return session;
  } catch (error) {
    logger.error('Error getting session by ID:', error);
    return null;
  }
}