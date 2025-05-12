/**
 * Terminal Session Finder for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides functions for finding and querying terminal sessions.
 */

import { createLogger } from '../utils/logger.ts';
import {
  TerminalFingerprint,
  TerminalSession
} from './terminal-session-types.ts';
import { terminalSessions } from '../../db/schema-extensions.ts';
import { eq, and, or, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// Create logger for terminal operations
const logger = createLogger('TerminalSessionFinder');

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