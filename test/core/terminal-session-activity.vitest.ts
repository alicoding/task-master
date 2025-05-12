/**
 * Tests for Terminal Session Activity Module
 * Tests for terminal-session-activity.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  trackTaskUsageForSession,
  trackFileChangeForSession,
  getRecentTasksForSession,
  updateSessionWithTask,
  trackFileActivityForSession,
  createSessionActivity,
  getSessionActivitySummary
} from '../../core/terminal/terminal-session-activity';
import { TerminalSessionState, SessionActivityType } from '../../core/terminal/terminal-session-types';
import { createDb } from '../../db/init';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import fs from 'fs';
import os from 'os';

// Create test DB path
const createTestDbPath = () => join(os.tmpdir(), `test-tm-${Date.now()}.db`);

// Mock dependencies
vi.mock('../../core/terminal/terminal-session-index.ts', () => ({
  recordTaskUsage: vi.fn().mockResolvedValue({ 
    success: true, 
    sessionId: 'test-session', 
    message: 'Task usage recorded successfully',
    data: { taskId: 'task-123' }
  }),
  recordFileChange: vi.fn().mockResolvedValue({
    success: true,
    sessionId: 'test-session',
    message: 'File change recorded successfully',
    data: { fileId: 12345 }
  }),
  getRecentTasks: vi.fn().mockResolvedValue(['task-1', 'task-2', 'task-3'])
}));

vi.mock('../../core/terminal/terminal-session-time-windows.ts', () => ({
  createTaskActivityWindow: vi.fn().mockResolvedValue({ id: 'window-1' })
}));

describe('Terminal Session Activity', () => {
  let dbPath: string;
  let db: any;
  let mockSession: TerminalSessionState;
  let mockTimeWindowManager: any;
  
  beforeEach(() => {
    // Create a test database
    dbPath = createTestDbPath();
    const result = createDb(dbPath);
    db = result.db;
    
    // Create a mock session
    mockSession = {
      id: 'test-session',
      fingerprint: { 
        tty: '/dev/test',
        pid: 12345,
        ppid: 12344,
        user: 'test-user',
        shell: 'bash'
      },
      status: 'active',
      startTime: new Date(),
      lastActive: new Date()
    };
    
    // Create mock time window manager
    mockTimeWindowManager = {
      createTimeWindow: vi.fn().mockResolvedValue({ id: 'window-1' })
    };
    
    // Setup database execute mock to simulate activity summary queries
    vi.spyOn(db, 'execute').mockImplementation((query) => {
      if (query.includes('session_tasks')) {
        return { rows: [{ count: 5 }] };
      } else if (query.includes('file_session_mapping')) {
        return { rows: [{ count: 10 }] };
      } else if (query.includes('terminal_sessions')) {
        const now = new Date();
        const startTime = new Date(now.getTime() - 3600000); // 1 hour ago
        return {
          rows: [{
            start_time: startTime.toISOString(),
            last_active: now.toISOString()
          }]
        };
      }
      return { rows: [] };
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up test database
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  });
  
  describe('Task usage tracking', () => {
    it('trackTaskUsageForSession should call recordTaskUsage with correct parameters', async () => {
      const { recordTaskUsage } = require('../../core/terminal/terminal-session-index.ts');
      
      const result = await trackTaskUsageForSession(db, 'test-session', 'task-123', 15);
      
      expect(recordTaskUsage).toHaveBeenCalledWith(db, 'test-session', 'task-123', 15);
      expect(result).toEqual({
        success: true,
        sessionId: 'test-session',
        message: 'Task usage recorded successfully',
        data: { taskId: 'task-123' }
      });
    });
    
    it('getRecentTasksForSession should call getRecentTasks with correct parameters', async () => {
      const { getRecentTasks } = require('../../core/terminal/terminal-session-index.ts');
      
      const result = await getRecentTasksForSession(db, 'test-session', 5);
      
      expect(getRecentTasks).toHaveBeenCalledWith(db, 'test-session', 5);
      expect(result).toEqual(['task-1', 'task-2', 'task-3']);
    });
  });
  
  describe('File change tracking', () => {
    it('trackFileChangeForSession should call recordFileChange with correct parameters', async () => {
      const { recordFileChange } = require('../../core/terminal/terminal-session-index.ts');
      
      const result = await trackFileChangeForSession(db, 'test-session', 12345);
      
      expect(recordFileChange).toHaveBeenCalledWith(db, 'test-session', 12345);
      expect(result).toEqual({
        success: true,
        sessionId: 'test-session',
        message: 'File change recorded successfully',
        data: { fileId: 12345 }
      });
    });
    
    it('trackFileActivityForSession should return null if tracking is disabled', async () => {
      const result = await trackFileActivityForSession(db, 'test-session', 12345, false);
      
      expect(result).toBeNull();
    });
    
    it('trackFileActivityForSession should call trackFileChangeForSession if tracking is enabled', async () => {
      const { recordFileChange } = require('../../core/terminal/terminal-session-index.ts');
      
      const result = await trackFileActivityForSession(db, 'test-session', 12345, true);
      
      expect(recordFileChange).toHaveBeenCalledWith(db, 'test-session', 12345);
      expect(result).toEqual({
        success: true,
        sessionId: 'test-session',
        message: 'File change recorded successfully',
        data: { fileId: 12345 }
      });
    });
    
    it('trackFileActivityForSession should handle errors gracefully', async () => {
      const { recordFileChange } = require('../../core/terminal/terminal-session-index.ts');
      recordFileChange.mockRejectedValue(new Error('File tracking failed'));
      
      const result = await trackFileActivityForSession(db, 'test-session', 12345, true);
      
      expect(result?.success).toBe(false);
      expect(result?.error).toBeDefined();
    });
  });
  
  describe('updateSessionWithTask', () => {
    it('should update session with task and return updates without tracking when tracking is disabled', async () => {
      const result = await updateSessionWithTask(
        db,
        mockSession,
        'task-123',
        false,  // trackTaskUsage = false
        mockTimeWindowManager
      );
      
      // Should only contain basic updates
      expect(result).toEqual({
        currentTaskId: 'task-123',
        lastActive: expect.any(Date)
      });
      
      // Should not call tracking functions
      const { recordTaskUsage } = require('../../core/terminal/terminal-session-index.ts');
      expect(recordTaskUsage).not.toHaveBeenCalled();
    });
    
    it('should track task usage and create time window when tracking is enabled', async () => {
      const { recordTaskUsage, getRecentTasks } = require('../../core/terminal/terminal-session-index.ts');
      const { createTaskActivityWindow } = require('../../core/terminal/terminal-session-time-windows.ts');
      
      const result = await updateSessionWithTask(
        db,
        mockSession,
        'task-123',
        true,  // trackTaskUsage = true
        mockTimeWindowManager
      );
      
      // Should contain additional recentTaskIds
      expect(result).toEqual({
        currentTaskId: 'task-123',
        lastActive: expect.any(Date),
        recentTaskIds: ['task-1', 'task-2', 'task-3']
      });
      
      // Should call tracking functions
      expect(recordTaskUsage).toHaveBeenCalledWith(db, 'test-session', 'task-123');
      expect(createTaskActivityWindow).toHaveBeenCalledWith(
        mockTimeWindowManager,
        'test-session',
        'task-123',
        expect.any(Date)
      );
      expect(getRecentTasks).toHaveBeenCalledWith(db, 'test-session');
    });
    
    it('should still return updates if time window creation fails', async () => {
      const { createTaskActivityWindow } = require('../../core/terminal/terminal-session-time-windows.ts');
      createTaskActivityWindow.mockRejectedValue(new Error('Window creation failed'));
      
      const result = await updateSessionWithTask(
        db,
        mockSession,
        'task-123',
        true,
        mockTimeWindowManager
      );
      
      // Should still return valid updates
      expect(result).toEqual({
        currentTaskId: 'task-123',
        lastActive: expect.any(Date),
        recentTaskIds: ['task-1', 'task-2', 'task-3']
      });
    });
    
    it('should handle tracking errors gracefully', async () => {
      const { recordTaskUsage } = require('../../core/terminal/terminal-session-index.ts');
      recordTaskUsage.mockRejectedValue(new Error('Tracking failed'));
      
      // Should not throw
      const result = await updateSessionWithTask(
        db,
        mockSession,
        'task-123',
        true,
        mockTimeWindowManager
      );
      
      // Should return basic updates
      expect(result).toEqual({
        currentTaskId: 'task-123',
        lastActive: expect.any(Date)
      });
    });
  });
  
  describe('createSessionActivity', () => {
    it('should track task activity when activityType is TASK', async () => {
      const { recordTaskUsage } = require('../../core/terminal/terminal-session-index.ts');
      
      const result = await createSessionActivity(
        db,
        mockSession,
        SessionActivityType.TASK,
        { taskId: 'task-123' },
        mockTimeWindowManager
      );
      
      expect(recordTaskUsage).toHaveBeenCalledWith(db, 'test-session', 'task-123');
      expect(mockTimeWindowManager.createTimeWindow).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.activityType).toBe(SessionActivityType.TASK);
    });
    
    it('should track file activity when activityType is FILE', async () => {
      const { recordFileChange } = require('../../core/terminal/terminal-session-index.ts');
      
      const result = await createSessionActivity(
        db,
        mockSession,
        SessionActivityType.FILE,
        { fileId: 12345 },
        mockTimeWindowManager
      );
      
      expect(recordFileChange).toHaveBeenCalledWith(db, 'test-session', 12345);
      expect(mockTimeWindowManager.createTimeWindow).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data?.activityType).toBe(SessionActivityType.FILE);
    });
    
    it('should handle COMMAND activity type (placeholder)', async () => {
      const result = await createSessionActivity(
        db,
        mockSession,
        SessionActivityType.COMMAND,
        { command: 'test-command' },
        mockTimeWindowManager
      );
      
      expect(result.success).toBe(true);
      expect(result.data?.activityType).toBe(SessionActivityType.COMMAND);
    });
    
    it('should handle WINDOW activity type (placeholder)', async () => {
      const result = await createSessionActivity(
        db,
        mockSession,
        SessionActivityType.WINDOW,
        { columns: 100, rows: 50 },
        mockTimeWindowManager
      );
      
      expect(result.success).toBe(true);
      expect(result.data?.activityType).toBe(SessionActivityType.WINDOW);
    });
    
    it('should not create time window if tracking returns false', async () => {
      const { recordTaskUsage } = require('../../core/terminal/terminal-session-index.ts');
      recordTaskUsage.mockResolvedValue({ success: false });
      
      // Missing taskId
      const result = await createSessionActivity(
        db,
        mockSession,
        SessionActivityType.TASK,
        {}, // No taskId provided
        mockTimeWindowManager
      );
      
      expect(mockTimeWindowManager.createTimeWindow).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
    });
    
    it('should handle null timeWindowManager gracefully', async () => {
      const result = await createSessionActivity(
        db,
        mockSession,
        SessionActivityType.TASK,
        { taskId: 'task-123' },
        null // No time window manager
      );
      
      expect(result.success).toBe(true);
    });
    
    it('should handle time window creation errors gracefully', async () => {
      mockTimeWindowManager.createTimeWindow.mockRejectedValue(new Error('Window creation failed'));
      
      const result = await createSessionActivity(
        db,
        mockSession,
        SessionActivityType.TASK,
        { taskId: 'task-123' },
        mockTimeWindowManager
      );
      
      // Should still succeed if window creation fails
      expect(result.success).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      const { recordTaskUsage } = require('../../core/terminal/terminal-session-index.ts');
      recordTaskUsage.mockRejectedValue(new Error('Activity tracking failed'));
      
      const result = await createSessionActivity(
        db,
        mockSession,
        SessionActivityType.TASK,
        { taskId: 'task-123' },
        mockTimeWindowManager
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('getSessionActivitySummary', () => {
    it('should return activity metrics for a valid session', async () => {
      const result = await getSessionActivitySummary(db, 'test-session');
      
      expect(result).toEqual({
        taskCount: 5,
        fileCount: 10,
        lastActivity: expect.any(Date),
        activeTime: 3600000, // 1 hour
        activityScore: expect.any(Number)
      });
      
      // Check that activity score is reasonable
      expect(result.activityScore).toBeGreaterThan(0);
      expect(result.activityScore).toBeLessThanOrEqual(100);
    });
    
    it('should return default values if no session data is found', async () => {
      // Mock db.execute to return empty results
      vi.spyOn(db, 'execute').mockImplementation(() => ({ rows: [] }));
      
      const result = await getSessionActivitySummary(db, 'nonexistent-session');
      
      expect(result).toEqual({
        taskCount: 0,
        fileCount: 0,
        lastActivity: null,
        activeTime: 0,
        activityScore: 0
      });
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock db.execute to throw errors
      vi.spyOn(db, 'execute').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      const result = await getSessionActivitySummary(db, 'test-session');
      
      expect(result).toEqual({
        taskCount: 0,
        fileCount: 0,
        lastActivity: null,
        activeTime: 0,
        activityScore: 0
      });
    });
  });
});