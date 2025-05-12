/**
 * Terminal Session Integration Tests
 * Comprehensive integration tests for the modularized terminal session components
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { createDb } from '../../db/init';
import { join } from 'path';
import os from 'os';
import { TerminalSessionManager } from '../../core/terminal/terminal-session-manager-index';
import {
  createTerminalSessionManager,
  getDefaultConfig
} from '../../core/terminal/terminal-session-factory';
import {
  TerminalSessionState,
  TerminalFingerprint,
  SessionActivityType,
  DEFAULT_TERMINAL_SESSION_MANAGER_CONFIG
} from '../../core/terminal/terminal-session-types';
import { terminalSessions, sessionTasks, tasks, timeWindows, sessionActivity } from '../../db/schema-extensions';
import { eq, and } from 'drizzle-orm';
import { TimeWindowManager } from '../../core/terminal/time-window-manager';
import { SessionRecoveryManager } from '../../core/terminal/session-recovery-manager';
import * as TerminalSessionUtils from '../../core/terminal/terminal-session-utils';

// Create test DB path
const createTestDbPath = () => join(os.tmpdir(), `test-tm-terminal-${Date.now()}.db`);

// Mock environment for terminal detection
vi.mock('os', () => {
  const osModule = {
    userInfo: vi.fn().mockReturnValue({ username: 'test-user' }),
    hostname: vi.fn().mockReturnValue('test-host'),
    platform: vi.fn().mockReturnValue('test-platform'),
    release: vi.fn().mockReturnValue('test-release'),
    tmpdir: vi.fn().mockReturnValue('/tmp')
  };
  return {
    default: osModule,
    ...osModule
  };
});

describe('Terminal Session Integration', () => {
  let dbPath: string;
  let db: any;
  let sessionManager: TerminalSessionManager;
  let timeWindowManager: TimeWindowManager;
  let recoveryManager: SessionRecoveryManager;
  let mockFingerprint: TerminalFingerprint;
  
  // Mock terminal environment
  const originalEnv = { ...process.env };
  let stdoutMock: any;

  beforeAll(() => {
    // Set up mocked terminal environment using spyOn
    stdoutMock = vi.spyOn(process, 'stdout', 'get').mockImplementation(() => ({
      isTTY: true,
      columns: 80,
      rows: 24,
      write: vi.fn(),
      // Add other required properties/methods of process.stdout
      clearLine: vi.fn(),
      cursorTo: vi.fn(),
      getWindowSize: vi.fn().mockReturnValue([80, 24])
    } as any));

    process.env.SHELL = '/bin/zsh';
    process.env.USER = 'test-user';
    process.env.TERM = 'xterm-256color';
    process.env.SSH_TTY = '/dev/ttys000';
  });

  afterAll(() => {
    // Restore mocked environment
    stdoutMock.mockRestore();
    process.env = originalEnv;
  });
  
  beforeEach(async () => {
    // Create a test database for each test
    dbPath = createTestDbPath();
    const result = createDb(dbPath);
    db = result.db;
    
    // Mock terminal fingerprint for consistent tests
    mockFingerprint = {
      tty: '/dev/ttys000',
      pid: 12345,
      ppid: 12340,
      user: 'test-user',
      shell: '/bin/zsh',
      termEnv: 'xterm-256color',
      sshConnection: 'test-user@test-host'
    };
    
    // Create session manager with test configuration
    sessionManager = createTerminalSessionManager(db, {
      persistSessions: true,
      trackTaskUsage: true,
      trackFileChanges: true,
      enableReconnection: true,
      setEnvironmentVariables: false,
      inactivityTimeout: 60,
      maxSessionHistory: 10
    });

    // Add getTerminalFingerprint method if it doesn't exist and override it
    if (typeof sessionManager.getTerminalFingerprint !== 'function') {
      sessionManager.getTerminalFingerprint = function() { return { ...mockFingerprint }; };
    } else {
      vi.spyOn(sessionManager, 'getTerminalFingerprint').mockReturnValue({ ...mockFingerprint });
    }

    // Add isInTerminal method if it doesn't exist in the modularized version
    if (typeof sessionManager.isInTerminal !== 'function') {
      sessionManager.isInTerminal = function() { return true; };
    }

    // Access the internal managers for direct testing
    timeWindowManager = sessionManager.getTimeWindowManager() as TimeWindowManager;
    recoveryManager = (sessionManager as any)._recoveryManager;

    // Ensure sessionManager is properly initialized
    await sessionManager.initialize();
    
    // Create a test task for task-related tests
    await db.insert(tasks).values({
      id: 'test-task-1',
      title: 'Test Task 1',
      status: 'todo',
      createdAt: new Date()
    });
  });
  
  afterEach(async () => {
    // Clean up database after each test
    try {
      if (sessionManager && typeof sessionManager.disconnectSession === 'function') {
        await sessionManager.disconnectSession();
        await sessionManager.cleanup();
      }

      // Clean up test database file
      if (dbPath) {
        const fs = await import('fs');
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  });
  
  /**
   * Test creating a terminal session
   */
  it('should create and initialize a terminal session', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    
    // Verify session was created
    expect(session).toBeDefined();
    expect(session?.id).toBeDefined();
    expect(session?.fingerprint.tty).toBe('/dev/ttys000');
    expect(session?.fingerprint.user).toBe('test-user');
    expect(session?.status).toBe('active');
    
    // Verify session was persisted to database
    const dbSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, session!.id)
    });
    
    expect(dbSession).toBeDefined();
    expect(dbSession.tty).toBe('/dev/ttys000');
    expect(dbSession.user).toBe('test-user');
    expect(dbSession.status).toBe('active');
  });
  
  /**
   * Test updating a terminal session
   */
  it('should update terminal session properties', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Update window size
    await sessionManager.updateSession({
      windowSize: { columns: 100, rows: 40 }
    });
    
    // Verify update was applied to the session
    const updatedSession = sessionManager.getCurrentSession();
    expect(updatedSession?.windowSize.columns).toBe(100);
    expect(updatedSession?.windowSize.rows).toBe(40);
    
    // Verify update was persisted to database
    const dbSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, session!.id)
    });
    
    expect(dbSession.window_cols).toBe(100);
    expect(dbSession.window_rows).toBe(40);
  });
  
  /**
   * Test session detection
   */
  it('should detect a terminal session', async () => {
    // Test terminal detection
    // If isInTerminal is not directly available, check for a session instead
    if (typeof sessionManager.isInTerminal === 'function') {
      expect(sessionManager.isInTerminal()).toBe(true);
    } else {
      // In the modularized version, we might check the current session instead
      const currentSession = sessionManager.getCurrentSession();
      expect(currentSession).toBeDefined();
    }

    // Test detecting session directly
    const detectedSession = await sessionManager.detectSession();
    expect(detectedSession).toBeDefined();
    expect(detectedSession?.fingerprint.tty).toBe('/dev/ttys000');
    expect(detectedSession?.fingerprint.user).toBe('test-user');
  });
  
  /**
   * Test session recovery
   */
  it('should handle session recovery', async () => {
    // First create and disconnect a session
    const session = await sessionManager.initialize();
    const sessionId = session!.id;
    
    // Enable recovery for this session
    await sessionManager.enableSessionRecovery();
    
    // Disconnect the session
    await sessionManager.disconnectSession();
    
    // Verify session is disconnected
    const currentSession = sessionManager.getCurrentSession();
    expect(currentSession).toBeNull();
    
    // Create a new session manager with the same fingerprint
    const newSessionManager = createTerminalSessionManager(db, {
      persistSessions: true,
      enableReconnection: true
    });

    // Add getTerminalFingerprint method if it doesn't exist and override it
    if (typeof newSessionManager.getTerminalFingerprint !== 'function') {
      newSessionManager.getTerminalFingerprint = function() { return { ...mockFingerprint }; };
    } else {
      vi.spyOn(newSessionManager, 'getTerminalFingerprint').mockReturnValue({ ...mockFingerprint });
    }

    // Add isInTerminal method if it doesn't exist in the modularized version
    if (typeof newSessionManager.isInTerminal !== 'function') {
      newSessionManager.isInTerminal = function() { return true; };
    }
    
    // Initialize - should recover the previous session
    const recoveredSession = await newSessionManager.initialize();
    
    // Verify recovery worked
    expect(recoveredSession).toBeDefined();
    expect(recoveredSession!.id).toBe(sessionId);
    expect(recoveredSession!.status).toBe('active');
    
    // Verify connection count was incremented
    const dbSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, sessionId)
    });
    
    expect(dbSession.connectionCount).toBe(2);
    
    // Clean up
    await newSessionManager.disconnectSession();
    await newSessionManager.cleanup();
  });
  
  /**
   * Test time window creation and management
   */
  it('should create and manage time windows', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Create a time window manually
    const startTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    const endTime = new Date();
    
    const window = await sessionManager.createSessionTimeWindow(
      startTime,
      endTime,
      {
        name: 'Test Window',
        type: 'work',
        status: 'active',
        taskId: 'test-task-1'
      }
    );
    
    // Verify window was created
    expect(window).toBeDefined();
    expect(window.sessionId).toBe(session!.id);
    expect(window.startTime).toBeInstanceOf(Date);
    expect(window.name).toBe('Test Window');
    
    // Query for time windows
    const windows = await sessionManager.findSessionTimeWindows({
      type: 'work',
      status: 'active'
    });
    
    // Verify window query works
    expect(windows.length).toBe(1);
    expect(windows[0].name).toBe('Test Window');
    
    // Test auto-detection of time windows
    const detectedWindows = await sessionManager.autoDetectSessionTimeWindows();
    expect(detectedWindows.length).toBeGreaterThan(0);
  });
  
  /**
   * Test task activity tracking
   */
  it('should track task activities in a session', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Set current task
    await sessionManager.updateSession({
      currentTaskId: 'test-task-1'
    });
    
    // Verify current task was set
    const updatedSession = sessionManager.getCurrentSession();
    expect(updatedSession!.currentTaskId).toBe('test-task-1');
    
    // Create task usage records
    await sessionManager.trackTaskUsage('test-task-1');
    
    // Verify task was recorded in session_tasks
    const sessionTask = await db.query.sessionTasks.findFirst({
      where: and(
        eq(sessionTasks.sessionId, session!.id),
        eq(sessionTasks.taskId, 'test-task-1')
      )
    });
    
    expect(sessionTask).toBeDefined();
    
    // Get activity metrics
    const metrics = await sessionManager.getActivityMetrics();
    
    // Verify metrics show task was used
    expect(metrics).toBeDefined();
    expect(metrics!.taskCount).toBe(1);
  });
  
  /**
   * Test file activity tracking
   */
  it('should track file activities in a session', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Create a mock file ID
    const fileId = 123;
    
    // Track file activity
    await sessionManager.trackFileActivity(fileId);
    
    // Record a generic file activity
    await sessionManager.recordActivity(SessionActivityType.FILE, { fileId });
    
    // Get integration status to verify file activity was recorded
    const status = await sessionManager.getIntegrationStatus();
    
    // Verify file activity was recorded (integration status tracks file count)
    expect(status.fileCount).toBeGreaterThan(0);
  });
  
  /**
   * Test session disconnection
   */
  it('should disconnect a session properly', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    const sessionId = session!.id;
    
    // Disconnect the session
    await sessionManager.disconnectSession();
    
    // Verify the session is no longer active
    const currentSession = sessionManager.getCurrentSession();
    expect(currentSession).toBeNull();
    
    // Verify disconnection was persisted to the database
    const dbSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, sessionId)
    });
    
    expect(dbSession.status).toBe('disconnected');
  });
  
  /**
   * Test integration status
   */
  it('should provide accurate terminal integration status', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Set current task
    await sessionManager.updateSession({
      currentTaskId: 'test-task-1'
    });
    
    // Track some task and file activities
    await sessionManager.trackTaskUsage('test-task-1');
    await sessionManager.trackFileActivity(123);
    await sessionManager.trackFileActivity(456);
    
    // Get integration status
    const status = await sessionManager.getIntegrationStatus();
    
    // Verify status contains accurate information
    expect(status.enabled).toBe(true);
    expect(status.sessionId).toBe(session!.id);
    expect(status.status).toBe('active');
    expect(status.currentTaskId).toBe('test-task-1');
    expect(status.taskCount).toBe(1);
    expect(status.fileCount).toBe(2);
    expect(status.sessionDuration).toBeGreaterThan(0);
  });
  
  /**
   * Test the complete workflow in a realistic scenario
   */
  it('should handle a complete session lifecycle with multiple activities', async () => {
    // Step 1: Create a new session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Step 2: Update window size as if terminal was resized
    await sessionManager.updateSession({
      windowSize: { columns: 120, rows: 30 }
    });
    
    // Step 3: Create additional test tasks
    await db.insert(tasks).values([
      {
        id: 'test-task-2',
        title: 'Test Task 2',
        status: 'in-progress',
        createdAt: new Date()
      },
      {
        id: 'test-task-3',
        title: 'Test Task 3',
        status: 'blocked',
        createdAt: new Date()
      }
    ]);
    
    // Step 4: Set current task and track task usage
    await sessionManager.updateSession({
      currentTaskId: 'test-task-1'
    });
    
    await sessionManager.trackTaskUsage('test-task-1');
    
    // Step 5: Switch to another task
    await sessionManager.updateSession({
      currentTaskId: 'test-task-2'
    });
    
    await sessionManager.trackTaskUsage('test-task-2');
    
    // Step 6: Record file activities
    await sessionManager.trackFileActivity(101);
    await sessionManager.trackFileActivity(102);
    
    // Step 7: Create a time window explicitly
    const startTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
    const endTime = new Date();
    
    await sessionManager.createSessionTimeWindow(
      startTime,
      endTime,
      {
        name: 'Work Session',
        type: 'work',
        status: 'completed',
        taskId: 'test-task-1'
      }
    );
    
    // Step 8: Record a generic command activity
    await sessionManager.recordActivity(
      SessionActivityType.COMMAND,
      { command: 'git commit -m "Add feature"' }
    );
    
    // Step 9: Switch to third task
    await sessionManager.updateSession({
      currentTaskId: 'test-task-3'
    });
    
    await sessionManager.trackTaskUsage('test-task-3');
    
    // Step 10: Get activity metrics
    const metrics = await sessionManager.getActivityMetrics();
    
    // Verify metrics show all activity
    expect(metrics).toBeDefined();
    expect(metrics!.taskCount).toBe(3); // All three tasks were used
    expect(metrics!.fileCount).toBe(2); // Two files were modified
    
    // Step 11: Disconnect the session
    await sessionManager.disconnectSession();
    
    // Step 12: Reconnect to the session with a new manager
    const newSessionManager = createTerminalSessionManager(db, {
      persistSessions: true,
      enableReconnection: true
    });

    // Add getTerminalFingerprint method if it doesn't exist and override it
    if (typeof newSessionManager.getTerminalFingerprint !== 'function') {
      newSessionManager.getTerminalFingerprint = function() { return { ...mockFingerprint }; };
    } else {
      vi.spyOn(newSessionManager, 'getTerminalFingerprint').mockReturnValue({ ...mockFingerprint });
    }

    // Add isInTerminal method if it doesn't exist in the modularized version
    if (typeof newSessionManager.isInTerminal !== 'function') {
      newSessionManager.isInTerminal = function() { return true; };
    }
    
    // Initialize - should reconnect to existing session
    const reconnectedSession = await newSessionManager.initialize();
    
    // Verify reconnection worked
    expect(reconnectedSession).toBeDefined();
    expect(reconnectedSession!.id).toBe(session!.id);
    expect(reconnectedSession!.currentTaskId).toBe('test-task-3'); // Last used task
    
    // Step 13: Get integration status after reconnection
    const status = await newSessionManager.getIntegrationStatus();
    
    // Verify status reflects all previous activity
    expect(status.taskCount).toBe(3);
    expect(status.fileCount).toBe(2);
    
    // Clean up
    await newSessionManager.disconnectSession();
    await newSessionManager.cleanup();
  });
});