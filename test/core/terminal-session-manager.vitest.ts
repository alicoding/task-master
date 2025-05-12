/**
 * Tests for modularized Terminal Session Manager
 * Tests Task 17.8.9: Modularize terminal-session-manager.ts
 *
 * These tests verify that the modularized terminal session manager
 * maintains the same behavior as before the modularization.
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { TerminalSessionManager } from '../../core/terminal/terminal-session-manager.ts';
import { createTerminalSessionManager } from '../../core/terminal/terminal-session-factory.ts';
import { TimeWindowManager } from '../../core/terminal/time-window-manager.ts';
import * as utils from '../../core/terminal/terminal-session-utils.ts';
import { v4 as uuidv4 } from 'uuid';

// Import test utilities
import {
  initializeTerminalTestDB,
  cleanupTestDB,
  mockTerminalDetection,
  createTestDbPath
} from '../utils/terminal-session-test-utils.ts';

describe('Terminal Session Manager (Modularized)', () => {
  let dbPath: string;
  let db: any;
  let sessionManager: TerminalSessionManager;
  const originalIsTTY = process.stdout.isTTY;
  
  beforeEach(async () => {
    // Create a test database using the utility
    dbPath = createTestDbPath();
    const testDb = initializeTerminalTestDB(false, dbPath);
    db = testDb.db;

    // Mock process object to prevent real process event listeners
    vi.spyOn(process, 'on').mockImplementation(() => process);

    // Use the test utility to mock terminal detection
    const terminalMock = mockTerminalDetection({
      tty: '/dev/test',
      pid: 12345,
      user: 'test-user',
      shell: 'bash'
    });
    
    // Mock the terminal detection functions
    vi.spyOn(utils, 'getTerminalFingerprint').mockImplementation(terminalMock.getTerminalFingerprint);
    
    // Mock stdout.isTTY for terminal detection
    Object.defineProperty(process.stdout, 'isTTY', {
      get: () => true,
      configurable: true
    });

    // Create session manager using the factory to ensure proper initialization
    sessionManager = createTerminalSessionManager(db, {
      enableReconnection: true,
      trackTaskUsage: true,
      persistSessions: true
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    // Clean up resources with safety check
    if (sessionManager && typeof sessionManager.cleanup === 'function') {
      await sessionManager.cleanup().catch(error => {
        console.error('Error cleaning up session manager:', error);
      });
    }

    // Clean up test database using the utility
    cleanupTestDB(dbPath);
  });

  afterAll(() => {
    // Restore the original isTTY value
    Object.defineProperty(process.stdout, 'isTTY', {
      get: () => originalIsTTY,
      configurable: true
    });
  });
  
  it('should initialize correctly', () => {
    expect(sessionManager).toBeDefined();
    expect(sessionManager.getConfigManager()).toBeDefined();
  });
  
  it('should create a session on initialization', async () => {
    const session = await sessionManager.initialize();
    
    expect(session).toBeDefined();
    expect(session?.id).toBeDefined();
    expect(session?.fingerprint.tty).toBe('/dev/test');
    expect(session?.status).toBe('active');
  });
  
  it('should update a session', async () => {
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Listen for update event
    const updateSpy = vi.fn();
    sessionManager.on('session:updated', updateSpy);
    
    // Update session
    await sessionManager.updateSession({
      currentTaskId: 'task-123',
      status: 'inactive'
    });
    
    // Get current session
    const currentSession = sessionManager.getCurrentSession();
    
    expect(currentSession).toBeDefined();
    expect(currentSession?.currentTaskId).toBe('task-123');
    expect(currentSession?.status).toBe('inactive');
    expect(updateSpy).toHaveBeenCalled();
  });
  
  it('should disconnect a session', async () => {
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Listen for disconnect event
    const disconnectSpy = vi.fn();
    sessionManager.on('session:disconnected', disconnectSpy);
    
    // Disconnect session
    await sessionManager.disconnectSession();
    
    // Get current session
    const currentSession = sessionManager.getCurrentSession();
    
    expect(currentSession).toBeNull();
    expect(disconnectSpy).toHaveBeenCalled();
  });
  
  it('should get integration status', async () => {
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Get integration status
    const status = await sessionManager.getIntegrationStatus();
    
    expect(status).toBeDefined();
    expect(status.enabled).toBe(true);
    expect(status.sessionId).toBe(session?.id);
    expect(status.tty).toBe('/dev/test');
    expect(status.status).toBe('active');
  });
  
  it('should access the time window manager', async () => {
    await sessionManager.initialize();
    
    // Get time window manager
    const timeWindowManager = sessionManager.getTimeWindowManager();
    
    expect(timeWindowManager).toBeDefined();
    expect(timeWindowManager).toBeInstanceOf(TimeWindowManager);
  });
  
  it('should create a time window for a task', async () => {
    await sessionManager.initialize();
    
    // Update session with a task
    await sessionManager.updateSession({
      currentTaskId: 'task-123'
    });
    
    // Get time window manager
    const timeWindowManager = sessionManager.getTimeWindowManager();
    
    // Mock createTaskActivityWindow
    const createWindowSpy = vi.spyOn(timeWindowManager!, 'createTimeWindow');
    
    // Find time windows
    const windows = await sessionManager.findSessionTimeWindows();
    
    expect(windows.length).toBeGreaterThan(0);
    expect(createWindowSpy).toHaveBeenCalled();
  });

  it('should track task usage', async () => {
    await sessionManager.initialize();
    
    // Track task usage
    await sessionManager.trackTaskUsage('task-123');
    
    // Get current session
    const currentSession = sessionManager.getCurrentSession();
    
    expect(currentSession).toBeDefined();
    expect(currentSession?.currentTaskId).toBe('task-123');
  });

  it('should record activity', async () => {
    await sessionManager.initialize();
    
    // Record an activity
    await sessionManager.recordActivity('command', { 
      command: 'test-command',
      args: ['--test']
    });
    
    // Get activity metrics
    const metrics = await sessionManager.getActivityMetrics();
    
    expect(metrics).toBeDefined();
  });

  it('should handle session recovery properly', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Enable session recovery
    const recoveryEnabled = await sessionManager.enableSessionRecovery();
    expect(recoveryEnabled).toBe(true);
    
    // Disconnect session to simulate a terminal closure
    await sessionManager.disconnectSession();
    
    // Try to recover the session
    const recoveredSession = await sessionManager.tryRecoverSession({
      tty: '/dev/test',
      pid: 12345,
      ppid: 12344,
      user: 'test-user',
      shell: 'bash',
      termEnv: 'xterm'
    });
    
    expect(recoveredSession).toBeDefined();
    expect(recoveredSession?.id).toBe(session?.id);
  });

  it('should create and auto-detect time windows', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Create a time window explicitly
    const now = new Date();
    const startTime = new Date(now.getTime() - 3600000); // 1 hour ago
    const endTime = new Date(now.getTime() - 1800000);   // 30 minutes ago
    
    const window = await sessionManager.createSessionTimeWindow(startTime, endTime, {
      name: 'Test Window',
      type: 'work'
    });
    
    expect(window).toBeDefined();
    expect(window.name).toBe('Test Window');
    
    // Auto-detect time windows
    const detectedWindows = await sessionManager.autoDetectSessionTimeWindows();
    
    // At least one window should be detected (the one we created)
    expect(detectedWindows.length).toBeGreaterThan(0);
  });
});