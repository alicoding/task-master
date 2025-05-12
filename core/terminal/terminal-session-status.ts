/**
 * Terminal Session Status for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides functionality for checking terminal session status.
 */

import { createLogger } from '../utils/logger.ts';
import { TerminalIntegrationStatus } from './terminal-session-types.ts';
import { terminalSessions, sessionTasks, fileSessionMapping } from '../../db/schema-extensions.ts';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// Create logger for terminal status
const logger = createLogger('TerminalSessionStatus');

/**
 * Get terminal integration status
 * @param db Database connection
 * @param session Current session or null
 * @param trackTaskUsage Whether to track task usage
 * @param trackFileChanges Whether to track file changes
 * @param persistSessions Whether to persist sessions
 * @param hasRecoveryManager Whether recovery manager is enabled
 * @returns Terminal integration status
 */
export async function getIntegrationStatus(
  db: BetterSQLite3Database,
  session: any | null,
  trackTaskUsage: boolean,
  trackFileChanges: boolean,
  persistSessions: boolean,
  hasRecoveryManager: boolean
): Promise<TerminalIntegrationStatus> {
  try {
    if (!session) {
      return {
        enabled: false,
        sessionId: '',
        tty: '',
        status: 'disconnected',
        taskCount: 0,
        fileCount: 0,
        sessionDuration: 0,
        shellIntegrated: false
      };
    }
    
    // Check if shell is integrated
    const shellIntegrated = 
      process.env.TM_SESSION_ID === session.id &&
      process.env.TM_TTY === session.fingerprint.tty;
    
    // Get task count
    let taskCount = 0;
    if (persistSessions && trackTaskUsage) {
      const tasks = await db.query.sessionTasks.findMany({
        where: eq(sessionTasks.sessionId, session.id)
      });
      
      taskCount = tasks.length;
    } else {
      taskCount = session.recentTaskIds.length;
    }
    
    // Get file count
    let fileCount = 0;
    if (persistSessions && trackFileChanges) {
      const files = await db.query.fileSessionMapping.findMany({
        where: eq(fileSessionMapping.sessionId, session.id)
      });
      
      fileCount = files.length;
    }
    
    // Calculate session duration
    const sessionDuration = 
      new Date().getTime() - session.startTime.getTime();
    
    // Get recovery information if available
    let recovery = undefined;

    if (hasRecoveryManager) {
      const sessionRecord = await db.select({
        recoveryCount: terminalSessions.recoveryCount,
        lastRecovery: terminalSessions.lastRecovery,
        recoverySource: terminalSessions.recoverySource
      }).from(terminalSessions)
        .where(eq(terminalSessions.id, session.id))
        .limit(1);

      if (sessionRecord.length > 0) {
        recovery = {
          enabled: true,
          recoveryCount: sessionRecord[0].recoveryCount || 0,
          lastRecovery: sessionRecord[0].lastRecovery,
          recoverySource: sessionRecord[0].recoverySource
        };
      }
    }

    return {
      enabled: true,
      sessionId: session.id,
      tty: session.fingerprint.tty,
      status: session.status,
      currentTaskId: session.currentTaskId,
      taskCount,
      fileCount,
      sessionDuration,
      shellIntegrated,
      recovery
    };
  } catch (error) {
    logger.error('Error getting integration status:', error);

    return {
      enabled: false,
      sessionId: '',
      tty: '',
      status: 'disconnected',
      taskCount: 0,
      fileCount: 0,
      sessionDuration: 0,
      shellIntegrated: false
    };
  }
}