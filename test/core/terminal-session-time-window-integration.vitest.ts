/**
 * Tests for Terminal Session Time Window Integration Module
 * Tests for terminal-session-time-window-integration.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  findTimeWindows,
  createTimeWindow,
  autoDetectTimeWindows,
  getTimeWindowStats,
  createTaskActivityWindow,
  createRecoveryWindow,
  splitTimeWindow,
  mergeTimeWindows,
  getTimeWindowInfo,
  findTimeWindowAtTime,
  getOrCreateTimeWindowForTimestamp
} from '../../core/terminal/terminal-session-time-window-integration';
import { v4 as uuidv4 } from 'uuid';

describe('Terminal Session Time Window Integration', () => {
  let mockTimeWindowManager: any;
  const mockSessionId = uuidv4();
  
  beforeEach(() => {
    // Set up a mock time window manager with spies on all methods
    mockTimeWindowManager = {
      findTimeWindows: vi.fn().mockResolvedValue([
        { id: 'window-1', sessionId: mockSessionId, startTime: new Date(), endTime: new Date() }
      ]),
      createTimeWindow: vi.fn().mockResolvedValue({
        id: 'window-2', sessionId: mockSessionId, startTime: new Date(), endTime: new Date() 
      }),
      autoDetectTimeWindows: vi.fn().mockResolvedValue([
        { id: 'window-3', sessionId: mockSessionId, startTime: new Date(), endTime: new Date() }
      ]),
      calculateTimeWindowStats: vi.fn().mockResolvedValue({
        totalWindows: 5,
        totalDuration: 3600000,
        averageDuration: 720000
      }),
      findTimeWindowAtTime: vi.fn().mockResolvedValue({
        id: 'window-4', sessionId: mockSessionId, startTime: new Date(), endTime: new Date()
      }),
      getOrCreateTimeWindowForTimestamp: vi.fn().mockResolvedValue({
        id: 'window-5', sessionId: mockSessionId, startTime: new Date(), endTime: new Date()
      }),
      splitTimeWindow: vi.fn().mockResolvedValue([
        { id: 'window-6a', sessionId: mockSessionId, startTime: new Date(), endTime: new Date() },
        { id: 'window-6b', sessionId: mockSessionId, startTime: new Date(), endTime: new Date() }
      ]),
      mergeTimeWindows: vi.fn().mockResolvedValue({
        id: 'window-7', sessionId: mockSessionId, startTime: new Date(), endTime: new Date()
      }),
      getTimeWindowInfo: vi.fn().mockResolvedValue({
        window: { id: 'window-8', sessionId: mockSessionId, startTime: new Date(), endTime: new Date() },
        duration: 3600000,
        previousWindow: null,
        nextWindow: null,
        associatedTasks: ['task-1', 'task-2']
      })
    };
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('findTimeWindows', () => {
    it('should return empty array if time window manager is null', async () => {
      const result = await findTimeWindows(null, mockSessionId);
      expect(result).toEqual([]);
    });
    
    it('should call findTimeWindows with correct parameters', async () => {
      const options = {
        type: 'work',
        status: 'active',
        containsTime: new Date(),
        taskId: 'task-123'
      };
      
      const result = await findTimeWindows(mockTimeWindowManager, mockSessionId, options);
      
      expect(mockTimeWindowManager.findTimeWindows).toHaveBeenCalledWith({
        sessionId: mockSessionId,
        ...options
      });
      
      expect(result).toEqual([
        { id: 'window-1', sessionId: mockSessionId, startTime: expect.any(Date), endTime: expect.any(Date) }
      ]);
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.findTimeWindows.mockRejectedValue(new Error('Find failed'));
      
      const result = await findTimeWindows(mockTimeWindowManager, mockSessionId);
      
      expect(result).toEqual([]);
    });
  });
  
  describe('createTimeWindow', () => {
    it('should return null if time window manager is null', async () => {
      const result = await createTimeWindow(
        null,
        mockSessionId,
        new Date(),
        new Date()
      );
      expect(result).toBeNull();
    });
    
    it('should call createTimeWindow with correct parameters', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      const options = {
        name: 'Test Window',
        type: 'work',
        status: 'completed'
      };
      
      const result = await createTimeWindow(
        mockTimeWindowManager,
        mockSessionId,
        startTime,
        endTime,
        options
      );
      
      expect(mockTimeWindowManager.createTimeWindow).toHaveBeenCalledWith(
        mockSessionId,
        startTime,
        endTime,
        options
      );
      
      expect(result).toEqual({
        id: 'window-2',
        sessionId: mockSessionId,
        startTime: expect.any(Date),
        endTime: expect.any(Date)
      });
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.createTimeWindow.mockRejectedValue(new Error('Create failed'));
      
      const result = await createTimeWindow(
        mockTimeWindowManager,
        mockSessionId,
        new Date(),
        new Date()
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('autoDetectTimeWindows', () => {
    it('should return empty array if time window manager is null', async () => {
      const result = await autoDetectTimeWindows(null, mockSessionId);
      expect(result).toEqual([]);
    });
    
    it('should call autoDetectTimeWindows with correct parameters', async () => {
      const result = await autoDetectTimeWindows(mockTimeWindowManager, mockSessionId);
      
      expect(mockTimeWindowManager.autoDetectTimeWindows).toHaveBeenCalledWith(mockSessionId);
      
      expect(result).toEqual([
        { id: 'window-3', sessionId: mockSessionId, startTime: expect.any(Date), endTime: expect.any(Date) }
      ]);
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.autoDetectTimeWindows.mockRejectedValue(new Error('Auto-detect failed'));
      
      const result = await autoDetectTimeWindows(mockTimeWindowManager, mockSessionId);
      
      expect(result).toEqual([]);
    });
  });
  
  describe('getTimeWindowStats', () => {
    it('should return null if time window manager is null', async () => {
      const result = await getTimeWindowStats(null, mockSessionId);
      expect(result).toBeNull();
    });
    
    it('should call calculateTimeWindowStats with correct parameters', async () => {
      const options = { type: 'work' };
      
      const result = await getTimeWindowStats(mockTimeWindowManager, mockSessionId, options);
      
      expect(mockTimeWindowManager.calculateTimeWindowStats).toHaveBeenCalledWith({
        sessionId: mockSessionId,
        ...options
      });
      
      expect(result).toEqual({
        totalWindows: 5,
        totalDuration: 3600000,
        averageDuration: 720000
      });
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.calculateTimeWindowStats.mockRejectedValue(new Error('Stats calculation failed'));
      
      const result = await getTimeWindowStats(mockTimeWindowManager, mockSessionId);
      
      expect(result).toBeNull();
    });
  });
  
  describe('createTaskActivityWindow', () => {
    it('should return false if time window manager is null', async () => {
      const result = await createTaskActivityWindow(
        null,
        mockSessionId,
        'task-123'
      );
      expect(result).toBe(false);
    });
    
    it('should create a new window if no existing window is found', async () => {
      // Mock findTimeWindowAtTime to return null (no existing window)
      mockTimeWindowManager.findTimeWindowAtTime.mockResolvedValue(null);
      
      const timestamp = new Date();
      const result = await createTaskActivityWindow(
        mockTimeWindowManager,
        mockSessionId,
        'task-123',
        timestamp
      );
      
      // Should check for existing window first
      expect(mockTimeWindowManager.findTimeWindowAtTime).toHaveBeenCalledWith(
        mockSessionId,
        timestamp
      );
      
      // Should create a new window
      expect(mockTimeWindowManager.getOrCreateTimeWindowForTimestamp).toHaveBeenCalledWith(
        mockSessionId,
        timestamp,
        {
          windowDuration: 3600000, // 1 hour
          name: 'Task Window (task-123)',
          type: 'work'
        }
      );
      
      expect(result).toBe(true);
    });
    
    it('should use existing window if it exists', async () => {
      // Mock findTimeWindowAtTime to return an existing window
      mockTimeWindowManager.findTimeWindowAtTime.mockResolvedValue({
        id: 'existing-window',
        sessionId: mockSessionId
      });
      
      const timestamp = new Date();
      const result = await createTaskActivityWindow(
        mockTimeWindowManager,
        mockSessionId,
        'task-123',
        timestamp
      );
      
      // Should check for existing window
      expect(mockTimeWindowManager.findTimeWindowAtTime).toHaveBeenCalledWith(
        mockSessionId,
        timestamp
      );
      
      // Should not create a new window
      expect(mockTimeWindowManager.getOrCreateTimeWindowForTimestamp).not.toHaveBeenCalled();
      
      expect(result).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.findTimeWindowAtTime.mockRejectedValue(new Error('Find window failed'));
      
      const result = await createTaskActivityWindow(
        mockTimeWindowManager,
        mockSessionId,
        'task-123'
      );
      
      expect(result).toBe(false);
    });
  });
  
  describe('createRecoveryWindow', () => {
    it('should return null if time window manager is null', async () => {
      const result = await createRecoveryWindow(null, mockSessionId, 1);
      expect(result).toBeNull();
    });
    
    it('should call getOrCreateTimeWindowForTimestamp with correct parameters', async () => {
      const timestamp = new Date();
      const result = await createRecoveryWindow(
        mockTimeWindowManager,
        mockSessionId,
        3, // Recovery count
        timestamp
      );
      
      expect(mockTimeWindowManager.getOrCreateTimeWindowForTimestamp).toHaveBeenCalledWith(
        mockSessionId,
        timestamp,
        {
          windowDuration: 3600000, // 1 hour
          name: 'Recovery Window (attempt 3)',
          type: 'recovery'
        }
      );
      
      expect(result).toEqual({
        id: 'window-5',
        sessionId: mockSessionId,
        startTime: expect.any(Date),
        endTime: expect.any(Date)
      });
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.getOrCreateTimeWindowForTimestamp.mockRejectedValue(new Error('Create recovery window failed'));
      
      const result = await createRecoveryWindow(
        mockTimeWindowManager,
        mockSessionId,
        1
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('splitTimeWindow', () => {
    it('should return null if time window manager is null', async () => {
      const result = await splitTimeWindow(
        null,
        'window-1',
        new Date()
      );
      expect(result).toBeNull();
    });
    
    it('should call splitTimeWindow with correct parameters', async () => {
      const splitTime = new Date();
      const options = {
        createGap: true,
        gapDuration: 900000, // 15 minutes
        firstWindowName: 'First Window',
        secondWindowName: 'Second Window'
      };
      
      const result = await splitTimeWindow(
        mockTimeWindowManager,
        'window-1',
        splitTime,
        options
      );
      
      expect(mockTimeWindowManager.splitTimeWindow).toHaveBeenCalledWith(
        'window-1',
        splitTime,
        options
      );
      
      expect(result).toEqual([
        { id: 'window-6a', sessionId: mockSessionId, startTime: expect.any(Date), endTime: expect.any(Date) },
        { id: 'window-6b', sessionId: mockSessionId, startTime: expect.any(Date), endTime: expect.any(Date) }
      ]);
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.splitTimeWindow.mockRejectedValue(new Error('Split window failed'));
      
      const result = await splitTimeWindow(
        mockTimeWindowManager,
        'window-1',
        new Date()
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('mergeTimeWindows', () => {
    it('should return null if time window manager is null', async () => {
      const result = await mergeTimeWindows(
        null,
        ['window-1', 'window-2']
      );
      expect(result).toBeNull();
    });
    
    it('should call mergeTimeWindows with correct parameters', async () => {
      const windowIds = ['window-1', 'window-2', 'window-3'];
      const options = {
        name: 'Merged Window',
        type: 'work',
        fillGaps: true
      };
      
      const result = await mergeTimeWindows(
        mockTimeWindowManager,
        windowIds,
        options
      );
      
      expect(mockTimeWindowManager.mergeTimeWindows).toHaveBeenCalledWith(
        windowIds,
        options
      );
      
      expect(result).toEqual({
        id: 'window-7',
        sessionId: mockSessionId,
        startTime: expect.any(Date),
        endTime: expect.any(Date)
      });
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.mergeTimeWindows.mockRejectedValue(new Error('Merge windows failed'));
      
      const result = await mergeTimeWindows(
        mockTimeWindowManager,
        ['window-1', 'window-2']
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('getTimeWindowInfo', () => {
    it('should return null if time window manager is null', async () => {
      const result = await getTimeWindowInfo(null, 'window-1');
      expect(result).toBeNull();
    });
    
    it('should call getTimeWindowInfo with correct parameters', async () => {
      const result = await getTimeWindowInfo(mockTimeWindowManager, 'window-8');
      
      expect(mockTimeWindowManager.getTimeWindowInfo).toHaveBeenCalledWith('window-8');
      
      expect(result).toEqual({
        window: { id: 'window-8', sessionId: mockSessionId, startTime: expect.any(Date), endTime: expect.any(Date) },
        duration: 3600000,
        previousWindow: null,
        nextWindow: null,
        associatedTasks: ['task-1', 'task-2']
      });
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.getTimeWindowInfo.mockRejectedValue(new Error('Get info failed'));
      
      const result = await getTimeWindowInfo(mockTimeWindowManager, 'window-8');
      
      expect(result).toBeNull();
    });
  });
  
  describe('findTimeWindowAtTime', () => {
    it('should return null if time window manager is null', async () => {
      const result = await findTimeWindowAtTime(
        null,
        mockSessionId,
        new Date()
      );
      expect(result).toBeNull();
    });
    
    it('should call findTimeWindowAtTime with correct parameters', async () => {
      const timestamp = new Date();
      
      const result = await findTimeWindowAtTime(
        mockTimeWindowManager,
        mockSessionId,
        timestamp
      );
      
      expect(mockTimeWindowManager.findTimeWindowAtTime).toHaveBeenCalledWith(
        mockSessionId,
        timestamp
      );
      
      expect(result).toEqual({
        id: 'window-4',
        sessionId: mockSessionId,
        startTime: expect.any(Date),
        endTime: expect.any(Date)
      });
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.findTimeWindowAtTime.mockRejectedValue(new Error('Find at time failed'));
      
      const result = await findTimeWindowAtTime(
        mockTimeWindowManager,
        mockSessionId,
        new Date()
      );
      
      expect(result).toBeNull();
    });
  });
  
  describe('getOrCreateTimeWindowForTimestamp', () => {
    it('should return null if time window manager is null', async () => {
      const result = await getOrCreateTimeWindowForTimestamp(
        null,
        mockSessionId,
        new Date()
      );
      expect(result).toBeNull();
    });
    
    it('should call getOrCreateTimeWindowForTimestamp with correct parameters', async () => {
      const timestamp = new Date();
      const options = {
        windowDuration: 1800000, // 30 minutes
        name: 'Test Window',
        type: 'focus'
      };
      
      const result = await getOrCreateTimeWindowForTimestamp(
        mockTimeWindowManager,
        mockSessionId,
        timestamp,
        options
      );
      
      expect(mockTimeWindowManager.getOrCreateTimeWindowForTimestamp).toHaveBeenCalledWith(
        mockSessionId,
        timestamp,
        options
      );
      
      expect(result).toEqual({
        id: 'window-5',
        sessionId: mockSessionId,
        startTime: expect.any(Date),
        endTime: expect.any(Date)
      });
    });
    
    it('should handle errors gracefully', async () => {
      mockTimeWindowManager.getOrCreateTimeWindowForTimestamp.mockRejectedValue(new Error('Get or create failed'));
      
      const result = await getOrCreateTimeWindowForTimestamp(
        mockTimeWindowManager,
        mockSessionId,
        new Date()
      );
      
      expect(result).toBeNull();
    });
  });
});