/**
 * Terminal Session Time Window Integration for Task Master CLI
 * Part of Task 17.8.9: Modularize terminal-session-manager.ts
 * 
 * This module provides standalone functions for time window management
 * integration with terminal sessions, extracted from TerminalSessionManager.
 */

import { createLogger } from '../utils/logger.ts';
import { TimeWindowManager } from './time-window-manager.ts';

// Import types
import type { 
  TimeWindowType, 
  TimeWindowStatus,
  TimeWindow,
  TimeWindowInfo,
  TimeWindowCriteria,
  TimeWindowStats
} from './time-window-manager.ts';

// Create logger for terminal time windows integration
const logger = createLogger('TerminalSessionTimeWindows');

/**
 * Find time windows for a session
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param options Window query options
 * @returns List of matching time windows
 */
export async function findTimeWindows(
  timeWindowManager: TimeWindowManager | null,
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
): Promise<TimeWindow[]> {
  if (!timeWindowManager) {
    logger.debug('Cannot find time windows: No time window manager');
    return [];
  }
  
  try {
    // Create criteria for finding windows
    const criteria: TimeWindowCriteria = {
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
export async function createTimeWindow(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string,
  startTime: Date,
  endTime: Date,
  options: {
    name?: string;
    type?: TimeWindowType;
    status?: TimeWindowStatus;
    metadata?: Record<string, any>;
  } = {}
): Promise<TimeWindow | null> {
  if (!timeWindowManager) {
    logger.debug('Cannot create time window: No time window manager');
    return null;
  }
  
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
export async function autoDetectTimeWindows(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string
): Promise<TimeWindow[]> {
  if (!timeWindowManager) {
    logger.debug('Cannot auto-detect time windows: No time window manager');
    return [];
  }
  
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
export async function getTimeWindowStats(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string,
  options: {
    type?: string;
  } = {}
): Promise<TimeWindowStats | null> {
  if (!timeWindowManager) {
    logger.debug('Cannot calculate time window statistics: No time window manager');
    return null;
  }
  
  try {
    const criteria: TimeWindowCriteria = {
      sessionId,
      ...options
    };
    
    // Calculate statistics
    return await timeWindowManager.calculateTimeWindowStats(criteria);
  } catch (error) {
    logger.error('Error calculating session time window statistics:', error);
    return null;
  }
}

/**
 * Create a time window for a task activity
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param taskId Task ID
 * @param timestamp Activity timestamp
 * @returns Whether the time window was created successfully
 */
export async function createTaskActivityWindow(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string,
  taskId: string,
  timestamp: Date = new Date()
): Promise<boolean> {
  if (!timeWindowManager) {
    logger.debug('Cannot create task activity window: No time window manager');
    return false;
  }
  
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
 * Create a recovery time window
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param recoveryCount Recovery attempt number
 * @param timestamp Recovery timestamp
 * @returns Created time window or null if creation failed
 */
export async function createRecoveryWindow(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string,
  recoveryCount: number,
  timestamp: Date = new Date()
): Promise<TimeWindow | null> {
  if (!timeWindowManager) {
    logger.debug('Cannot create recovery window: No time window manager');
    return null;
  }
  
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

/**
 * Split a time window at a specific time
 * @param timeWindowManager Time window manager
 * @param windowId ID of the window to split
 * @param splitTime Time to split the window at
 * @param options Split options
 * @returns Array with the two resulting windows or null if splitting failed
 */
export async function splitTimeWindow(
  timeWindowManager: TimeWindowManager | null,
  windowId: string,
  splitTime: Date,
  options: {
    createGap?: boolean;
    gapDuration?: number;
    firstWindowName?: string;
    secondWindowName?: string;
    firstWindowType?: TimeWindowType;
    secondWindowType?: TimeWindowType;
  } = {}
): Promise<[TimeWindow, TimeWindow] | null> {
  if (!timeWindowManager) {
    logger.debug('Cannot split time window: No time window manager');
    return null;
  }
  
  try {
    return await timeWindowManager.splitTimeWindow(
      windowId,
      splitTime,
      options
    );
  } catch (error) {
    logger.error('Error splitting time window:', error);
    return null;
  }
}

/**
 * Merge multiple time windows into a single window
 * @param timeWindowManager Time window manager
 * @param windowIds IDs of the windows to merge
 * @param options Merge options
 * @returns Merged window or null if merging failed
 */
export async function mergeTimeWindows(
  timeWindowManager: TimeWindowManager | null,
  windowIds: string[],
  options: {
    name?: string;
    type?: TimeWindowType;
    fillGaps?: boolean;
    preserveBoundaries?: boolean;
  } = {}
): Promise<TimeWindow | null> {
  if (!timeWindowManager) {
    logger.debug('Cannot merge time windows: No time window manager');
    return null;
  }
  
  try {
    return await timeWindowManager.mergeTimeWindows(
      windowIds,
      options
    );
  } catch (error) {
    logger.error('Error merging time windows:', error);
    return null;
  }
}

/**
 * Get detailed information about a time window
 * @param timeWindowManager Time window manager
 * @param windowId ID of the window to get information for
 * @returns Detailed window information or null if not found
 */
export async function getTimeWindowInfo(
  timeWindowManager: TimeWindowManager | null,
  windowId: string
): Promise<TimeWindowInfo | null> {
  if (!timeWindowManager) {
    logger.debug('Cannot get time window info: No time window manager');
    return null;
  }
  
  try {
    return await timeWindowManager.getTimeWindowInfo(windowId);
  } catch (error) {
    logger.error('Error getting time window info:', error);
    return null;
  }
}

/**
 * Find a time window that contains the given timestamp
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param timestamp Timestamp to find a window for
 * @returns Time window containing the timestamp, or null if not found
 */
export async function findTimeWindowAtTime(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string,
  timestamp: Date
): Promise<TimeWindow | null> {
  if (!timeWindowManager) {
    logger.debug('Cannot find time window at time: No time window manager');
    return null;
  }
  
  try {
    return await timeWindowManager.findTimeWindowAtTime(
      sessionId,
      timestamp
    );
  } catch (error) {
    logger.error('Error finding time window at time:', error);
    return null;
  }
}

/**
 * Get or create a time window for a specific timestamp
 * @param timeWindowManager Time window manager
 * @param sessionId Session ID
 * @param timestamp Timestamp to find or create a window for
 * @param options Options for window creation if needed
 * @returns Time window containing the timestamp or null if creation failed
 */
export async function getOrCreateTimeWindowForTimestamp(
  timeWindowManager: TimeWindowManager | null,
  sessionId: string,
  timestamp: Date,
  options: {
    windowDuration?: number;
    name?: string;
    type?: TimeWindowType;
  } = {}
): Promise<TimeWindow | null> {
  if (!timeWindowManager) {
    logger.debug('Cannot get/create time window for timestamp: No time window manager');
    return null;
  }
  
  try {
    return await timeWindowManager.getOrCreateTimeWindowForTimestamp(
      sessionId,
      timestamp,
      options
    );
  } catch (error) {
    logger.error('Error getting/creating time window for timestamp:', error);
    return null;
  }
}