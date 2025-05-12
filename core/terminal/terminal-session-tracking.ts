/**
 * Terminal Session Tracking for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides functions for tracking task usage and file changes
 * within terminal sessions.
 */

import { createLogger } from '../utils/logger.ts';
import {
  SessionOperationResult
} from './terminal-session-types.ts';
import {
  sessionTasks,
  fileSessionMapping
} from '../../db/schema-extensions.ts';
import { eq, and, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// Create logger for terminal tracking
const logger = createLogger('TerminalSessionTracking');

/**
 * Record task usage in a session
 * @param db Database connection
 * @param sessionId Session ID
 * @param taskId Task ID to record
 * @param maxHistory Maximum number of tasks to keep in history
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