/**
 * Tests for TimeWindowManager functionality
 * 
 * These tests cover time window creation, querying, merging, and splitting
 * and validate proper handling of sessions, tasks, and timestamps.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeWindowManager } from '../../core/terminal/time-window-manager.ts';
import { createDb } from '../../db/init.ts';
import { v4 as uuidv4 } from 'uuid';
import { terminalSessions, sessionTasks, timeWindows } from '../../db/schema-extensions.ts';
import { tasks } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';

describe('TimeWindowManager', () => {
  // Test database and manager instances
  let dbPath: string;
  let db: any;
  let timeWindowManager: TimeWindowManager;
  
  // Test data
  let testSessionId: string;
  const testTaskId = 'test-task-123';
  
  // Helper to create a date at specific offset from now
  const dateOffset = (offsetMs: number) => new Date(Date.now() + offsetMs);
  
  // Helper to initialize database schema for testing
  async function initializeTestDb(db: any) {
    // Create test tables
    // Access the underlying SQLite instance directly from the result
    // The driver field doesn't exist in this case, we need to access sqlite directly
    db.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        body TEXT,
        status TEXT DEFAULT 'todo',
        readiness TEXT DEFAULT 'draft',
        createdAt INTEGER,
        updatedAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS terminal_sessions (
        id TEXT PRIMARY KEY,
        tty TEXT,
        pid INTEGER,
        ppid INTEGER,
        windowColumns INTEGER,
        windowRows INTEGER,
        user TEXT,
        shell TEXT,
        startTime INTEGER NOT NULL,
        lastActive INTEGER NOT NULL,
        status TEXT DEFAULT 'active',
        currentTaskId TEXT,
        connectionCount INTEGER DEFAULT 1,
        lastDisconnect INTEGER,
        recoveryCount INTEGER DEFAULT 0,
        lastRecovery INTEGER,
        recoverySource TEXT,
        metadata TEXT DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS session_tasks (
        sessionId TEXT NOT NULL,
        taskId TEXT NOT NULL,
        accessTime INTEGER NOT NULL,
        PRIMARY KEY (sessionId, taskId)
      );

      CREATE TABLE IF NOT EXISTS time_windows (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        startTime INTEGER NOT NULL,
        endTime INTEGER NOT NULL,
        name TEXT,
        type TEXT,
        status TEXT DEFAULT 'active',
        metadata TEXT DEFAULT '{}'
      );
    `);
  }

  beforeEach(async () => {
    // Set up test database
    dbPath = `:memory:`;
    const result = createDb(dbPath);
    db = result.db;

    // Initialize database schema
    await initializeTestDb(db);

    // Create session record for testing
    testSessionId = uuidv4();
    await db.insert(terminalSessions).values({
      id: testSessionId,
      tty: '/dev/test',
      pid: 12345,
      ppid: 12344,
      windowColumns: 80,
      windowRows: 24,
      user: 'test-user',
      shell: 'bash',
      startTime: new Date(),
      lastActive: new Date(),
      status: 'active'
    });

    // Create test task
    await db.insert(tasks).values({
      id: testTaskId,
      title: 'Test Task',
      description: 'A test task for time window testing',
      status: 'in-progress',
      readiness: 'ready',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create session task association
    await db.insert(sessionTasks).values({
      sessionId: testSessionId,
      taskId: testTaskId,
      accessTime: new Date()
    });

    // Create time window manager
    timeWindowManager = new TimeWindowManager(db);

    // Spy on logger
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(async () => {
    // Clean up test data
    try {
      // Clear all time windows
      await db.delete(timeWindows);
      // Clear all session tasks
      await db.delete(sessionTasks);
      // Clear all sessions
      await db.delete(terminalSessions);
      
      vi.restoreAllMocks();
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });
  
  describe('createTimeWindow', () => {
    it('should create a time window for a session', async () => {
      // Test creating a basic time window
      const startTime = dateOffset(-60 * 60 * 1000); // 1 hour ago
      const endTime = dateOffset(-30 * 60 * 1000); // 30 minutes ago
      
      const window = await timeWindowManager.createTimeWindow(
        testSessionId,
        startTime,
        endTime,
        {
          name: 'Test Window',
          type: 'work'
        }
      );
      
      // Verify window was created
      expect(window).toBeDefined();
      expect(window.id).toBeDefined();
      expect(window.sessionId).toBe(testSessionId);
      expect(window.name).toBe('Test Window');
      expect(window.type).toBe('work');
      expect(new Date(window.startTime).getTime()).toBe(startTime.getTime());
      expect(new Date(window.endTime).getTime()).toBe(endTime.getTime());
      expect(window.status).toBe('active');
    });
    
    it('should reject creating a window with end time before start time', async () => {
      // Test with invalid time range
      const startTime = dateOffset(-30 * 60 * 1000); // 30 minutes ago
      const endTime = dateOffset(-60 * 60 * 1000); // 1 hour ago (before start)
      
      await expect(
        timeWindowManager.createTimeWindow(
          testSessionId,
          startTime,
          endTime,
          { name: 'Invalid Window' }
        )
      ).rejects.toThrow('End time must be after start time');
    });
    
    it('should auto-split windows that exceed maximum duration', async () => {
      // Create a long window that should be auto-split
      const startTime = dateOffset(-8 * 60 * 60 * 1000); // 8 hours ago
      const endTime = new Date(); // now
      
      // Configure for auto-splitting
      const customManager = new TimeWindowManager(db, {
        maxWindowDuration: 4 * 60 * 60 * 1000, // 4 hours
        autoSplitLongWindows: true
      });
      
      // Event spy
      const eventSpy = vi.fn();
      customManager.on('window:split:auto', eventSpy);
      
      const window = await customManager.createTimeWindow(
        testSessionId,
        startTime,
        endTime,
        { name: 'Long Window' }
      );
      
      // Verify window was created and split event was emitted
      expect(window).toBeDefined();
      expect(eventSpy).toHaveBeenCalled();
      
      // Check for multiple windows created
      const windows = await customManager.findTimeWindows({
        sessionId: testSessionId
      });
      
      expect(windows.length).toBeGreaterThan(1);
    });
  });
  
  describe('findTimeWindows', () => {
    beforeEach(async () => {
      // Create test windows for querying
      const oneHourAgo = dateOffset(-60 * 60 * 1000);
      const twoHoursAgo = dateOffset(-2 * 60 * 60 * 1000);
      const threeHoursAgo = dateOffset(-3 * 60 * 60 * 1000);
      
      // Window 1: work type, 2-1 hours ago
      await timeWindowManager.createTimeWindow(
        testSessionId,
        twoHoursAgo,
        oneHourAgo,
        { name: 'Work Window', type: 'work' }
      );
      
      // Window 2: break type, 3-2 hours ago
      await timeWindowManager.createTimeWindow(
        testSessionId,
        threeHoursAgo,
        twoHoursAgo,
        { name: 'Break Window', type: 'break' }
      );
    });
    
    it('should find all windows for a session', async () => {
      const windows = await timeWindowManager.findTimeWindows({
        sessionId: testSessionId
      });
      
      expect(windows.length).toBe(2);
    });
    
    it('should filter windows by type', async () => {
      const workWindows = await timeWindowManager.findTimeWindows({
        sessionId: testSessionId,
        type: 'work'
      });
      
      expect(workWindows.length).toBe(1);
      expect(workWindows[0].name).toBe('Work Window');
      
      const breakWindows = await timeWindowManager.findTimeWindows({
        sessionId: testSessionId,
        type: 'break'
      });
      
      expect(breakWindows.length).toBe(1);
      expect(breakWindows[0].name).toBe('Break Window');
    });
    
    it('should find a window containing a specific timestamp', async () => {
      const timestamp = dateOffset(-90 * 60 * 1000); // 1.5 hours ago
      
      const windows = await timeWindowManager.findTimeWindows({
        sessionId: testSessionId,
        containsTime: timestamp
      });
      
      expect(windows.length).toBe(1);
      expect(windows[0].name).toBe('Work Window');
    });
  });
  
  describe('mergeTimeWindows', () => {
    let windowIds: string[] = [];
    
    beforeEach(async () => {
      // Create test windows for merging
      const oneHourAgo = dateOffset(-60 * 60 * 1000);
      const twoHoursAgo = dateOffset(-2 * 60 * 60 * 1000);
      const threeHoursAgo = dateOffset(-3 * 60 * 60 * 1000);
      
      // Window 1: 2-1 hours ago
      const window1 = await timeWindowManager.createTimeWindow(
        testSessionId,
        twoHoursAgo,
        oneHourAgo,
        { name: 'Window 1', type: 'work' }
      );
      
      // Window 2: 3-2 hours ago
      const window2 = await timeWindowManager.createTimeWindow(
        testSessionId,
        threeHoursAgo,
        twoHoursAgo,
        { name: 'Window 2', type: 'work' }
      );
      
      windowIds = [window1.id, window2.id];
    });
    
    it('should merge multiple windows into one', async () => {
      // Event spy
      const eventSpy = vi.fn();
      timeWindowManager.on('window:merged', eventSpy);
      
      const mergedWindow = await timeWindowManager.mergeTimeWindows(windowIds, {
        name: 'Merged Window'
      });
      
      // Verify merged window
      expect(mergedWindow).toBeDefined();
      expect(mergedWindow.name).toBe('Merged Window');
      
      // Check time range
      const threeHoursAgo = dateOffset(-3 * 60 * 60 * 1000);
      const oneHourAgo = dateOffset(-60 * 60 * 1000);
      
      // Allow small timestamp differences due to processing time
      expect(new Date(mergedWindow.startTime)).toBeCloseTo(threeHoursAgo, 1000);
      expect(new Date(mergedWindow.endTime)).toBeCloseTo(oneHourAgo, 1000);
      
      // Check original windows are marked as merged
      for (const windowId of windowIds) {
        const window = await db.query.timeWindows.findFirst({
          where: eq(timeWindows.id, windowId)
        });
        
        expect(window.status).toBe('merged');
      }
      
      // Verify event was emitted
      expect(eventSpy).toHaveBeenCalled();
    });
    
    it('should require at least two windows for merging', async () => {
      await expect(
        timeWindowManager.mergeTimeWindows([windowIds[0]], {
          name: 'Invalid Merge'
        })
      ).rejects.toThrow('At least two windows are required for merging');
    });
  });
  
  describe('splitTimeWindow', () => {
    let testWindowId: string;
    
    beforeEach(async () => {
      // Create a test window for splitting
      const threeHoursAgo = dateOffset(-3 * 60 * 60 * 1000);
      const oneHourAgo = dateOffset(-60 * 60 * 1000);
      
      const window = await timeWindowManager.createTimeWindow(
        testSessionId,
        threeHoursAgo,
        oneHourAgo,
        { name: 'Window to Split', type: 'work' }
      );
      
      testWindowId = window.id;
    });
    
    it('should split a window at a specific time', async () => {
      // Split time at 2 hours ago
      const splitTime = dateOffset(-2 * 60 * 60 * 1000);
      
      // Event spy
      const eventSpy = vi.fn();
      timeWindowManager.on('window:split', eventSpy);
      
      const [firstWindow, secondWindow] = await timeWindowManager.splitTimeWindow(
        testWindowId,
        splitTime
      );
      
      // Verify windows were created
      expect(firstWindow).toBeDefined();
      expect(secondWindow).toBeDefined();
      
      // Check time ranges
      const threeHoursAgo = dateOffset(-3 * 60 * 60 * 1000);
      const oneHourAgo = dateOffset(-60 * 60 * 1000);
      
      // First window: 3-2 hours ago
      expect(new Date(firstWindow.startTime)).toBeCloseTo(threeHoursAgo, 1000);
      expect(new Date(firstWindow.endTime)).toBeCloseTo(splitTime, 1000);
      
      // Second window: 2-1 hours ago
      expect(new Date(secondWindow.startTime)).toBeCloseTo(splitTime, 1000);
      expect(new Date(secondWindow.endTime)).toBeCloseTo(oneHourAgo, 1000);
      
      // Check original window is marked as merged
      const originalWindow = await db.query.timeWindows.findFirst({
        where: eq(timeWindows.id, testWindowId)
      });
      
      expect(originalWindow.status).toBe('merged');
      
      // Verify event was emitted
      expect(eventSpy).toHaveBeenCalled();
    });
    
    it('should reject splitting with invalid split time', async () => {
      // Try to split at a time outside the window
      const invalidTime = dateOffset(-4 * 60 * 60 * 1000); // 4 hours ago, before window start
      
      await expect(
        timeWindowManager.splitTimeWindow(testWindowId, invalidTime)
      ).rejects.toThrow('Split time must be between window start and end times');
    });
  });
  
  describe('autoDetectTimeWindows', () => {
    beforeEach(async () => {
      // Create some session activities for auto-detection
      const fourHoursAgo = dateOffset(-4 * 60 * 60 * 1000);
      const threeHoursAgo = dateOffset(-3 * 60 * 60 * 1000);
      const twoHoursAgo = dateOffset(-2 * 60 * 60 * 1000);
      const oneHourAgo = dateOffset(-1 * 60 * 60 * 1000);
      
      // Add session task activities
      await db.insert(sessionTasks).values({
        sessionId: testSessionId,
        taskId: testTaskId,
        accessTime: fourHoursAgo
      });
      
      await db.insert(sessionTasks).values({
        sessionId: testSessionId,
        taskId: testTaskId,
        accessTime: threeHoursAgo
      });
      
      // Gap between 3 and 2 hours ago
      
      await db.insert(sessionTasks).values({
        sessionId: testSessionId,
        taskId: testTaskId,
        accessTime: oneHourAgo
      });
    });
    
    it('should auto-detect time windows based on activity', async () => {
      const detectedWindows = await timeWindowManager.autoDetectTimeWindows(testSessionId);
      
      // Should detect at least one window
      expect(detectedWindows.length).toBeGreaterThan(0);
      
      // Windows should have auto type
      for (const window of detectedWindows) {
        expect(window.type).toBe('auto');
      }
    });
  });
  
  describe('getTimeWindowInfo', () => {
    let testWindowId: string;
    
    beforeEach(async () => {
      // Create a test window
      const twoHoursAgo = dateOffset(-2 * 60 * 60 * 1000);
      const oneHourAgo = dateOffset(-1 * 60 * 60 * 1000);
      
      const window = await timeWindowManager.createTimeWindow(
        testSessionId,
        twoHoursAgo,
        oneHourAgo,
        { name: 'Info Test Window', type: 'work' }
      );
      
      testWindowId = window.id;
      
      // Create session task activities within the window
      const activityTime = dateOffset(-90 * 60 * 1000); // 1.5 hours ago
      
      await db.insert(sessionTasks).values({
        sessionId: testSessionId,
        taskId: testTaskId,
        accessTime: activityTime
      });
    });
    
    it('should return detailed window information with tasks', async () => {
      const windowInfo = await timeWindowManager.getTimeWindowInfo(testWindowId);
      
      expect(windowInfo).toBeDefined();
      expect(windowInfo.id).toBe(testWindowId);
      expect(windowInfo.name).toBe('Info Test Window');
      expect(windowInfo.type).toBe('work');
      
      // Should include duration
      expect(windowInfo.duration).toBeDefined();
      expect(windowInfo.duration).toBeGreaterThan(0);
      
      // Should include task count
      expect(windowInfo.taskCount).toBe(1);
      
      // Should include task IDs
      expect(windowInfo.taskIds).toContain(testTaskId);
    });
  });
  
  describe('calculateTimeWindowStats', () => {
    beforeEach(async () => {
      // Create various test windows for statistics
      const fourHoursAgo = dateOffset(-4 * 60 * 60 * 1000);
      const threeHoursAgo = dateOffset(-3 * 60 * 60 * 1000);
      const twoHoursAgo = dateOffset(-2 * 60 * 60 * 1000);
      const oneHourAgo = dateOffset(-1 * 60 * 60 * 1000);
      const halfHourAgo = dateOffset(-30 * 60 * 1000);
      
      // Long work window
      await timeWindowManager.createTimeWindow(
        testSessionId,
        fourHoursAgo,
        twoHoursAgo,
        { name: 'Long Work', type: 'work' }
      );
      
      // Short break window
      await timeWindowManager.createTimeWindow(
        testSessionId,
        twoHoursAgo,
        oneHourAgo,
        { name: 'Break', type: 'break' }
      );
      
      // Very short meeting window
      await timeWindowManager.createTimeWindow(
        testSessionId,
        oneHourAgo,
        halfHourAgo,
        { name: 'Meeting', type: 'meeting' }
      );
    });
    
    it('should calculate time window statistics', async () => {
      const stats = await timeWindowManager.calculateTimeWindowStats({
        sessionId: testSessionId
      });
      
      expect(stats).toBeDefined();
      expect(stats.totalWindows).toBe(3);
      expect(stats.totalDuration).toBeGreaterThan(0);
      
      // Check type distribution
      expect(stats.typeDistribution).toHaveProperty('work');
      expect(stats.typeDistribution).toHaveProperty('break');
      expect(stats.typeDistribution).toHaveProperty('meeting');
      
      // Check duration distribution
      expect(stats.durationDistribution.short +
             stats.durationDistribution.medium +
             stats.durationDistribution.long +
             stats.durationDistribution.veryLong).toBe(3);
    });
    
    it('should filter statistics by type', async () => {
      const workStats = await timeWindowManager.calculateTimeWindowStats({
        sessionId: testSessionId,
        type: 'work'
      });
      
      expect(workStats.totalWindows).toBe(1);
      expect(workStats.typeDistribution).toHaveProperty('work');
      expect(workStats.typeDistribution.work).toBe(1);
    });
  });
});