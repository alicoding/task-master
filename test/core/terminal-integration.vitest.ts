/**
 * Terminal Integration Tests
 * Tests for Task 17.7: Terminal Integration
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { TerminalSessionManager, TerminalFingerprint } from '../../core/terminal/terminal-session-manager-index.ts';
import { TerminalStatusIndicator, TaskIndicatorData } from '../../core/terminal/terminal-status-indicator.ts';
import { initializeTestDB } from '../utils/test-helpers.ts';
import { terminalSessions, sessionTasks, tasks } from '../../db/schema-extensions.ts';
import { eq, and } from 'drizzle-orm';

// Mock environment variables and terminal detection
vi.mock('os', () => ({
  userInfo: () => ({ username: 'test-user' })
}));

// Mock environment for terminal detection
const originalStdout = { ...process.stdout };
const originalEnv = { ...process.env };

describe('Terminal Session Manager', () => {
  let db: any;
  let sessionManager: TerminalSessionManager;
  
  beforeAll(async () => {
    // Set up the test database
    db = await initializeTestDB();
    
    // Mock terminal environment
    process.stdout.isTTY = true;
    process.stdout.columns = 80;
    process.stdout.rows = 24;
    
    process.env.SHELL = '/bin/zsh';
    process.env.USER = 'test-user';
    process.env.TERM = 'xterm-256color';
  });
  
  afterAll(() => {
    // Restore mocked environment
    process.stdout = originalStdout;
    process.env = originalEnv;
  });
  
  beforeEach(() => {
    // Create a new session manager with test configuration
    sessionManager = new TerminalSessionManager(db, {
      persistSessions: true,
      trackTaskUsage: true,
      trackFileChanges: true,
      enableReconnection: true,
      setEnvironmentVariables: false,
      inactivityTimeout: 60,
      maxSessionHistory: 5
    });
    
    // Mock terminal fingerprint getter
    sessionManager.getTerminalFingerprint = vi.fn(() => {
      return {
        tty: '/dev/ttys000',
        pid: 12345,
        ppid: 12340,
        user: 'test-user',
        shell: '/bin/zsh',
        termEnv: 'xterm-256color'
      } as TerminalFingerprint;
    });
  });
  
  afterEach(async () => {
    // Clean up - remove all test sessions
    await db.delete(sessionTasks);
    await db.delete(terminalSessions);
    
    // Disconnect any active sessions
    await sessionManager.disconnectSession();
  });
  
  it('should detect and create a new terminal session', async () => {
    // Check that isInTerminal returns true with our mocked setup
    expect(sessionManager.isInTerminal()).toBe(true);
    
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
  
  it('should reconnect to an existing session', async () => {
    // First create a session
    const session1 = await sessionManager.initialize();
    const sessionId = session1!.id;
    
    // Disconnect it
    await sessionManager.disconnectSession();
    
    // Create a new session manager
    const sessionManager2 = new TerminalSessionManager(db, {
      persistSessions: true,
      trackTaskUsage: true,
      enableReconnection: true,
      setEnvironmentVariables: false
    });
    
    // Use the same terminal fingerprint
    sessionManager2.getTerminalFingerprint = vi.fn(() => {
      return {
        tty: '/dev/ttys000',
        pid: 12345,
        ppid: 12340,
        user: 'test-user',
        shell: '/bin/zsh',
        termEnv: 'xterm-256color'
      } as TerminalFingerprint;
    });
    
    // Initialize - should reconnect
    const session2 = await sessionManager2.initialize();
    
    // Verify it reconnected to the same session
    expect(session2).toBeDefined();
    expect(session2!.id).toBe(sessionId);
    expect(session2!.fingerprint.tty).toBe('/dev/ttys000');
    expect(session2!.status).toBe('active');
    
    // Verify connection count was incremented
    const dbSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, sessionId)
    });
    
    expect(dbSession.connectionCount).toBe(2);
  });
  
  it('should track current task in session', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Create a test task
    const taskId = 'test-task-1';
    await db.insert(tasks).values({
      id: taskId,
      title: 'Test Task 1',
      status: 'todo',
      createdAt: new Date()
    });
    
    // Set current task
    await sessionManager.updateSession({
      currentTaskId: taskId
    });
    
    // Verify current task was set
    const updatedSession = sessionManager.getCurrentSession();
    expect(updatedSession!.currentTaskId).toBe(taskId);
    
    // Verify task was recorded in session_tasks
    const sessionTask = await db.query.sessionTasks.findFirst({
      where: and(
        eq(sessionTasks.sessionId, session!.id),
        eq(sessionTasks.taskId, taskId)
      )
    });
    
    expect(sessionTask).toBeDefined();
  });
  
  it('should get integration status with task stats', async () => {
    // Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    
    // Create test tasks
    const taskIds = ['test-task-1', 'test-task-2', 'test-task-3'];
    for (let i = 0; i < taskIds.length; i++) {
      await db.insert(tasks).values({
        id: taskIds[i],
        title: `Test Task ${i+1}`,
        status: 'todo',
        createdAt: new Date()
      });
      
      // Record task usage
      await sessionManager.recordTaskUsage(taskIds[i]);
    }
    
    // Set current task to the first one
    await sessionManager.updateSession({
      currentTaskId: taskIds[0]
    });
    
    // Get integration status
    const status = await sessionManager.getIntegrationStatus();
    
    // Verify status contains correct data
    expect(status.enabled).toBe(true);
    expect(status.sessionId).toBe(session!.id);
    expect(status.status).toBe('active');
    expect(status.currentTaskId).toBe(taskIds[0]);
    expect(status.taskCount).toBe(3);
  });
});

describe('Terminal Status Indicator', () => {
  it('should generate a simple status indicator', () => {
    const statusIndicator = new TerminalStatusIndicator({
      format: 'simple',
      useColors: false,
      shellType: 'bash',
      showTaskIds: true
    });
    
    const session = {
      id: 'test-session',
      fingerprint: {
        tty: '/dev/ttys000',
        user: 'test-user',
        shell: '/bin/bash'
      },
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      lastActive: new Date(),
      status: 'active',
      active: true
    } as any;
    
    const task = {
      id: 'task-123',
      title: 'Test Task',
      status: 'in-progress'
    };
    
    const indicator = statusIndicator.generateStatusIndicator(session, task);
    
    expect(indicator).toContain('◉');
    expect(indicator).toContain(task.id);
  });
  
  it('should generate a detailed status indicator', () => {
    const statusIndicator = new TerminalStatusIndicator({
      format: 'detailed',
      useColors: false,
      shellType: 'bash',
      showTaskIds: true,
      showDuration: true
    });
    
    const session = {
      id: 'test-session',
      fingerprint: {
        tty: '/dev/ttys000',
        user: 'test-user',
        shell: '/bin/bash'
      },
      startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      lastActive: new Date(),
      status: 'active',
      active: true
    } as any;
    
    const task = {
      id: 'task-123',
      title: 'Test Task with a very long name that should be truncated',
      status: 'in-progress'
    };
    
    const stats = {
      taskCount: 3,
      fileCount: 5,
      duration: 60 * 60 * 1000 // 1 hour
    };
    
    const indicator = statusIndicator.generateStatusIndicator(session, task, stats);
    
    expect(indicator).toContain('◉');
    expect(indicator).toContain(task.id);
    expect(indicator).toContain('Test Task with a very');
    expect(indicator).toContain('1h');
  });
  
  it('should generate shell integration scripts', () => {
    const statusIndicator = new TerminalStatusIndicator({
      shellType: 'bash',
      useColors: true,
      format: 'simple'
    });
    
    const bashScript = statusIndicator.generateShellIntegrationScript();
    
    expect(bashScript).toContain('Task Master Terminal Integration for Bash');
    expect(bashScript).toContain('PROMPT_COMMAND');
    
    // Change shell type and regenerate
    statusIndicator.config.shellType = 'zsh';
    const zshScript = statusIndicator.generateShellIntegrationScript();
    
    expect(zshScript).toContain('Task Master Terminal Integration for Zsh');
    expect(zshScript).toContain('add-zsh-hook');
  });
  
  it('should format indicators for different shells', () => {
    // Test Bash formatting
    const bashIndicator = new TerminalStatusIndicator({
      shellType: 'bash',
      useColors: true
    });
    
    const session = {
      id: 'test-session',
      fingerprint: { tty: '/dev/ttys000', user: 'test-user' },
      startTime: new Date(),
      lastActive: new Date(),
      status: 'active',
      active: true
    } as any;
    
    const bashOutput = bashIndicator.generateStatusIndicator(session);
    
    // Check for bash color escaping with \[ and \]
    expect(bashOutput).toMatch(/\\\\\\[.*\\\\\\]/);
    
    // Test ZSH formatting
    const zshIndicator = new TerminalStatusIndicator({
      shellType: 'zsh',
      useColors: true
    });
    
    const zshOutput = zshIndicator.generateStatusIndicator(session);
    
    // Check for zsh color escaping with %{ and %}
    expect(zshOutput).toMatch(/%\{.*%\}/);
  });
});