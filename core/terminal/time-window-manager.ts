/**
 * Time Window Manager for Task Master CLI
 * Implements Task 17.8: Session Recovery - Subtask 17.8.2: Time Window Management
 * 
 * This module provides functionality for grouping terminal activities into logical 
 * time windows, managing session boundaries, and supporting time-based queries.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger.ts';
import {
  terminalSessions,
  timeWindows,
  sessionTasks,
  fileSessionMapping,
  TimeWindow,
  NewTimeWindow
} from '../../db/schema-extensions.ts';
import { eq, and, or, between, desc, gt, lt } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// Create logger for time window management
const logger = createLogger('TimeWindowManager');

/**
 * Configuration options for time window management
 */
export interface TimeWindowConfig {
  /** Minimum duration for a time window in milliseconds */
  minWindowDuration: number;
  
  /** Maximum duration for a time window in milliseconds */
  maxWindowDuration: number;
  
  /** Gap duration that creates a new window (in milliseconds) */
  activityGapThreshold: number;
  
  /** Auto-merge adjacent windows if their gap is shorter than this (in milliseconds) */
  autoMergeThreshold: number;
  
  /** Whether to create new windows automatically when needed */
  autoCreateWindows: boolean;
  
  /** Whether to auto-split long windows */
  autoSplitLongWindows: boolean;
  
  /** Whether to track window statistics */
  trackWindowStats: boolean;
}

/**
 * Default configuration for time window management
 */
export const DEFAULT_TIME_WINDOW_CONFIG: TimeWindowConfig = {
  minWindowDuration: 5 * 60 * 1000, // 5 minutes
  maxWindowDuration: 4 * 60 * 60 * 1000, // 4 hours
  activityGapThreshold: 30 * 60 * 1000, // 30 minutes
  autoMergeThreshold: 10 * 60 * 1000, // 10 minutes
  autoCreateWindows: true,
  autoSplitLongWindows: true,
  trackWindowStats: true
};

/**
 * Time window type
 */
export type TimeWindowType = 'work' | 'break' | 'meeting' | 'auto' | 'manual' | 'recovery';

/**
 * Time window status
 */
export type TimeWindowStatus = 'active' | 'closed' | 'merged';

/**
 * Detailed time window information
 */
export interface TimeWindowInfo extends TimeWindow {
  /** Duration of the time window in milliseconds */
  duration: number;
  /** Number of tasks associated with this time window */
  taskCount: number;
  /** Number of files modified in this time window */
  fileCount: number;
  /** Task IDs associated with this time window */
  taskIds: string[];
}

/**
 * Criteria for finding time windows
 */
export interface TimeWindowCriteria {
  /** Filter by session ID */
  sessionId?: string;
  /** Filter by window type */
  type?: TimeWindowType;
  /** Filter by window status */
  status?: TimeWindowStatus;
  /** Filter by start time range */
  startTimeRange?: [Date, Date];
  /** Filter by end time range */
  endTimeRange?: [Date, Date];
  /** Filter by window containing this timestamp */
  containsTime?: Date;
  /** Filter by minimum duration (in milliseconds) */
  minDuration?: number;
  /** Filter by maximum duration (in milliseconds) */
  maxDuration?: number;
  /** Filter by task ID (windows that contain this task) */
  taskId?: string;
  /** Limit the number of results */
  limit?: number;
}

/**
 * Time window splitting options
 */
export interface SplitOptions {
  /** Create a gap between the resulting windows */
  createGap?: boolean;
  /** Duration of the gap to create (in milliseconds) */
  gapDuration?: number;
  /** Name for the first resulting window */
  firstWindowName?: string;
  /** Name for the second resulting window */
  secondWindowName?: string;
  /** Type for the first resulting window */
  firstWindowType?: TimeWindowType;
  /** Type for the second resulting window */
  secondWindowType?: TimeWindowType;
}

/**
 * Time window merging options
 */
export interface MergeOptions {
  /** Name for the resulting merged window */
  name?: string;
  /** Type for the resulting merged window */
  type?: TimeWindowType;
  /** Fill gaps between windows */
  fillGaps?: boolean;
  /** Preserve window boundaries as metadata */
  preserveBoundaries?: boolean;
}

/**
 * Time window statistics
 */
export interface TimeWindowStats {
  /** Total number of time windows */
  totalWindows: number;
  /** Total duration of all time windows (in milliseconds) */
  totalDuration: number;
  /** Average window duration (in milliseconds) */
  averageDuration: number;
  /** Total number of tasks across all windows */
  totalTasks: number;
  /** Total number of files modified across all windows */
  totalFiles: number;
  /** Distribution of window types */
  typeDistribution: Record<string, number>;
  /** Distribution of window durations */
  durationDistribution: {
    short: number; // < 30 minutes
    medium: number; // 30 minutes - 2 hours
    long: number; // 2 - 4 hours
    veryLong: number; // > 4 hours
  };
}

/**
 * Time Window Manager
 * 
 * Manages time windows for terminal sessions, providing functionality for
 * creating, merging, splitting, and querying time windows.
 */
export class TimeWindowManager extends EventEmitter {
  private _db: BetterSQLite3Database;
  private _config: TimeWindowConfig;
  
  /**
   * Create a new time window manager
   * @param db Database connection
   * @param config Configuration options
   */
  constructor(db: BetterSQLite3Database, config: Partial<TimeWindowConfig> = {}) {
    super();
    this._db = db;
    this._config = { ...DEFAULT_TIME_WINDOW_CONFIG, ...config };
    
    logger.debug('Time Window Manager initialized with config:', {
      minWindowDuration: this._config.minWindowDuration,
      maxWindowDuration: this._config.maxWindowDuration,
      activityGapThreshold: this._config.activityGapThreshold,
      autoCreateWindows: this._config.autoCreateWindows
    });
  }
  
  /**
   * Create a new time window
   * @param sessionId ID of the session the window belongs to
   * @param startTime Start time of the window
   * @param endTime End time of the window
   * @param options Additional window options
   * @returns Created time window
   */
  async createTimeWindow(
    sessionId: string,
    startTime: Date,
    endTime: Date,
    options: {
      name?: string;
      type?: TimeWindowType;
      status?: TimeWindowStatus;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<TimeWindow> {
    try {
      // Validate input
      if (endTime.getTime() < startTime.getTime()) {
        throw new Error('End time must be after start time');
      }
      
      // Get duration
      const duration = endTime.getTime() - startTime.getTime();
      
      // Check duration constraints
      if (duration < this._config.minWindowDuration) {
        logger.warn(`Creating window shorter than minimum duration: ${duration}ms`);
      }
      
      if (duration > this._config.maxWindowDuration && this._config.autoSplitLongWindows) {
        logger.info(`Window exceeds maximum duration (${duration}ms), splitting automatically`);
        
        // Calculate midpoint for splitting
        const midTime = new Date(startTime.getTime() + duration / 2);
        
        // Create two windows instead
        const firstWindow = await this.createTimeWindow(
          sessionId, 
          startTime, 
          midTime,
          { ...options, name: options.name ? `${options.name} (part 1)` : undefined }
        );
        
        const secondWindow = await this.createTimeWindow(
          sessionId, 
          midTime, 
          endTime,
          { ...options, name: options.name ? `${options.name} (part 2)` : undefined }
        );
        
        // Emit events
        this.emit('window:split:auto', {
          reason: 'max_duration_exceeded',
          originalDuration: duration,
          resultingWindows: [firstWindow.id, secondWindow.id]
        });
        
        return firstWindow;
      }
      
      // Check for overlapping windows
      const overlappingWindows = await this.findOverlappingWindows(
        sessionId, startTime, endTime
      );
      
      if (overlappingWindows.length > 0) {
        logger.warn(`Found ${overlappingWindows.length} overlapping windows for new window ${startTime.toISOString()} - ${endTime.toISOString()}`);
        
        // Emit event
        this.emit('window:overlap', {
          sessionId,
          startTime,
          endTime,
          overlappingWindows: overlappingWindows.map(w => w.id)
        });
      }
      
      // Generate ID
      const windowId = uuidv4();
      
      // Prepare metadata
      const metadata = {
        ...(options.metadata || {}),
        createdAt: new Date(),
        duration
      };
      
      // Create new window
      const newWindow: NewTimeWindow = {
        id: windowId,
        sessionId,
        startTime,
        endTime,
        name: options.name,
        type: options.type || 'auto',
        status: options.status || 'active',
        metadata: JSON.stringify(metadata)
      };
      
      // Insert into database
      await this._db.insert(timeWindows).values(newWindow);
      
      // Get created window
      const createdWindow = await this._db.query.timeWindows.findFirst({
        where: eq(timeWindows.id, windowId)
      });
      
      if (!createdWindow) {
        throw new Error(`Failed to find created window with ID: ${windowId}`);
      }
      
      // Emit event
      this.emit('window:created', {
        windowId,
        sessionId,
        startTime,
        endTime,
        duration
      });
      
      logger.debug(`Created time window: ${windowId} for session ${sessionId} (${startTime.toISOString()} - ${endTime.toISOString()})`);
      
      return createdWindow;
    } catch (error) {
      logger.error('Error creating time window:', error);
      throw error;
    }
  }
  
  /**
   * Find windows that overlap with the given time range
   * @param sessionId Session ID
   * @param startTime Start time
   * @param endTime End time
   * @returns List of overlapping windows
   */
  async findOverlappingWindows(
    sessionId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<TimeWindow[]> {
    try {
      // Find windows where:
      // 1. Start time is within the range, or
      // 2. End time is within the range, or
      // 3. Window contains the entire range
      const overlappingWindows = await this._db.select().from(timeWindows)
        .where(and(
          eq(timeWindows.sessionId, sessionId),
          or(
            // Start time falls within window
            between(startTime, timeWindows.startTime, timeWindows.endTime),
            // End time falls within window
            between(endTime, timeWindows.startTime, timeWindows.endTime),
            // Window completely contains the range
            and(
              lt(timeWindows.startTime, startTime),
              gt(timeWindows.endTime, endTime)
            ),
            // Range completely contains the window
            and(
              gt(startTime, timeWindows.startTime),
              lt(endTime, timeWindows.endTime)
            )
          )
        ));
      
      return overlappingWindows;
    } catch (error) {
      logger.error('Error finding overlapping windows:', error);
      return [];
    }
  }
  
  /**
   * Find a time window that contains the given timestamp
   * @param sessionId Session ID to search in
   * @param timestamp Timestamp to find a window for
   * @returns Time window containing the timestamp, or null if not found
   */
  async findTimeWindowAtTime(
    sessionId: string,
    timestamp: Date
  ): Promise<TimeWindow | null> {
    try {
      // Find windows where the timestamp falls between start and end times
      const windows = await this._db.select().from(timeWindows)
        .where(and(
          eq(timeWindows.sessionId, sessionId),
          lt(timeWindows.startTime, timestamp),
          gt(timeWindows.endTime, timestamp)
        ))
        .orderBy(desc(timeWindows.endTime))
        .limit(1);
      
      if (windows.length === 0) {
        return null;
      }
      
      return windows[0];
    } catch (error) {
      logger.error('Error finding time window at timestamp:', error);
      return null;
    }
  }
  
  /**
   * Find time windows that match the given criteria
   * @param criteria Criteria for finding windows
   * @returns List of matching time windows
   */
  async findTimeWindows(criteria: TimeWindowCriteria = {}): Promise<TimeWindow[]> {
    try {
      // Start building the query
      let query = this._db.select().from(timeWindows);
      
      // Build conditions
      const conditions = [];
      
      // Filter by session ID
      if (criteria.sessionId) {
        conditions.push(eq(timeWindows.sessionId, criteria.sessionId));
      }
      
      // Filter by window type
      if (criteria.type) {
        conditions.push(eq(timeWindows.type, criteria.type));
      }
      
      // Filter by window status
      if (criteria.status) {
        conditions.push(eq(timeWindows.status, criteria.status));
      }
      
      // Filter by start time range
      if (criteria.startTimeRange) {
        conditions.push(between(
          timeWindows.startTime, 
          criteria.startTimeRange[0], 
          criteria.startTimeRange[1]
        ));
      }
      
      // Filter by end time range
      if (criteria.endTimeRange) {
        conditions.push(between(
          timeWindows.endTime, 
          criteria.endTimeRange[0], 
          criteria.endTimeRange[1]
        ));
      }
      
      // Filter by window containing a specific timestamp
      if (criteria.containsTime) {
        conditions.push(and(
          lt(timeWindows.startTime, criteria.containsTime),
          gt(timeWindows.endTime, criteria.containsTime)
        ));
      }
      
      // Apply conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Order by start time (most recent first)
      query = query.orderBy(desc(timeWindows.startTime));
      
      // Apply limit if specified
      if (criteria.limit && criteria.limit > 0) {
        query = query.limit(criteria.limit);
      }
      
      // Execute query
      const windows = await query;
      
      // Apply post-query filters
      let filteredWindows = windows;
      
      // Filter by duration
      if (criteria.minDuration !== undefined || criteria.maxDuration !== undefined) {
        filteredWindows = filteredWindows.filter(window => {
          const duration = new Date(window.endTime).getTime() - new Date(window.startTime).getTime();
          
          if (criteria.minDuration !== undefined && duration < criteria.minDuration) {
            return false;
          }
          
          if (criteria.maxDuration !== undefined && duration > criteria.maxDuration) {
            return false;
          }
          
          return true;
        });
      }
      
      // Filter by task ID (requires additional query)
      if (criteria.taskId) {
        // We need to find session tasks that occurred within each window's time range
        const windowsWithTask = [];
        
        for (const window of filteredWindows) {
          const tasks = await this._db.select().from(sessionTasks)
            .where(and(
              eq(sessionTasks.sessionId, window.sessionId),
              eq(sessionTasks.taskId, criteria.taskId),
              between(
                sessionTasks.accessTime,
                window.startTime,
                window.endTime
              )
            ))
            .limit(1);
          
          if (tasks.length > 0) {
            windowsWithTask.push(window);
          }
        }
        
        filteredWindows = windowsWithTask;
      }
      
      return filteredWindows;
    } catch (error) {
      logger.error('Error finding time windows:', error);
      return [];
    }
  }
  
  /**
   * Get detailed information about a time window
   * @param windowId ID of the window to get information for
   * @returns Detailed window information or null if not found
   */
  async getTimeWindowInfo(windowId: string): Promise<TimeWindowInfo | null> {
    try {
      // Get window
      const window = await this._db.query.timeWindows.findFirst({
        where: eq(timeWindows.id, windowId)
      });
      
      if (!window) {
        return null;
      }
      
      // Calculate duration
      const startTime = new Date(window.startTime);
      const endTime = new Date(window.endTime);
      const duration = endTime.getTime() - startTime.getTime();
      
      // Get tasks for this window
      const tasks = await this._db.select().from(sessionTasks)
        .where(and(
          eq(sessionTasks.sessionId, window.sessionId),
          between(
            sessionTasks.accessTime,
            window.startTime,
            window.endTime
          )
        ));
      
      // Get files for this window
      const files = await this._db.select().from(fileSessionMapping)
        .where(and(
          eq(fileSessionMapping.sessionId, window.sessionId),
          between(
            fileSessionMapping.lastModified,
            window.startTime,
            window.endTime
          )
        ));
      
      // Collect task IDs
      const taskIds = tasks.map(task => task.taskId);
      
      // Create window info
      const windowInfo: TimeWindowInfo = {
        ...window,
        duration,
        taskCount: tasks.length,
        fileCount: files.length,
        taskIds
      };
      
      return windowInfo;
    } catch (error) {
      logger.error('Error getting time window info:', error);
      return null;
    }
  }
  
  /**
   * Split a time window at a specific point
   * @param windowId ID of the window to split
   * @param splitTime Time to split the window at
   * @param options Options for the split operation
   * @returns Array containing the two resulting windows
   */
  async splitTimeWindow(
    windowId: string,
    splitTime: Date,
    options: SplitOptions = {}
  ): Promise<[TimeWindow, TimeWindow]> {
    try {
      // Get the window to split
      const window = await this._db.query.timeWindows.findFirst({
        where: eq(timeWindows.id, windowId)
      });
      
      if (!window) {
        throw new Error(`Time window not found: ${windowId}`);
      }
      
      // Validate split time
      const startTime = new Date(window.startTime);
      const endTime = new Date(window.endTime);
      
      if (splitTime <= startTime || splitTime >= endTime) {
        throw new Error('Split time must be between window start and end times');
      }
      
      // Parse metadata
      let metadata: Record<string, any> = {};
      try {
        metadata = JSON.parse(window.metadata || '{}');
      } catch (e) {
        logger.warn('Failed to parse window metadata:', e);
      }
      
      // Add split information to metadata
      metadata.splitFrom = windowId;
      metadata.splitTime = splitTime;
      
      // If creating a gap, adjust times
      let firstEndTime = splitTime;
      let secondStartTime = splitTime;
      
      if (options.createGap && options.gapDuration) {
        const halfGap = options.gapDuration / 2;
        firstEndTime = new Date(splitTime.getTime() - halfGap);
        secondStartTime = new Date(splitTime.getTime() + halfGap);
        
        // Ensure times are within the original window
        if (firstEndTime <= startTime) {
          firstEndTime = new Date(startTime.getTime() + 1000); // 1 second after start
        }
        
        if (secondStartTime >= endTime) {
          secondStartTime = new Date(endTime.getTime() - 1000); // 1 second before end
        }
      }
      
      // Create first window
      const firstWindow = await this.createTimeWindow(
        window.sessionId,
        startTime,
        firstEndTime,
        {
          name: options.firstWindowName || `${window.name || 'Window'} (first part)`,
          type: options.firstWindowType || window.type as TimeWindowType,
          metadata: { ...metadata, isFirstPart: true }
        }
      );
      
      // Create second window
      const secondWindow = await this.createTimeWindow(
        window.sessionId,
        secondStartTime,
        endTime,
        {
          name: options.secondWindowName || `${window.name || 'Window'} (second part)`,
          type: options.secondWindowType || window.type as TimeWindowType,
          metadata: { ...metadata, isSecondPart: true }
        }
      );
      
      // Mark original window as merged/split
      await this._db.update(timeWindows)
        .set({ 
          status: 'merged',
          metadata: JSON.stringify({
            ...metadata,
            splitInto: [firstWindow.id, secondWindow.id],
            splitAt: splitTime
          })
        })
        .where(eq(timeWindows.id, windowId));
      
      // Emit event
      this.emit('window:split', {
        originalWindowId: windowId,
        splitTime,
        firstWindowId: firstWindow.id,
        secondWindowId: secondWindow.id
      });
      
      logger.info(`Split time window ${windowId} at ${splitTime.toISOString()} into ${firstWindow.id} and ${secondWindow.id}`);
      
      return [firstWindow, secondWindow];
    } catch (error) {
      logger.error('Error splitting time window:', error);
      throw error;
    }
  }
  
  /**
   * Merge multiple time windows into a single window
   * @param windowIds IDs of the windows to merge
   * @param options Options for the merge operation
   * @returns Merged window
   */
  async mergeTimeWindows(
    windowIds: string[],
    options: MergeOptions = {}
  ): Promise<TimeWindow> {
    try {
      if (windowIds.length < 2) {
        throw new Error('At least two windows are required for merging');
      }
      
      // Get all windows to merge
      const windowsToMerge = await Promise.all(
        windowIds.map(id => 
          this._db.query.timeWindows.findFirst({
            where: eq(timeWindows.id, id)
          })
        )
      );
      
      // Filter out null values and check session consistency
      const validWindows = windowsToMerge.filter(w => w !== null) as TimeWindow[];
      
      if (validWindows.length < 2) {
        throw new Error('Not enough valid windows to merge');
      }
      
      // Ensure all windows belong to the same session
      const sessionId = validWindows[0].sessionId;
      
      if (!validWindows.every(w => w.sessionId === sessionId)) {
        throw new Error('All windows to merge must belong to the same session');
      }
      
      // Find earliest start time and latest end time
      let earliestStartTime = new Date(validWindows[0].startTime);
      let latestEndTime = new Date(validWindows[0].endTime);
      
      for (const window of validWindows) {
        const startTime = new Date(window.startTime);
        const endTime = new Date(window.endTime);
        
        if (startTime < earliestStartTime) {
          earliestStartTime = startTime;
        }
        
        if (endTime > latestEndTime) {
          latestEndTime = endTime;
        }
      }
      
      // Check duration constraints
      const totalDuration = latestEndTime.getTime() - earliestStartTime.getTime();
      
      if (totalDuration > this._config.maxWindowDuration) {
        logger.warn(`Merged window would exceed maximum duration: ${totalDuration}ms > ${this._config.maxWindowDuration}ms`);
      }
      
      // Prepare merged metadata
      const mergedMetadata: Record<string, any> = {
        mergedFrom: windowIds,
        mergedAt: new Date(),
        originalWindows: validWindows.map(w => ({
          id: w.id,
          startTime: w.startTime,
          endTime: w.endTime,
          type: w.type,
          name: w.name
        }))
      };
      
      // If preserving boundaries, add them to metadata
      if (options.preserveBoundaries) {
        mergedMetadata.boundaries = validWindows
          .flatMap(w => [
            new Date(w.startTime).getTime(),
            new Date(w.endTime).getTime()
          ])
          .sort((a, b) => a - b)
          .filter((time, index, array) => 
            // Remove duplicates
            index === 0 || time !== array[index - 1]
          )
          .map(time => new Date(time));
      }
      
      // Create merged window
      const mergedWindow = await this.createTimeWindow(
        sessionId,
        earliestStartTime,
        latestEndTime,
        {
          name: options.name || `Merged Window (${validWindows.length} windows)`,
          type: options.type || 'manual',
          metadata: mergedMetadata
        }
      );
      
      // Mark original windows as merged
      await Promise.all(
        windowIds.map(id => 
          this._db.update(timeWindows)
            .set({
              status: 'merged',
              metadata: JSON.stringify({
                mergedInto: mergedWindow.id,
                mergedAt: new Date()
              })
            })
            .where(eq(timeWindows.id, id))
        )
      );
      
      // Emit event
      this.emit('window:merged', {
        originalWindowIds: windowIds,
        mergedWindowId: mergedWindow.id,
        startTime: earliestStartTime,
        endTime: latestEndTime,
        duration: totalDuration
      });
      
      logger.info(`Merged ${windowIds.length} time windows into ${mergedWindow.id}`);
      
      return mergedWindow;
    } catch (error) {
      logger.error('Error merging time windows:', error);
      throw error;
    }
  }
  
  /**
   * Get or create a time window for a specific timestamp
   * @param sessionId Session ID
   * @param timestamp Timestamp to find or create a window for
   * @param options Options for window creation if needed
   * @returns Time window containing the timestamp
   */
  async getOrCreateTimeWindowForTimestamp(
    sessionId: string,
    timestamp: Date,
    options: {
      windowDuration?: number;
      name?: string;
      type?: TimeWindowType;
    } = {}
  ): Promise<TimeWindow> {
    try {
      // Try to find an existing window
      const existingWindow = await this.findTimeWindowAtTime(sessionId, timestamp);
      
      if (existingWindow) {
        return existingWindow;
      }
      
      // No existing window, create a new one if auto-creation is enabled
      if (!this._config.autoCreateWindows) {
        throw new Error('No time window found for timestamp and auto-creation is disabled');
      }
      
      // Determine window duration
      const windowDuration = options.windowDuration || this._config.minWindowDuration;
      
      // Determine window start and end times centered on the timestamp
      const halfDuration = windowDuration / 2;
      const startTime = new Date(timestamp.getTime() - halfDuration);
      const endTime = new Date(timestamp.getTime() + halfDuration);
      
      // Create new window
      const newWindow = await this.createTimeWindow(
        sessionId,
        startTime,
        endTime,
        {
          name: options.name || `Auto Window for ${timestamp.toISOString()}`,
          type: options.type || 'auto'
        }
      );
      
      logger.debug(`Created new time window for timestamp ${timestamp.toISOString()}: ${newWindow.id}`);
      
      return newWindow;
    } catch (error) {
      logger.error('Error getting/creating time window for timestamp:', error);
      throw error;
    }
  }
  
  /**
   * Auto-detect time windows for a session based on activity patterns
   * @param sessionId Session ID to detect windows for
   * @param options Detection options
   * @returns List of created time windows
   */
  async autoDetectTimeWindows(
    sessionId: string,
    options: {
      minActivityCount?: number;
      maxGapDuration?: number;
      mergeAdjacentWindows?: boolean;
    } = {}
  ): Promise<TimeWindow[]> {
    try {
      // Get session
      const session = await this._db.query.terminalSessions.findFirst({
        where: eq(terminalSessions.id, sessionId)
      });
      
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      
      // Get session activities (tasks and file changes)
      const tasks = await this._db.select({
        timestamp: sessionTasks.accessTime,
        type: () => 'task' as const,
        id: sessionTasks.taskId
      }).from(sessionTasks)
        .where(eq(sessionTasks.sessionId, sessionId));
      
      const files = await this._db.select({
        timestamp: fileSessionMapping.lastModified,
        type: () => 'file' as const,
        id: fileSessionMapping.fileId
      }).from(fileSessionMapping)
        .where(eq(fileSessionMapping.sessionId, sessionId));
      
      // Combine and sort activities by timestamp
      const activities = [...tasks, ...files]
        .sort((a, b) => {
          const aTime = new Date(a.timestamp).getTime();
          const bTime = new Date(b.timestamp).getTime();
          return aTime - bTime;
        });
      
      if (activities.length === 0) {
        logger.info(`No activities found for session ${sessionId}`);
        return [];
      }
      
      // Determine activity gaps
      const gaps: Array<{
        start: Date;
        end: Date;
        duration: number;
      }> = [];
      
      for (let i = 1; i < activities.length; i++) {
        const prevTime = new Date(activities[i - 1].timestamp);
        const currTime = new Date(activities[i].timestamp);
        const duration = currTime.getTime() - prevTime.getTime();
        
        if (duration > (options.maxGapDuration || this._config.activityGapThreshold)) {
          gaps.push({
            start: prevTime,
            end: currTime,
            duration
          });
        }
      }
      
      // Use gaps to determine window boundaries
      if (gaps.length === 0) {
        // No significant gaps, create a single window
        const startTime = new Date(activities[0].timestamp);
        const endTime = new Date(activities[activities.length - 1].timestamp);
        
        // Add buffer at start and end
        const bufferMs = 5 * 60 * 1000; // 5 minutes
        startTime.setTime(Math.max(startTime.getTime() - bufferMs, new Date(session.startTime).getTime()));
        endTime.setTime(Math.min(endTime.getTime() + bufferMs, new Date(session.lastActive).getTime()));
        
        const window = await this.createTimeWindow(
          sessionId,
          startTime,
          endTime,
          {
            name: 'Auto-detected Session Window',
            type: 'auto'
          }
        );
        
        return [window];
      }
      
      // Create windows between gaps
      const windows: TimeWindow[] = [];
      
      // First window (start to first gap)
      if (activities.length > 0) {
        const firstActivityTime = new Date(activities[0].timestamp);
        const window = await this.createTimeWindow(
          sessionId,
          new Date(Math.max(
            firstActivityTime.getTime() - 5 * 60 * 1000, // 5 minutes before first activity
            new Date(session.startTime).getTime()
          )),
          new Date(gaps[0].start),
          {
            name: 'Auto-detected Window 1',
            type: 'auto'
          }
        );
        
        windows.push(window);
      }
      
      // Middle windows (between gaps)
      for (let i = 0; i < gaps.length - 1; i++) {
        const window = await this.createTimeWindow(
          sessionId,
          new Date(gaps[i].end),
          new Date(gaps[i + 1].start),
          {
            name: `Auto-detected Window ${i + 2}`,
            type: 'auto'
          }
        );
        
        windows.push(window);
      }
      
      // Last window (last gap to end)
      if (gaps.length > 0 && activities.length > 0) {
        const lastActivityTime = new Date(activities[activities.length - 1].timestamp);
        const window = await this.createTimeWindow(
          sessionId,
          new Date(gaps[gaps.length - 1].end),
          new Date(Math.min(
            lastActivityTime.getTime() + 5 * 60 * 1000, // 5 minutes after last activity
            new Date(session.lastActive).getTime()
          )),
          {
            name: `Auto-detected Window ${gaps.length + 1}`,
            type: 'auto'
          }
        );
        
        windows.push(window);
      }
      
      // Optionally merge adjacent windows if the gap is smaller than threshold
      if (options.mergeAdjacentWindows) {
        const windowsToMerge: string[][] = [];
        let currentGroup: string[] = [];
        
        for (let i = 0; i < windows.length; i++) {
          if (currentGroup.length === 0) {
            currentGroup.push(windows[i].id);
            continue;
          }
          
          const prevWindow = windows[i - 1];
          const currWindow = windows[i];
          
          const prevEnd = new Date(prevWindow.endTime).getTime();
          const currStart = new Date(currWindow.startTime).getTime();
          const gapDuration = currStart - prevEnd;
          
          if (gapDuration <= this._config.autoMergeThreshold) {
            // Add to current group
            currentGroup.push(currWindow.id);
          } else {
            // Start a new group
            if (currentGroup.length > 1) {
              windowsToMerge.push([...currentGroup]);
            }
            currentGroup = [currWindow.id];
          }
        }
        
        // Don't forget the last group
        if (currentGroup.length > 1) {
          windowsToMerge.push([...currentGroup]);
        }
        
        // Merge window groups
        for (const group of windowsToMerge) {
          await this.mergeTimeWindows(group, {
            name: 'Auto-merged Window',
            fillGaps: true
          });
        }
      }
      
      // Get all windows for the session (including merged ones)
      return await this.findTimeWindows({
        sessionId,
        status: 'active'
      });
    } catch (error) {
      logger.error('Error auto-detecting time windows:', error);
      throw error;
    }
  }
  
  /**
   * Calculate statistics for time windows
   * @param criteria Criteria to filter windows for statistics
   * @returns Time window statistics
   */
  async calculateTimeWindowStats(criteria: TimeWindowCriteria = {}): Promise<TimeWindowStats> {
    try {
      // Get windows matching criteria
      const windows = await this.findTimeWindows(criteria);
      
      if (windows.length === 0) {
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
      
      // Calculate totals and distributions
      let totalDuration = 0;
      let totalTasks = 0;
      let totalFiles = 0;
      const typeDistribution: Record<string, number> = {};
      const durationDistribution = {
        short: 0,
        medium: 0,
        long: 0,
        veryLong: 0
      };
      
      // Gather detailed info for each window
      for (const window of windows) {
        // Calculate duration
        const startTime = new Date(window.startTime);
        const endTime = new Date(window.endTime);
        const duration = endTime.getTime() - startTime.getTime();
        
        totalDuration += duration;
        
        // Categorize by duration
        if (duration < 30 * 60 * 1000) { // < 30 minutes
          durationDistribution.short++;
        } else if (duration < 2 * 60 * 60 * 1000) { // < 2 hours
          durationDistribution.medium++;
        } else if (duration < 4 * 60 * 60 * 1000) { // < 4 hours
          durationDistribution.long++;
        } else {
          durationDistribution.veryLong++;
        }
        
        // Count by type
        const type = window.type || 'unknown';
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
        
        // Get tasks and files
        const windowInfo = await this.getTimeWindowInfo(window.id);
        
        if (windowInfo) {
          totalTasks += windowInfo.taskCount;
          totalFiles += windowInfo.fileCount;
        }
      }
      
      return {
        totalWindows: windows.length,
        totalDuration,
        averageDuration: totalDuration / windows.length,
        totalTasks,
        totalFiles,
        typeDistribution,
        durationDistribution
      };
    } catch (error) {
      logger.error('Error calculating time window stats:', error);
      
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
}