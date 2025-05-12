/**
 * Tests for Terminal Session State Handler Module
 * Tests for terminal-session-state-handler.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import {
  initializeSessionDetection,
  detectSession,
  setupEnvironmentVariables,
  updateSession,
  disconnectCurrentSession,
  getSessionIntegrationStatus,
  tryRecoverSession,
  enableSessionRecovery,
  findTimeWindowsForSession,
  createTimeWindowForSession,
  autoDetectTimeWindowsForSession
} from '../../core/terminal/terminal-session-state-handler.ts';
import { TerminalSessionState } from '../../core/terminal/terminal-session-types.ts';
import { createDb } from '../../db/init.ts';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import fs from 'fs';
import os from 'os';

// Create test DB path
const createTestDbPath = () => join(os.tmpdir(), `test-tm-${Date.now()}.db`);

// Mock dependencies
vi.mock('../../core/terminal/terminal-session-utils.ts', () => ({
  setEnvironmentVariables: vi.fn().mockReturnValue({ TM_SESSION_ID: 'test-session' })
}));

vi.mock('../../core/terminal/terminal-session-index.ts', () => ({
  disconnectSession: vi.fn().mockResolvedValue({}),
  recordTaskUsage: vi.fn().mockResolvedValue({})
}));

vi.mock('../../core/terminal/terminal-session-initialization.ts', () => ({
  detectTerminalSession: vi.fn(),
  checkSessionInactivity: vi.fn()
}));

vi.mock('../../core/terminal/terminal-session-status.ts', () => ({
  getIntegrationStatus: vi.fn().mockResolvedValue({
    enabled: true,
    sessionId: 'test-session',
    tty: '/dev/test',
    status: 'active'
  })
}));

vi.mock('../../core/terminal/terminal-session-time-windows.ts', () => ({
  createTaskActivityWindow: vi.fn().mockResolvedValue({ id: 'window-1' }),
  findSessionTimeWindows: vi.fn().mockResolvedValue([{ id: 'window-1' }]),
  createSessionTimeWindow: vi.fn().mockResolvedValue({ id: 'window-2' }),
  autoDetectSessionTimeWindows: vi.fn().mockResolvedValue([{ id: 'window-3' }])
}));

vi.mock('../../core/terminal/terminal-session-recovery.ts', () => ({
  tryRecoverSession: vi.fn().mockResolvedValue(null),
  enableSessionRecovery: vi.fn().mockResolvedValue(true)
}));

vi.mock('../../core/terminal/terminal-session-event-handler.ts', () => ({
  emitSessionDetected: vi.fn(),
  emitSessionUpdated: vi.fn(),
  emitSessionDisconnected: vi.fn(),
  emitSessionRecoveryEnabled: vi.fn()
}));

// Import mocked modules
import { detectTerminalSession } from '../../core/terminal/terminal-session-initialization.ts';
import { setEnvironmentVariables } from '../../core/terminal/terminal-session-utils.ts';
import { disconnectSession, recordTaskUsage } from '../../core/terminal/terminal-session-index.ts';
import { getIntegrationStatus } from '../../core/terminal/terminal-session-status.ts';
import { 
  createTaskActivityWindow, 
  findSessionTimeWindows,
  createSessionTimeWindow,
  autoDetectSessionTimeWindows
} from '../../core/terminal/terminal-session-time-windows.ts';
import { 
  tryRecoverSession as attemptRecovery,
  enableSessionRecovery as enableRecovery
} from '../../core/terminal/terminal-session-recovery.ts';
import {
  emitSessionDetected,
  emitSessionUpdated,
  emitSessionDisconnected,
  emitSessionRecoveryEnabled
} from '../../core/terminal/terminal-session-event-handler.ts';

describe('Terminal Session State Handler', () => {
  let dbPath: string;
  let db: any;
  let manager: EventEmitter;
  let mockSession: TerminalSessionState;
  let mockRecoveryManager: any;
  let mockTimeWindowManager: any;
  
  beforeEach(() => {
    // Create a test database
    dbPath = createTestDbPath();
    const result = createDb(dbPath);
    db = result.db;
    
    // Create event emitter
    manager = new EventEmitter();
    
    // Create a mock session
    mockSession = {
      id: uuidv4(),
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
    
    // Create mock managers
    mockRecoveryManager = {
      initialize: vi.fn().mockResolvedValue(true),
      tryRecover: vi.fn().mockResolvedValue(null),
      enableRecovery: vi.fn().mockResolvedValue(true),
      on: vi.fn()
    };
    
    mockTimeWindowManager = {
      createTimeWindow: vi.fn().mockResolvedValue({ id: 'window-1' }),
      findTimeWindows: vi.fn().mockResolvedValue([{ id: 'window-1' }]),
      detectTimeWindows: vi.fn().mockResolvedValue([{ id: 'window-3' }])
    };
    
    // Reset mocks
    (detectTerminalSession as any).mockReset();
    (detectTerminalSession as any).mockResolvedValue(mockSession);
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
  
  describe('initializeSessionDetection', () => {
    it('should return current session if it exists', async () => {
      const result = await initializeSessionDetection(
        manager,
        db,
        true,
        true,
        mockRecoveryManager,
        mockSession,  // Current session already exists
        false,
        vi.fn()
      );
      
      expect(result).toBe(mockSession);
    });
    
    it('should wait for detection to complete if already detecting', async () => {
      // Create a promise to control when the session is detected
      let resolveDetection: Function;
      const detectionPromise = new Promise<void>(resolve => {
        resolveDetection = resolve;
      });
      
      // Track the session for the test
      let testSession = null;

      // Set up the detection in progress
      const updateDetectingSession = vi.fn();

      // Start initializeSessionDetection, which should wait for detection
      const resultPromise = initializeSessionDetection(
        manager,
        db,
        true,
        true,
        mockRecoveryManager,
        null,  // No current session
        true,  // Already detecting
        updateDetectingSession
      );
      
      // Simulate session detection completion asynchronously
      setTimeout(async () => {
        // Update the mockSession outside of the initializeSession function
        testSession = { id: 'test-session' };
        // We need to pass the mocked session to the event listeners that are waiting
        (mockSession as any) = testSession;
        manager.emit('session:detected');
        resolveDetection();
      }, 10);

      // Wait for initialization to complete
      await detectionPromise;
      const result = await resultPromise;

      expect(result).toBe(mockSession);
    });

    it('should detect a new session when none exists', async () => {
      (detectTerminalSession as any).mockResolvedValue(mockSession);

      const updateDetectingSession = vi.fn();

      const result = await initializeSessionDetection(
        manager,
        db,
        true,
        true,
        mockRecoveryManager,
        null,  // No current session
        false, // Not already detecting
        updateDetectingSession
      );

      expect(result).toBe(mockSession);
      expect(updateDetectingSession).toHaveBeenCalledWith(true);
      expect(updateDetectingSession).toHaveBeenCalledWith(false);
    });

    it('should handle errors gracefully', async () => {
      (detectTerminalSession as any).mockRejectedValue(new Error('Detection failed'));

      const updateDetectingSession = vi.fn();

      const result = await initializeSessionDetection(
        manager,
        db,
        true,
        true,
        mockRecoveryManager,
        null,
        false,
        updateDetectingSession
      );

      expect(result).toBeNull();
      expect(updateDetectingSession).toHaveBeenCalledWith(false);
    });
  });
  
  describe('detectSession', () => {
    it('should detect a terminal session successfully', async () => {
      (detectTerminalSession as any).mockResolvedValue(mockSession);

      const result = await detectSession(
        db,
        true,
        true,
        mockRecoveryManager
      );

      expect(result).toBe(mockSession);
      expect(detectTerminalSession).toHaveBeenCalledWith(
        db,
        true,
        true,
        mockRecoveryManager
      );
    });

    it('should handle errors gracefully', async () => {
      (detectTerminalSession as any).mockRejectedValue(new Error('Detection failed'));

      const result = await detectSession(
        db,
        true,
        true,
        mockRecoveryManager
      );

      expect(result).toBeNull();
    });
  });
  
  describe('setupEnvironmentVariables', () => {
    it('should call setEnvironmentVariables with the session', () => {
      const result = setupEnvironmentVariables(mockSession);

      expect(setEnvironmentVariables).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual({ TM_SESSION_ID: 'test-session' });
    });
  });

  describe('updateSession', () => {
    it('should update session with provided values', async () => {
      const updates = {
        currentTaskId: 'task-123',
        status: 'inactive',
        windowSize: { columns: 100, rows: 50 }
      };

      await updateSession(
        manager,
        db,
        mockSession,
        updates,
        true,  // persistSessions
        true,  // trackTaskUsage
        mockTimeWindowManager
      );

      // Check that session was updated
      expect(mockSession.currentTaskId).toBe('task-123');
      expect(mockSession.status).toBe('inactive');
      expect(mockSession.windowSize).toEqual({ columns: 100, rows: 50 });
      expect(mockSession.lastActive).toBeInstanceOf(Date);

      // Check that database update was called
      expect(emitSessionUpdated).toHaveBeenCalledWith(manager, mockSession);
      expect(recordTaskUsage).toHaveBeenCalledWith(db, mockSession.id, 'task-123');
      expect(createTaskActivityWindow).toHaveBeenCalledWith(
        mockTimeWindowManager,
        mockSession.id,
        'task-123',
        expect.any(Date)
      );
    });

    it('should do nothing if no current session exists', async () => {
      await updateSession(
        manager,
        db,
        null as any,
        { status: 'inactive' },
        true,
        true,
        mockTimeWindowManager
      );

      expect(emitSessionUpdated).not.toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', async () => {
      // Mock db.update to throw an error
      vi.spyOn(db, 'update').mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Should not throw
      await expect(updateSession(
        manager,
        db,
        mockSession,
        { status: 'inactive' },
        true,
        true,
        mockTimeWindowManager
      )).resolves.not.toThrow();
    });
  });
  
  describe('disconnectCurrentSession', () => {
    it('should disconnect the current session', async () => {
      const clearSession = vi.fn();
      const inactivityTimer = setInterval(() => {}, 1000) as unknown as NodeJS.Timeout;
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      await disconnectCurrentSession(
        manager,
        db,
        mockSession,
        true,  // persistSessions
        inactivityTimer,
        clearSession
      );

      // Check session state updates
      expect(mockSession.status).toBe('disconnected');
      expect(mockSession.lastActive).toBeInstanceOf(Date);

      // Check that timer was cleared
      expect(clearIntervalSpy).toHaveBeenCalledWith(inactivityTimer);

      // Check that database was updated
      expect(disconnectSession).toHaveBeenCalledWith(db, mockSession.id);

      // Check that event was emitted and session was cleared
      expect(emitSessionDisconnected).toHaveBeenCalledWith(manager, mockSession);
      expect(clearSession).toHaveBeenCalled();
    });

    it('should do nothing if no current session exists', async () => {
      const clearSession = vi.fn();

      await disconnectCurrentSession(
        manager,
        db,
        null as any,
        true,
        null,
        clearSession
      );

      expect(emitSessionDisconnected).not.toHaveBeenCalled();
      expect(clearSession).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (disconnectSession as any).mockRejectedValue(new Error('Disconnect failed'));

      const clearSession = vi.fn();

      // Should not throw
      await expect(disconnectCurrentSession(
        manager,
        db,
        mockSession,
        true,
        null,
        clearSession
      )).resolves.not.toThrow();
    });
  });
  
  describe('getSessionIntegrationStatus', () => {
    it('should call getIntegrationStatus with the correct parameters', async () => {
      const result = await getSessionIntegrationStatus(
        db,
        mockSession,
        true,  // trackTaskUsage
        true,  // trackFileChanges
        true,  // persistSessions
        true   // recoveryEnabled
      );

      expect(getIntegrationStatus).toHaveBeenCalledWith(
        db,
        mockSession,
        true,
        true,
        true,
        true
      );

      expect(result).toEqual({
        enabled: true,
        sessionId: 'test-session',
        tty: '/dev/test',
        status: 'active'
      });
    });
  });

  describe('tryRecoverSession', () => {
    it('should return null if recovery manager is not provided', async () => {
      const result = await tryRecoverSession(null);
      expect(result).toBeNull();
    });

    it('should call attemptRecovery with the fingerprint', async () => {
      (attemptRecovery as any).mockResolvedValue(mockSession);

      const fingerprint = { tty: '/dev/test' };
      const result = await tryRecoverSession(mockRecoveryManager, fingerprint);

      expect(attemptRecovery).toHaveBeenCalledWith(mockRecoveryManager, fingerprint);
      expect(result).toBe(mockSession);
    });
  });

  describe('enableSessionRecovery', () => {
    it('should return false if recovery manager is not provided', async () => {
      const result = await enableSessionRecovery(
        manager,
        db,
        null,
        'test-session'
      );

      expect(result).toBe(false);
    });

    it('should enable session recovery and emit event on success', async () => {
      (enableRecovery as any).mockResolvedValue(true);

      const result = await enableSessionRecovery(
        manager,
        db,
        mockRecoveryManager,
        'test-session'
      );

      expect(enableRecovery).toHaveBeenCalledWith(
        db,
        mockRecoveryManager,
        'test-session'
      );

      expect(result).toBe(true);
      expect(emitSessionRecoveryEnabled).toHaveBeenCalledWith(manager, 'test-session');
    });

    it('should not emit event if enableRecovery returns false', async () => {
      (enableRecovery as any).mockResolvedValue(false);

      const result = await enableSessionRecovery(
        manager,
        db,
        mockRecoveryManager,
        'test-session'
      );

      expect(result).toBe(false);
      expect(emitSessionRecoveryEnabled).not.toHaveBeenCalled();
    });
  });
  
  describe('Time window functions', () => {
    it('findTimeWindowsForSession should return empty array if time window manager is not provided', async () => {
      const result = await findTimeWindowsForSession(null, 'test-session');
      expect(result).toEqual([]);
    });

    it('findTimeWindowsForSession should call findSessionTimeWindows with correct parameters', async () => {
      const options = {
        type: 'task',
        status: 'active',
        taskId: 'task-123'
      };

      const result = await findTimeWindowsForSession(
        mockTimeWindowManager,
        'test-session',
        options
      );

      expect(findSessionTimeWindows).toHaveBeenCalledWith(
        mockTimeWindowManager,
        'test-session',
        options
      );

      expect(result).toEqual([{ id: 'window-1' }]);
    });

    it('createTimeWindowForSession should return null if time window manager is not provided', async () => {
      const result = await createTimeWindowForSession(
        null,
        'test-session',
        new Date(),
        new Date()
      );

      expect(result).toBeNull();
    });

    it('createTimeWindowForSession should call createSessionTimeWindow with correct parameters', async () => {
      const startTime = new Date(Date.now() - 3600000);
      const endTime = new Date();
      const options = {
        name: 'Test Window',
        type: 'manual',
        status: 'completed'
      };

      const result = await createTimeWindowForSession(
        mockTimeWindowManager,
        'test-session',
        startTime,
        endTime,
        options
      );

      expect(createSessionTimeWindow).toHaveBeenCalledWith(
        mockTimeWindowManager,
        'test-session',
        startTime,
        endTime,
        options
      );

      expect(result).toEqual({ id: 'window-2' });
    });

    it('autoDetectTimeWindowsForSession should return empty array if time window manager is not provided', async () => {
      const result = await autoDetectTimeWindowsForSession(null, 'test-session');
      expect(result).toEqual([]);
    });

    it('autoDetectTimeWindowsForSession should call autoDetectSessionTimeWindows with correct parameters', async () => {
      const result = await autoDetectTimeWindowsForSession(
        mockTimeWindowManager,
        'test-session'
      );

      expect(autoDetectSessionTimeWindows).toHaveBeenCalledWith(
        mockTimeWindowManager,
        'test-session'
      );

      expect(result).toEqual([{ id: 'window-3' }]);
    });
  });
});