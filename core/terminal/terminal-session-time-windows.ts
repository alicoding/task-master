/**
 * Terminal Session Time Windows Integration for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides integration with the TimeWindowManager for terminal sessions.
 */

import { createLogger } from '../utils/logger.ts';
import { TimeWindowManager } from './time-window-manager.ts';

// Create logger for terminal time windows integration
const logger = createLogger('TerminalSessionTimeWindows');

/**
 * Create a time window for a task activity
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param taskId Task ID
 * @param timestamp Activity timestamp
 * @returns Whether the time window was created successfully
 */
export async function createTaskActivityWindow(
  timeWindowManager: TimeWindowManager,
  sessionId: string,
  taskId: string,
  timestamp: Date = new Date()
): Promise<boolean> {
  try {
    // Try to find an existing time window for the current time
    const existingWindow = await timeWindowManager.findTimeWindowAtTime(
      sessionId,
      timestamp
    );
    
    if (!existingWindow) {
      // No existing window, create a new one for the task activity
      const window = await timeWindowManager.getOrCreateTimeWindowForTimestamp(
        sessionId,
        timestamp,
        {
          windowDuration: 60 * 60 * 1000, // 1 hour
          name: `Task Window (${taskId})`,
          type: 'work'
        }
      );
      
      logger.debug(`Created time window for task activity: ${taskId} (Window ID: ${window.id})`);
      return true;
    }
    
    logger.debug(`Using existing time window for task activity: ${existingWindow.id}`);
    return true;
  } catch (error) {
    logger.error('Error creating task activity time window:', error);
    return false;
  }
}

/**
 * Find time windows for a session
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param options Window query options
 * @returns List of time windows
 */
export async function findSessionTimeWindows(
  timeWindowManager: TimeWindowManager,
  sessionId: string,
  options: {
    type?: string;
    status?: string;
    containsTime?: Date;
    minDuration?: number;
    maxDuration?: number;
    taskId?: string;
    limit?: number;
  } = {}
): Promise<any[]> {
  try {
    // Create criteria for finding windows
    const criteria: any = {
      sessionId,
      ...options
    };
    
    // Find time windows
    return await timeWindowManager.findTimeWindows(criteria);
  } catch (error) {
    logger.error('Error finding session time windows:', error);
    return [];
  }
}

/**
 * Create a time window for a session
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param startTime Start time
 * @param endTime End time
 * @param options Window options
 * @returns Created time window or null if creation failed
 */
export async function createSessionTimeWindow(
  timeWindowManager: TimeWindowManager,
  sessionId: string,
  startTime: Date,
  endTime: Date,
  options: {
    name?: string;
    type?: string;
    status?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<any | null> {
  try {
    // Create time window
    return await timeWindowManager.createTimeWindow(
      sessionId,
      startTime,
      endTime,
      options
    );
  } catch (error) {
    logger.error('Error creating session time window:', error);
    return null;
  }
}

/**
 * Auto-detect time windows for a session
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @returns List of detected time windows
 */
export async function autoDetectSessionTimeWindows(
  timeWindowManager: TimeWindowManager,
  sessionId: string
): Promise<any[]> {
  try {
    // Auto-detect time windows
    return await timeWindowManager.autoDetectTimeWindows(sessionId);
  } catch (error) {
    logger.error('Error auto-detecting session time windows:', error);
    return [];
  }
}

/**
 * Get time window statistics for a session
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param options Statistics options
 * @returns Time window statistics
 */
export async function getSessionTimeWindowStats(
  timeWindowManager: TimeWindowManager,
  sessionId: string,
  options: {
    type?: string;
  } = {}
): Promise<any> {
  try {
    const criteria: any = {
      sessionId,
      ...options
    };
    
    // Calculate statistics
    return await timeWindowManager.calculateTimeWindowStats(criteria);
  } catch (error) {
    logger.error('Error calculating session time window statistics:', error);
    return {
      totalWindows: 0,
      totalDuration: 0,
      averageDuration: 0,
      totalTasks: 0,
      totalFiles: 0,
      typeDistribution: {},
      durationDistribution: {
        short: 0,
        medium: 0,
        long: 0,
        veryLong: 0
      }
    };
  }
}

/**
 * Create a recovery time window
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param recoveryCount Recovery attempt number
 * @param timestamp Recovery timestamp
 * @returns Created time window or null if creation failed
 */
export async function createRecoveryTimeWindow(
  timeWindowManager: TimeWindowManager,
  sessionId: string,
  recoveryCount: number,
  timestamp: Date = new Date()
): Promise<any | null> {
  try {
    // Find or create a time window for this recovery operation
    const timeWindow = await timeWindowManager.getOrCreateTimeWindowForTimestamp(
      sessionId,
      timestamp,
      {
        windowDuration: 60 * 60 * 1000, // 1 hour
        name: `Recovery Window (attempt ${recoveryCount})`,
        type: 'recovery'
      }
    );
    
    logger.debug(`Created recovery time window: ${timeWindow.id}`);
    return timeWindow;
  } catch (error) {
    logger.error('Error creating recovery time window:', error);
    return null;
  }
}