/**
 * Terminal Integration End-to-End Tests
 * Integration testing for Task 17.7: Terminal Integration
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { TerminalSessionManager } from '../../core/terminal/terminal-session-manager-index.ts';
import { TerminalStatusIndicator } from '../../core/terminal/terminal-status-indicator.ts';
import { initializeTestDB } from '../utils/test-helpers.ts';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { terminalSessions, sessionTasks, fileSessionMapping, tasks, files, taskFiles } from '../../db/schema-extensions.ts';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Mock environment
vi.mock('os', () => ({
  userInfo: () => ({ username: 'test-user' }),
  homedir: () => '/home/test-user',
  platform: () => 'linux'
}));

// Mock TTY detection
vi.mock('tty', () => ({
  isatty: () => true
}));

// Mock process.stdout and process.env
const originalStdout = { ...process.stdout };
const originalEnv = { ...process.env };
const mockStdout = {
  ...originalStdout,
  isTTY: true,
  columns: 100,
  rows: 30
};

describe('Terminal Integration E2E Tests', () => {
  let db: BetterSQLite3Database;
  let sessionManager: TerminalSessionManager;
  let statusIndicator: TerminalStatusIndicator;
  let tempTestDir: string;
  let testFilePath: string;
  
  beforeAll(async () => {
    // Set up test database
    db = await initializeTestDB();
    
    // Mock terminal environment
    process.stdout = Object.assign(process.stdout, mockStdout);
    process.env = {
      ...process.env,
      SHELL: '/bin/bash',
      USER: 'test-user',
      TERM: 'xterm-256color',
      HOME: '/home/test-user'
    };
    
    // Create temporary test directory and file
    tempTestDir = path.join(os.tmpdir(), `tm-test-${Date.now()}`);
    fs.mkdirSync(tempTestDir, { recursive: true });
    testFilePath = path.join(tempTestDir, 'test-file.ts');
    fs.writeFileSync(testFilePath, 'console.log("Test file for terminal integration");');
  });
  
  afterAll(() => {
    // Clean up
    process.stdout = originalStdout;
    process.env = originalEnv;
    
    // Remove test directory
    try {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up test directory:', error);
    }
  });
  
  beforeEach(async () => {
    // Clear test database tables
    await db.delete(fileSessionMapping);
    await db.delete(sessionTasks);
    await db.delete(terminalSessions);
    await db.delete(taskFiles);
    await db.delete(files);
    await db.delete(tasks);
    
    // Create session manager with test config
    sessionManager = new TerminalSessionManager(db, {
      persistSessions: true,
      trackTaskUsage: true,
      trackFileChanges: true,
      enableReconnection: true,
      setEnvironmentVariables: false,
      inactivityTimeout: 5,
      maxSessionHistory: 5
    });
    
    // Override terminal fingerprint for consistent testing
    sessionManager.getTerminalFingerprint = vi.fn(() => {
      return {
        tty: '/dev/test-tty',
        pid: 12345,
        ppid: 12340,
        user: 'test-user',
        shell: '/bin/bash',
        termEnv: 'xterm-256color'
      } as any;
    });
    
    // Create status indicator
    statusIndicator = new TerminalStatusIndicator({
      format: 'simple',
      useColors: false,
      shellType: 'bash'
    });
    
    // Create test tasks
    const testTasks = [
      { id: 'test-1', title: 'Test Task 1', status: 'todo', createdAt: new Date() },
      { id: 'test-2', title: 'Test Task 2', status: 'in-progress', createdAt: new Date() },
      { id: 'test-3', title: 'Test Task 3', status: 'done', createdAt: new Date() }
    ];
    
    for (const task of testTasks) {
      await db.insert(tasks).values(task);
    }
  });
  
  afterEach(async () => {
    // Disconnect any active sessions
    await sessionManager.disconnectSession();
  });
  
  it('should track a complete task workflow with terminal integration', async () => {
    // Step 1: Initialize session
    const session = await sessionManager.initialize();
    expect(session).toBeDefined();
    expect(session?.id).toBeDefined();
    expect(session?.status).toBe('active');
    
    // Step 2: Set current task
    await sessionManager.updateSession({
      currentTaskId: 'test-2'
    });
    
    const updatedSession = sessionManager.getCurrentSession();
    expect(updatedSession?.currentTaskId).toBe('test-2');
    
    // Step 3: Record task usage
    await sessionManager.recordTaskUsage('test-1');
    await sessionManager.recordTaskUsage('test-3');
    
    // Step 4: Record file activity - first add a file to the database
    const fileId = await addTestFile(db, testFilePath);
    
    // Record file change in the session
    await sessionManager.recordFileChange(fileId);
    
    // Step 5: Generate status indicator for the session
    const taskInfo = await getTaskData(db, updatedSession!.currentTaskId!);
    const stats = await getSessionStats(sessionManager, updatedSession!.id);
    
    const indicator = statusIndicator.generateStatusIndicator(updatedSession!, taskInfo, stats);
    
    // Verify indicator contains expected elements
    expect(indicator).toContain('◉');
    expect(indicator).toContain('test-2');
    
    // Step 6: Verify shell integration script generation
    const shellScript = statusIndicator.generateShellIntegrationScript();
    expect(shellScript).toContain('Task Master Terminal Integration for Bash');
    expect(shellScript).toContain('PROMPT_COMMAND');
    
    // Step 7: Disconnect session
    await sessionManager.disconnectSession();
    
    // Verify session is disconnected
    const disconnectedSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, session!.id)
    });
    
    expect(disconnectedSession).toBeDefined();
    expect(disconnectedSession!.status).toBe('disconnected');
    
    // Step 8: Reconnect to session with new manager
    const newSessionManager = new TerminalSessionManager(db, {
      persistSessions: true,
      trackTaskUsage: true,
      enableReconnection: true
    });
    
    // Use same terminal fingerprint
    newSessionManager.getTerminalFingerprint = sessionManager.getTerminalFingerprint;
    
    // Reconnect
    const reconnectedSession = await newSessionManager.initialize();
    
    // Verify reconnection to same session
    expect(reconnectedSession).toBeDefined();
    expect(reconnectedSession!.id).toBe(session!.id);
    expect(reconnectedSession!.status).toBe('active');
    
    // Verify connection count increased
    const dbSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, session!.id)
    });
    
    expect(dbSession!.connectionCount).toBe(2);
    
    // Step 9: Verify session stats
    const integrationStatus = await newSessionManager.getIntegrationStatus();
    expect(integrationStatus.enabled).toBe(true);
    expect(integrationStatus.sessionId).toBe(session!.id);
    expect(integrationStatus.taskCount).toBeGreaterThanOrEqual(3); // The 3 tasks we used
    expect(integrationStatus.fileCount).toBeGreaterThanOrEqual(1); // The 1 file we tracked
    
    // Verify task history
    const sessionTaskHistory = await db.query.sessionTasks.findMany({
      where: eq(sessionTasks.sessionId, session!.id)
    });
    
    expect(sessionTaskHistory.length).toBeGreaterThanOrEqual(3);
    
    // Verify file tracking
    const sessionFiles = await db.query.fileSessionMapping.findMany({
      where: eq(fileSessionMapping.sessionId, session!.id)
    });
    
    expect(sessionFiles.length).toBeGreaterThanOrEqual(1);
  });
  
  it('should handle full lifecycle with multiple reconnections and task changes', async () => {
    // Step 1: Initial session creation
    const session1 = await sessionManager.initialize();
    expect(session1).toBeDefined();
    const sessionId = session1!.id;
    
    // Step 2: Set current task
    await sessionManager.updateSession({
      currentTaskId: 'test-1'
    });
    
    // Step 3: Disconnect
    await sessionManager.disconnectSession();
    
    // Step 4: First reconnection
    const sessionManager2 = new TerminalSessionManager(db, {
      persistSessions: true,
      enableReconnection: true
    });
    sessionManager2.getTerminalFingerprint = sessionManager.getTerminalFingerprint;
    
    const session2 = await sessionManager2.initialize();
    expect(session2!.id).toBe(sessionId);
    expect(session2!.currentTaskId).toBe('test-1');
    
    // Step 5: Change task
    await sessionManager2.updateSession({
      currentTaskId: 'test-2'
    });
    
    // Step 6: Record some file activity
    const fileId = await addTestFile(db, testFilePath);
    await sessionManager2.recordFileChange(fileId);
    
    // Step 7: Disconnect again
    await sessionManager2.disconnectSession();
    
    // Step 8: Second reconnection
    const sessionManager3 = new TerminalSessionManager(db, {
      persistSessions: true,
      enableReconnection: true
    });
    sessionManager3.getTerminalFingerprint = sessionManager.getTerminalFingerprint;
    
    const session3 = await sessionManager3.initialize();
    expect(session3!.id).toBe(sessionId);
    expect(session3!.currentTaskId).toBe('test-2');
    
    // Step 9: Change task again
    await sessionManager3.updateSession({
      currentTaskId: 'test-3'
    });
    
    // Step 10: Generate integration status
    const status = await sessionManager3.getIntegrationStatus();
    expect(status.enabled).toBe(true);
    expect(status.currentTaskId).toBe('test-3');
    
    // Step 11: Check connection count
    const dbSession = await db.query.terminalSessions.findFirst({
      where: eq(terminalSessions.id, sessionId)
    });
    
    expect(dbSession!.connectionCount).toBe(3);
    
    // Step 12: Check task history
    const taskHistory = await sessionManager3.getSessionTasks(sessionId);
    expect(taskHistory.length).toBeGreaterThanOrEqual(3);
    
    // The most recent task should be test-3
    const mostRecentTask = taskHistory[0];
    expect(mostRecentTask.id).toBe('test-3');
  });
});

// Helper function to add a test file to the database
async function addTestFile(db: BetterSQLite3Database, filePath: string): Promise<number> {
  // Generate a file hash
  const hash = uuidv4();
  
  // Add file to database
  const result = await db.insert(files).values({
    path: filePath,
    hash,
    lastModified: new Date(),
    createdAt: new Date(),
    fileType: path.extname(filePath).substring(1),
    metadata: JSON.stringify({
      size: fs.statSync(filePath).size,
      lines: fs.readFileSync(filePath, 'utf-8').split('\n').length
    })
  }).returning();
  
  return result[0].id;
}

// Helper function to get task data for status indicator
async function getTaskData(db: BetterSQLite3Database, taskId: string) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });
  
  if (!task) {
    return undefined;
  }
  
  return {
    id: task.id,
    title: task.title,
    status: task.status
  };
}

// Helper function to get session stats
async function getSessionStats(sessionManager: TerminalSessionManager, sessionId: string) {
  const status = await sessionManager.getIntegrationStatus();
  
  return {
    taskCount: status.taskCount,
    fileCount: status.fileCount,
    duration: status.sessionDuration
  };
}