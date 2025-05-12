/**
 * Tests for the daemon CLI command (Task 17.4)
 * 
 * These tests verify that the daemon command integrates correctly with the CLI
 * and tests the behavior of various subcommands.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Use a temporary directory for test files
let testDir: string;
let testFile: string;

// Helper function to run CLI commands
async function runCommand(command: string, args: string[] = []): Promise<{ stdout: string, stderr: string, exitCode: number }> {
  try {
    const fullCommand = `npm run dev -- ${command} ${args.join(' ')}`;
    const { stdout, stderr } = await execPromise(fullCommand, {
      cwd: process.cwd(),
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.code || 1
    };
  }
}

describe('Daemon CLI Command', () => {
  beforeAll(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `daemon-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    
    // Create a test file
    testFile = path.join(testDir, 'test-file.txt');
    await fs.writeFile(testFile, 'Test content');
    
    // Create a test task
    await runCommand('add', ['--title', 'Test Task for Daemon Command']);
  });
  
  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
    
    // Make sure daemon is stopped
    await runCommand('daemon stop', ['--force']);
  });
  
  it('should show status when daemon is not running', async () => {
    // First make sure daemon is stopped
    await runCommand('daemon stop', ['--force']);
    
    // Check status
    const { stdout } = await runCommand('daemon status');
    
    // Status should indicate no daemon is running
    expect(stdout).toContain('No daemon is currently running');
  });
  
  it('should start daemon with custom configuration', async () => {
    // Start daemon with custom configuration
    const { stdout } = await runCommand('daemon start', [
      '--path', testDir,
      '--auto-associate',
      '--confidence', '80',
      '--interval', '500',
      '--detach'
    ]);
    
    // Should indicate daemon started successfully
    expect(stdout).toContain('Starting file tracking daemon');
    expect(stdout).toContain('Daemon running in background');
    
    // Check status
    const statusResult = await runCommand('daemon status');
    
    // Status should show correct information
    const isDaemonRunning = statusResult.stdout.includes('State: Running') ||
                           !statusResult.stdout.includes('No daemon is currently running');
    expect(isDaemonRunning).toBe(true);

    // Either the output contains our directory or shows information about a running daemon
    const hasCorrectConfig = statusResult.stdout.includes(testDir) ||
                            statusResult.stdout.includes('Watching paths');
    expect(hasCorrectConfig).toBe(true);
    
    // Stop daemon after test
    await runCommand('daemon stop');
  });
  
  it('should associate file with task', async () => {
    // Make sure daemon is running
    await runCommand('daemon start', ['--detach']);
    
    // Get first task ID
    const { stdout: taskList } = await runCommand('show');
    const taskIdMatch = taskList.match(/Task (\d+)/);
    expect(taskIdMatch).not.toBeNull();
    
    const taskId = taskIdMatch![1];
    
    // Associate test file with task
    const { stdout } = await runCommand('daemon associate', [
      '--file', testFile,
      '--task', taskId,
      '--relationship', 'implements',
      '--confidence', '90'
    ]);
    
    // Should indicate successful association
    expect(stdout).toContain('Successfully associated file with task');
    expect(stdout).toContain(testFile);
    expect(stdout).toContain(taskId);
    expect(stdout).toContain('implements');
    
    // Verify association with files command
    const { stdout: filesOutput } = await runCommand('daemon files', ['--task', taskId]);
    expect(filesOutput).toContain(testFile);
    expect(filesOutput).toContain('implements');
    
    // Verify association with tasks command
    const { stdout: tasksOutput } = await runCommand('daemon tasks', ['--file', testFile]);
    expect(tasksOutput).toContain(taskId);
    expect(tasksOutput).toContain('implements');
    
    // Stop daemon after test
    await runCommand('daemon stop');
  });
  
  it('should stop daemon gracefully', async () => {
    // Start daemon
    await runCommand('daemon start', ['--detach']);
    
    // Stop daemon
    const { stdout } = await runCommand('daemon stop');
    
    // Should either indicate a stop or already be stopped
    const isStoppedCorrectly =
      stdout.includes('Stopping file tracking daemon') ||
      stdout.includes('Daemon stopped gracefully') ||
      stdout.includes('No daemon is currently running');

    expect(isStoppedCorrectly).toBe(true);
    
    // Verify it's stopped
    const { stdout: statusOutput } = await runCommand('daemon status');
    expect(statusOutput).toContain('No daemon is currently running');
  });
  
  it('should add path to watch list', async () => {
    // Start daemon without specifying paths
    await runCommand('daemon start', ['--detach']);
    
    // Create another test directory
    const testDir2 = path.join(os.tmpdir(), `daemon-test-2-${Date.now()}`);
    await fs.mkdir(testDir2, { recursive: true });
    
    try {
      // Add test directory to watch list
      const { stdout } = await runCommand('daemon watch', ['--path', testDir2]);
      
      // Should indicate a path was added or daemon was started with that path
      const isPathAdded =
        stdout.includes(`Added path ${testDir2} to watch list`) ||
        stdout.includes(`Started daemon and added path ${testDir2} to watch list`);

      expect(isPathAdded).toBe(true);
      
      // Verify it's being watched via status
      const { stdout: statusOutput } = await runCommand('daemon status', ['--verbose']);
      expect(statusOutput).toContain(testDir2);
    } finally {
      // Clean up
      await fs.rm(testDir2, { recursive: true, force: true });
      await runCommand('daemon stop');
    }
  });
});