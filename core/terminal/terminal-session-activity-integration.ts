/**
 * Terminal Session Activity Integration for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides standalone functions for terminal session activity tracking,
 * including task usage, file activity, and custom activity tracking.
 */

import { createLogger } from '../utils/logger.ts';
import { TerminalSessionState, SessionActivityType } from './terminal-session-types.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { TimeWindowManager } from './time-window-manager.ts';
import {
  updateSessionWithTask,
  trackTaskUsageForSession,
  trackFileActivityForSession,
  createSessionActivity,
  getSessionActivitySummary
} from './terminal-session-activity.ts';

// Create logger for terminal activity integration
const logger = createLogger('TerminalSessionActivity');

/**
 * Track task usage in a terminal session
 * @param db Database connection
 * @param session Terminal session
 * @param taskId Task ID to track
 * @param trackTaskUsage Whether to track task usage
 * @param timeWindowManager Time window manager
 * @returns Updates to apply to the session
 */
export async function trackTaskUsageInSession(
  db: BetterSQLite3Database,
  session: TerminalSessionState,
  taskId: string,
  trackTaskUsage: boolean,
  timeWindowManager: TimeWindowManager | null
): Promise<Partial<TerminalSessionState>> {
  if (!trackTaskUsage) {
    return {};
  }
  
  try {
    return await updateSessionWithTask(
      db,
      session,
      taskId,
      trackTaskUsage,
      timeWindowManager
    );
  } catch (error) {
    logger.error('Error tracking task usage:', error);
    return {};
  }
}

/**
 * Track file activity in a terminal session
 * @param db Database connection
 * @param sessionId Session ID
 * @param fileId File ID to track
 * @param trackFileChanges Whether to track file changes
 * @returns Whether tracking was successful
 */
export async function trackFileActivityInSession(
  db: BetterSQLite3Database,
  sessionId: string,
  fileId: number,
  trackFileChanges: boolean
): Promise<boolean> {
  if (!trackFileChanges) {
    return false;
  }
  
  try {
    await trackFileActivityForSession(
      db,
      sessionId,
      fileId,
      trackFileChanges
    );
    return true;
  } catch (error) {
    logger.error('Error tracking file activity:', error);
    return false;
  }
}

/**
 * Record a custom activity in a terminal session
 * @param db Database connection
 * @param session Terminal session
 * @param activityType Type of activity
 * @param metadata Activity metadata
 * @param timeWindowManager Time window manager
 * @returns Whether recording was successful
 */
export async function recordSessionActivity(
  db: BetterSQLite3Database,
  session: TerminalSessionState,
  activityType: SessionActivityType,
  metadata: Record<string, any>,
  timeWindowManager: TimeWindowManager | null
): Promise<boolean> {
  try {
    await createSessionActivity(
      db,
      session,
      activityType,
      metadata,
      timeWindowManager
    );
    return true;
  } catch (error) {
    logger.error('Error recording session activity:', error);
    return false;
  }
}

/**
 * Get activity metrics for a terminal session
 * @param db Database connection
 * @param sessionId Session ID
 * @returns Activity metrics
 */
export async function getSessionActivityMetrics(
  db: BetterSQLite3Database,
  sessionId: string
): Promise<{
  taskCount: number;
  fileCount: number;
  lastActivity: Date | null;
  activeTime: number;
  activityScore: number;
} | null> {
  try {
    return await getSessionActivitySummary(db, sessionId);
  } catch (error) {
    logger.error('Error getting activity metrics:', error);
    return null;
  }
}