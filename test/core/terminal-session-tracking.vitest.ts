/**
 * Tests for Terminal Session Tracking Module
 * Tests for terminal-session-tracking.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  recordTaskUsage,
  recordFileChange,
  getRecentTasks
} from '../../core/terminal/terminal-session-tracking.ts';
import { sessionTasks, fileSessionMapping } from '../../db/schema-extensions.ts';
import { v4 as uuidv4 } from 'uuid';

// Import comprehensive test utilities
import {
  initializeTerminalTestDB,
  cleanupTestDB,
  createTerminalSession,
  createTestTask,
  createTestFile,
  associateTaskWithSession,
  associateFileWithSession,
  createTerminalTestSetup
} from '../utils/terminal-session-test-utils.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

describe('Terminal Session Tracking', () => {
  let db: BetterSQLite3Database;
  let dbPath: string;
  let sessionId: string;
  
  beforeEach(async () => {
    // Initialize test database using the comprehensive utility
    // Using false for inMemory to ensure we have a file-based DB for compatibility
    const testDb = initializeTerminalTestDB(false);
    db = testDb.db;
    dbPath = testDb.path;
    
    // Create a test session using the utility
    sessionId = await createTerminalSession(db);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up test database using the utility
    cleanupTestDB(dbPath);
  });
  
  describe('recordTaskUsage', () => {
    it('should create a new task usage record when task not previously used', async () => {
      // Create a test task using the utility
      const taskId = await createTestTask(db);

      // Make sure to pass all required parameters: db, sessionId, taskId, and optional maxHistory
      const result = await recordTaskUsage(db, sessionId, taskId);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.data?.taskId).toBe(taskId);

      // Verify the task was recorded
      const tasks = await db.select().from(sessionTasks)
        .where({ sessionId, taskId });

      expect(tasks.length).toBe(1);
      expect(tasks[0].taskId).toBe(taskId);
      expect(tasks[0].sessionId).toBe(sessionId);
      expect(tasks[0].accessTime).toBeInstanceOf(Date);
    });

    it('should update access time when task was previously used', async () => {
      // Create a test task using the utility
      const taskId = await createTestTask(db);
      const initialTime = new Date(Date.now() - 3600000); // 1 hour ago

      // Associate task with session using the utility with a specific time
      await associateTaskWithSession(db, sessionId, taskId, initialTime);

      // Record task usage again with all required parameters
      const result = await recordTaskUsage(db, sessionId, taskId);

      expect(result.success).toBe(true);

      // Verify the task access time was updated
      const tasks = await db.select().from(sessionTasks)
        .where({ sessionId, taskId });

      expect(tasks.length).toBe(1);
      expect(tasks[0].accessTime).not.toEqual(initialTime);
      expect(new Date(tasks[0].accessTime).getTime()).toBeGreaterThan(initialTime.getTime());
    });
    
    it('should handle database errors gracefully', async () => {
      const taskId = uuidv4();
      
      // Mock the database query to throw an error
      vi.spyOn(db.query.sessionTasks, 'findFirst').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const result = await recordTaskUsage(db, sessionId, taskId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('recordFileChange', () => {
    it('should create a new file change record when file not previously tracked', async () => {
      // Create a test file using the utility
      const fileId = await createTestFile(db);

      // Make sure to pass all required parameters: db, sessionId, and fileId (which is a number)
      const result = await recordFileChange(db, sessionId, fileId);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe(sessionId);
      expect(result.data?.fileId).toBe(fileId);

      // Verify the file change was recorded
      const files = await db.select().from(fileSessionMapping)
        .where({ sessionId, fileId });

      expect(files.length).toBe(1);
      expect(files[0].fileId).toBe(fileId);
      expect(files[0].sessionId).toBe(sessionId);
      expect(files[0].firstSeen).toBeInstanceOf(Date);
      expect(files[0].lastModified).toBeInstanceOf(Date);
    });

    it('should update lastModified when file was previously tracked', async () => {
      // Create a test file using the utility
      const fileId = await createTestFile(db);
      const initialTime = new Date(Date.now() - 3600000); // 1 hour ago

      // Associate file with session using the utility with specific times
      await associateFileWithSession(db, sessionId, fileId, initialTime, initialTime);

      // Record file change again with all required parameters
      const result = await recordFileChange(db, sessionId, fileId);

      expect(result.success).toBe(true);

      // Verify only lastModified was updated
      const files = await db.select().from(fileSessionMapping)
        .where({ sessionId, fileId });

      expect(files.length).toBe(1);
      expect(new Date(files[0].firstSeen).getTime()).toEqual(initialTime.getTime());
      expect(new Date(files[0].lastModified).getTime()).toBeGreaterThan(initialTime.getTime());
    });
    
    it('should handle database errors gracefully', async () => {
      const fileId = 12345;
      
      // Mock the database query to throw an error
      vi.spyOn(db.query.fileSessionMapping, 'findFirst').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const result = await recordFileChange(db, sessionId, fileId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('getRecentTasks', () => {
    beforeEach(async () => {
      // Create and associate multiple tasks with different access times using the utility
      const tasks = [
        { id: `task-1-${uuidv4().slice(0, 8)}`, time: new Date(Date.now() - 1000) },   // most recent
        { id: `task-2-${uuidv4().slice(0, 8)}`, time: new Date(Date.now() - 2000) },
        { id: `task-3-${uuidv4().slice(0, 8)}`, time: new Date(Date.now() - 3000) },
        { id: `task-4-${uuidv4().slice(0, 8)}`, time: new Date(Date.now() - 4000) },
        { id: `task-5-${uuidv4().slice(0, 8)}`, time: new Date(Date.now() - 5000) }    // oldest
      ];
      
      for (const task of tasks) {
        // Create the task using the utility
        await createTestTask(db, { id: task.id });
        
        // Associate with session using custom time
        await associateTaskWithSession(db, sessionId, task.id, task.time);
      }
    });
    
    it('should return tasks in order of most recent access', async () => {
      const recentTasks = await getRecentTasks(db, sessionId);
      
      expect(recentTasks.length).toBe(5);
      expect(recentTasks[0]).toContain('task-1');
      expect(recentTasks[4]).toContain('task-5');
    });
    
    it('should respect the limit parameter', async () => {
      const limitedTasks = await getRecentTasks(db, sessionId, 3);
      
      expect(limitedTasks.length).toBe(3);
      expect(limitedTasks[0]).toContain('task-1');
      expect(limitedTasks[2]).toContain('task-3');
    });
    
    it('should return an empty array for unknown session IDs', async () => {
      const unknownSessionId = uuidv4();
      const tasks = await getRecentTasks(db, unknownSessionId);
      
      expect(tasks).toEqual([]);
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock the database query to throw an error
      vi.spyOn(db, 'select').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const tasks = await getRecentTasks(db, sessionId);
      
      expect(tasks).toEqual([]);
    });
  });
  
  describe('using createTerminalTestSetup utility', () => {
    it('should successfully use the comprehensive test setup utility', async () => {
      // Clean up the previous test resources
      cleanupTestDB(dbPath);
      
      // Create a comprehensive test environment with the utility
      const testSetup = await createTerminalTestSetup({
        inMemory: false, // Use file-based DB for this test
        taskCount: 2,
        fileCount: 2
      });
      
      try {
        // Test recording task usage with the setup
        const result = await recordTaskUsage(
          testSetup.db, 
          testSetup.sessionId, 
          testSetup.taskIds[0]
        );
        
        expect(result.success).toBe(true);
        expect(result.sessionId).toBe(testSetup.sessionId);
        
        // Test getting recent tasks
        const recentTasks = await getRecentTasks(testSetup.db, testSetup.sessionId);
        expect(recentTasks.length).toBeGreaterThan(0);
        
      } finally {
        // Use the built-in cleanup function
        testSetup.cleanup();
      }
    });
  });
});