/**
 * Terminal Command Integration Tests
 * Tests for Task 17.7: Terminal Integration CLI Commands
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { Command } from 'commander';
import { createTerminalCommand } from '../../cli/commands/terminal/index.ts';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { initializeTestDB } from '../utils/test-helpers.ts';
import { terminalSessions, sessionTasks, tasks } from '../../db/schema-extensions.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock environment
vi.mock('os', () => ({
  userInfo: () => ({ username: 'test-user' }),
  homedir: () => '/home/test-user',
  platform: () => 'linux',
  tmpdir: () => '/tmp'
}));

// Mock console functions
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();

// Mock process.stdout and process.env
const originalStdout = { ...process.stdout };
const originalStdoutWrite = process.stdout.write;
const originalEnv = { ...process.env };
const mockStdout = {
  ...originalStdout,
  isTTY: true,
  columns: 100,
  rows: 30,
  write: vi.fn((...args) => originalStdoutWrite.apply(process.stdout, args))
};

// Mock fs functions
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue('# Original shell config\n'),
    writeFileSync: vi.fn(),
    copyFileSync: vi.fn()
  };
});

describe('Terminal Command Integration Tests', () => {
  let db: BetterSQLite3Database;
  let command: Command;
  let mockExit: any;
  
  beforeAll(async () => {
    // Set up test database
    db = await initializeTestDB();
    
    // Mock process.exit
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    
    // Initialize DB module with test DB
    vi.mock('../../db/init.ts', async () => {
      return {
        initializeDB: async () => db
      };
    });
    
    // Mock terminal environment
    process.stdout = Object.assign(process.stdout, mockStdout);
    process.env = {
      ...process.env,
      SHELL: '/bin/bash',
      USER: 'test-user',
      TERM: 'xterm-256color',
      HOME: '/home/test-user'
    };
  });
  
  afterAll(() => {
    // Clean up
    process.stdout = originalStdout;
    process.env = originalEnv;
    mockExit.mockRestore();
    vi.restoreAllMocks();
  });
  
  beforeEach(async () => {
    // Clear test database tables
    await db.delete(sessionTasks);
    await db.delete(terminalSessions);
    await db.delete(tasks);
    
    // Create terminal command
    command = createTerminalCommand();
    
    // Create test tasks
    const testTasks = [
      { id: 'test-1', title: 'Test Task 1', status: 'todo', createdAt: new Date() },
      { id: 'test-2', title: 'Test Task 2', status: 'in-progress', createdAt: new Date() },
      { id: 'test-3', title: 'Test Task 3', status: 'done', createdAt: new Date() }
    ];
    
    for (const task of testTasks) {
      await db.insert(tasks).values(task);
    }
    
    // Mock console methods
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
  });
  
  afterEach(() => {
    // Reset mocks
    mockConsoleLog.mockReset();
    mockConsoleError.mockReset();
    mockStdout.write.mockReset();
    
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  it('should have the correct command structure', () => {
    // Verify command structure
    expect(command.name()).toBe('terminal');
    
    // Check subcommands
    const subcommands = command.commands.map(cmd => cmd.name());
    expect(subcommands).toContain('status');
    expect(subcommands).toContain('prompt');
    expect(subcommands).toContain('setup');
    expect(subcommands).toContain('task');
    expect(subcommands).toContain('session');
  });
  
  it('should execute status command and show terminal status', async () => {
    // Mock session detection for status command
    vi.mock('../../core/terminal/terminal-session-manager-index.ts', async () => {
      const actual = await vi.importActual('../../core/terminal/terminal-session-manager-index.ts');
      return {
        ...actual,
        TerminalSessionManager: class MockSessionManager {
          async initialize() {
            return {
              id: 'test-session-id',
              status: 'active',
              fingerprint: {
                tty: '/dev/ttys001',
                user: 'test-user',
                shell: '/bin/bash'
              },
              startTime: new Date(),
              lastActive: new Date()
            };
          }
          getCurrentSession() {
            return {
              id: 'test-session-id',
              status: 'active',
              fingerprint: {
                tty: '/dev/ttys001',
                user: 'test-user',
                shell: '/bin/bash'
              },
              startTime: new Date(),
              lastActive: new Date()
            };
          }
          async getIntegrationStatus() {
            return {
              enabled: true,
              sessionId: 'test-session-id',
              tty: '/dev/ttys001',
              status: 'active',
              taskCount: 3,
              fileCount: 2,
              sessionDuration: 3600000,
              shellIntegrated: true
            };
          }
        }
      };
    });
    
    // Execute status command
    const statusCommand = command.commands.find(cmd => cmd.name() === 'status');
    await statusCommand?.parseAsync(['status']);
    
    // Verify output
    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls.flat().join('\n');
    expect(output).toContain('Terminal Integration Status');
    expect(output).toContain('Session ID:');
    expect(output).toContain('TTY:');
    expect(output).toContain('Status:');
  });
  
  it('should execute prompt command and generate terminal prompt', async () => {
    // Mock session for prompt command
    vi.mock('../../core/terminal/terminal-session-manager.ts', async () => {
      const actual = await vi.importActual('../../core/terminal/terminal-session-manager-index.ts');
      return {
        ...actual,
        TerminalSessionManager: class MockSessionManager {
          async initialize() {
            return {
              id: 'test-session-id',
              status: 'active',
              fingerprint: {
                tty: '/dev/ttys001',
                user: 'test-user',
                shell: '/bin/bash'
              },
              startTime: new Date(),
              lastActive: new Date(),
              currentTaskId: 'test-2'
            };
          }
          getCurrentSession() {
            return {
              id: 'test-session-id',
              status: 'active',
              fingerprint: {
                tty: '/dev/ttys001',
                user: 'test-user',
                shell: '/bin/bash'
              },
              startTime: new Date(),
              lastActive: new Date(),
              currentTaskId: 'test-2'
            };
          }
          async getIntegrationStatus() {
            return {
              enabled: true,
              sessionId: 'test-session-id',
              tty: '/dev/ttys001',
              status: 'active',
              taskCount: 3,
              fileCount: 2,
              sessionDuration: 3600000,
              shellIntegrated: true,
              currentTaskId: 'test-2'
            };
          }
        }
      };
    });
    
    // Execute prompt command
    const promptCommand = command.commands.find(cmd => cmd.name() === 'prompt');
    await promptCommand?.parseAsync(['prompt', '--format', 'simple', '--colors', 'false']);
    
    // Verify output was written directly to stdout
    expect(mockStdout.write).toHaveBeenCalled();
  });
  
  it('should execute setup command and generate shell integration script', async () => {
    // Execute setup command with print option
    const setupCommand = command.commands.find(cmd => cmd.name() === 'setup');
    await setupCommand?.parseAsync(['setup', '--print']);
    
    // Verify output contains shell integration script
    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls.flat().join('\n');
    expect(output).toContain('Task Master Terminal Integration for Bash');
    expect(output).toContain('PROMPT_COMMAND');
  });
  
  it('should execute task command and set current task', async () => {
    // Mock session manager for task command
    const mockUpdateSession = vi.fn();
    vi.mock('../../core/terminal/terminal-session-manager-index.ts', async () => {
      const actual = await vi.importActual('../../core/terminal/terminal-session-manager-index.ts');
      return {
        ...actual,
        TerminalSessionManager: class MockSessionManager {
          async initialize() {
            return {
              id: 'test-session-id',
              status: 'active',
              fingerprint: {
                tty: '/dev/ttys001',
                user: 'test-user',
                shell: '/bin/bash'
              },
              startTime: new Date(),
              lastActive: new Date()
            };
          }
          getCurrentSession() {
            return {
              id: 'test-session-id',
              status: 'active',
              fingerprint: {
                tty: '/dev/ttys001',
                user: 'test-user',
                shell: '/bin/bash'
              },
              startTime: new Date(),
              lastActive: new Date()
            };
          }
          updateSession = mockUpdateSession;
        }
      };
    });
    
    // Execute task command
    const taskCommand = command.commands.find(cmd => cmd.name() === 'task');
    await taskCommand?.parseAsync(['task', 'test-2']);
    
    // Verify session update was called
    expect(mockUpdateSession).toHaveBeenCalledWith({
      currentTaskId: 'test-2'
    });
    
    // Verify output confirms task was set
    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls.flat().join('\n');
    expect(output).toContain('Current task set to');
    expect(output).toContain('test-2');
  });
  
  it('should execute session command and show session info', async () => {
    // Mock session manager for session command
    vi.mock('../../core/terminal/terminal-session-manager-index.ts', async () => {
      const actual = await vi.importActual('../../core/terminal/terminal-session-manager-index.ts');
      return {
        ...actual,
        TerminalSessionManager: class MockSessionManager {
          async initialize() {
            return {
              id: 'test-session-id',
              status: 'active',
              fingerprint: {
                tty: '/dev/ttys001',
                user: 'test-user',
                shell: '/bin/bash'
              },
              startTime: new Date(),
              lastActive: new Date(),
              currentTaskId: 'test-2'
            };
          }
          getCurrentSession() {
            return {
              id: 'test-session-id',
              status: 'active',
              fingerprint: {
                tty: '/dev/ttys001',
                user: 'test-user',
                shell: '/bin/bash'
              },
              startTime: new Date(),
              lastActive: new Date(),
              currentTaskId: 'test-2'
            };
          }
        }
      };
    });
    
    // Execute session command
    const sessionCommand = command.commands.find(cmd => cmd.name() === 'session');
    await sessionCommand?.parseAsync(['session']);
    
    // Verify output shows session information
    expect(mockConsoleLog).toHaveBeenCalled();
    const output = mockConsoleLog.mock.calls.flat().join('\n');
    expect(output).toContain('Terminal Session');
    expect(output).toContain('Session ID:');
    expect(output).toContain('test-session-id');
  });
});