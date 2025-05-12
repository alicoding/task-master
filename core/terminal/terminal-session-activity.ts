/**
 * Terminal Session Activity Tracking for Task Master CLI
 * Extracted from terminal-session-manager.ts as part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides functionality for tracking task usage, file changes,
 * and other activity within terminal sessions.
 */

import { createLogger } from '../utils/logger.ts';
import { 
  TerminalSessionState, 
  SessionActivityType,
  SessionOperationResult
} from './terminal-session-types.ts';
import { recordTaskUsage, recordFileChange, getRecentTasks } from './terminal-session-index.ts';
import { createTaskActivityWindow } from './terminal-session-time-windows.ts';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { TimeWindowManager } from './time-window-manager.ts';

// Create logger for terminal activity tracking
const logger = createLogger('TerminalSessionActivity');

/**
 * Record task usage in a session
 * @param db Database connection
 * @param sessionId Session ID
 * @param taskId Task ID to record
 * @param maxHistory Maximum number of tasks to maintain in history
 * @returns Operation result
 */
export async function trackTaskUsageForSession(
  db: BetterSQLite3Database,
  sessionId: string,
  taskId: string,
  maxHistory: number = 20
): Promise<SessionOperationResult> {
  return recordTaskUsage(db, sessionId, taskId, maxHistory);
}

/**
 * Record file change in a session
 * @param db Database connection
 * @param sessionId Session ID
 * @param fileId File ID to record
 * @returns Operation result
 */
export async function trackFileChangeForSession(
  db: BetterSQLite3Database,
  sessionId: string,
  fileId: number
): Promise<SessionOperationResult> {
  return recordFileChange(db, sessionId, fileId);
}

/**
 * Get recent tasks for a session
 * @param db Database connection
 * @param sessionId Session ID
 * @param limit Maximum number of tasks to return
 * @returns List of recent task IDs
 */
export async function getRecentTasksForSession(
  db: BetterSQLite3Database,
  sessionId: string,
  limit: number = 10
): Promise<string[]> {
  return getRecentTasks(db, sessionId, limit);
}

/**
 * Update session activity with a new task
 * @param db Database connection
 * @param session Current terminal session
 * @param taskId Task ID
 * @param trackTaskUsage Whether to track task usage
 * @param timeWindowManager Time window manager instance
 * @returns Updated session state
 */
export async function updateSessionWithTask(
  db: BetterSQLite3Database,
  session: TerminalSessionState,
  taskId: string,
  trackTaskUsage: boolean,
  timeWindowManager: TimeWindowManager | null
): Promise<Partial<TerminalSessionState>> {
  const updates: Partial<TerminalSessionState> = {
    currentTaskId: taskId,
    lastActive: new Date()
  };
  
  if (trackTaskUsage) {
    try {
      // Record task usage
      await trackTaskUsageForSession(db, session.id, taskId);
      
      // Create a time window for this task activity
      if (timeWindowManager) {
        const now = new Date();
        try {
          await createTaskActivityWindow(
            timeWindowManager,
            session.id,
            taskId,
            now
          );
          logger.debug(`Created time window for task ${taskId} in session ${session.id}`);
        } catch (windowError) {
          logger.warn(`Error creating task time window: ${windowError}`);
          // Continue with session update even if window creation fails
        }
      }
      
      // Update recent tasks
      const recentTasks = await getRecentTasksForSession(db, session.id);
      updates.recentTaskIds = recentTasks;
    } catch (error) {
      logger.error('Error tracking task usage:', error);
    }
  }
  
  return updates;
}

/**
 * Track file activity for a session
 * @param db Database connection
 * @param sessionId Session ID
 * @param fileId File ID
 * @param trackFileChanges Whether to track file changes
 * @returns Operation result or null if tracking is disabled
 */
export async function trackFileActivityForSession(
  db: BetterSQLite3Database,
  sessionId: string,
  fileId: number,
  trackFileChanges: boolean
): Promise<SessionOperationResult | null> {
  if (!trackFileChanges) {
    return null;
  }
  
  try {
    return await trackFileChangeForSession(db, sessionId, fileId);
  } catch (error) {
    logger.error('Error tracking file activity:', error);
    return {
      success: false,
      sessionId,
      error: error instanceof Error ? error.message : String(error),
      message: 'Failed to track file activity'
    };
  }
}

/**
 * Create a generic activity record for a session
 * @param db Database connection
 * @param session Terminal session
 * @param activityType Type of activity
 * @param metadata Activity metadata
 * @param timeWindowManager Time window manager instance
 * @returns Operation result
 */
export async function createSessionActivity(
  db: BetterSQLite3Database,
  session: TerminalSessionState,
  activityType: SessionActivityType,
  metadata: Record<string, any>,
  timeWindowManager: TimeWindowManager | null
): Promise<SessionOperationResult> {
  try {
    const now = new Date();
    let activityRecorded = false;
    
    // Handle different activity types
    switch (activityType) {
      case SessionActivityType.TASK:
        if (metadata.taskId) {
          await trackTaskUsageForSession(db, session.id, metadata.taskId);
          activityRecorded = true;
        }
        break;
        
      case SessionActivityType.FILE:
        if (metadata.fileId) {
          await trackFileChangeForSession(db, session.id, metadata.fileId);
          activityRecorded = true;
        }
        break;
        
      case SessionActivityType.COMMAND:
        // Future: record command history
        activityRecorded = true;
        break;
        
      case SessionActivityType.WINDOW:
        // Future: record window size changes
        activityRecorded = true;
        break;
    }
    
    // Create a time window for this activity if needed
    if (timeWindowManager && activityRecorded) {
      try {
        const windowName = `${activityType}-activity-${now.getTime()}`;
        await timeWindowManager.createTimeWindow({
          sessionId: session.id,
          startTime: now,
          endTime: new Date(now.getTime() + 60000), // 1 minute duration by default
          name: windowName,
          type: activityType,
          status: 'active',
          metadata: JSON.stringify(metadata)
        });
      } catch (windowError) {
        logger.warn(`Error creating activity time window: ${windowError}`);
        // Continue with activity record even if window creation fails
      }
    }
    
    return {
      success: activityRecorded,
      sessionId: session.id,
      message: activityRecorded ? 'Activity recorded successfully' : 'No activity recorded',
      data: { activityType, ...metadata }
    };
  } catch (error) {
    logger.error('Error creating session activity:', error);
    
    return {
      success: false,
      sessionId: session.id,
      error: error instanceof Error ? error.message : String(error),
      message: 'Failed to create session activity'
    };
  }
}

/**
 * Summarize session activity metrics
 * @param db Database connection
 * @param sessionId Session ID
 * @returns Activity summary metrics
 */
export async function getSessionActivitySummary(
  db: BetterSQLite3Database,
  sessionId: string
): Promise<{
  taskCount: number;
  fileCount: number;
  lastActivity: Date | null;
  activeTime: number; // in milliseconds
  activityScore: number; // 0-100 activity score
}> {
  try {
    // Query number of tasks used in this session
    const taskCountResult = await db.execute(
      `SELECT COUNT(*) as count FROM session_tasks WHERE session_id = ?`,
      [sessionId]
    );
    const taskCount = taskCountResult.rows[0]?.count || 0;
    
    // Query number of files modified in this session
    const fileCountResult = await db.execute(
      `SELECT COUNT(*) as count FROM file_session_mapping WHERE session_id = ?`,
      [sessionId]
    );
    const fileCount = fileCountResult.rows[0]?.count || 0;
    
    // Get session start and last activity
    const sessionResult = await db.execute(
      `SELECT start_time, last_active FROM terminal_sessions WHERE id = ?`,
      [sessionId]
    );
    
    let lastActivity: Date | null = null;
    let activeTime = 0;
    
    if (sessionResult.rows[0]) {
      const startTime = new Date(sessionResult.rows[0].start_time);
      lastActivity = new Date(sessionResult.rows[0].last_active);
      activeTime = lastActivity.getTime() - startTime.getTime();
    }
    
    // Calculate activity score - a simple metric based on task and file activity
    // Score = (tasks*5 + files*2) / (duration in hours + 1)
    const durationHours = activeTime / (1000 * 60 * 60) + 1; // Add 1 to avoid division by zero
    const activityScore = Math.min(100, Math.round((taskCount * 5 + fileCount * 2) / durationHours));
    
    return {
      taskCount,
      fileCount,
      lastActivity,
      activeTime,
      activityScore
    };
  } catch (error) {
    logger.error('Error getting session activity summary:', error);
    
    return {
      taskCount: 0,
      fileCount: 0,
      lastActivity: null,
      activeTime: 0,
      activityScore: 0
    };
  }
}