/**
 * Basic tests for the daemon CLI command (Task 17.4)
 * 
 * These tests verify that the daemon command is properly registered and accessible.
 */

import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Helper function to run CLI commands
async function runCliCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execPromise(`npm run dev -- ${command}`, {
      cwd: process.cwd(),
    });
    return stdout;
  } catch (error: any) {
    // Even if the command fails, we can still check the output
    return error.stdout || '';
  }
}

describe('Daemon CLI Command Basic Integration', () => {
  it('should provide help information for daemon command', async () => {
    const output = await runCliCommand('daemon --help');
    
    // Verify the output contains expected help text
    expect(output).toContain('Manage the file tracking daemon');
    expect(output).toContain('start');
    expect(output).toContain('stop');
    expect(output).toContain('status');
    expect(output).toContain('associate');
    expect(output).toContain('files');
    expect(output).toContain('tasks');
    expect(output).toContain('watch');
  });
  
  it('should provide help information for daemon start command', async () => {
    const output = await runCliCommand('daemon start --help');
    
    // Verify the output contains expected options
    expect(output).toContain('Start the file tracking daemon');
    expect(output).toContain('--path');
    expect(output).toContain('--exclude');
    expect(output).toContain('--auto-associate');
    expect(output).toContain('--confidence');
    expect(output).toContain('--interval');
    expect(output).toContain('--detach');
  });
  
  it('should provide help information for daemon status command', async () => {
    const output = await runCliCommand('daemon status --help');
    
    // Verify the output contains expected options
    expect(output).toContain('Check the status of the file tracking daemon');
    expect(output).toContain('--verbose');
  });
  
  it('should provide help information for daemon files command', async () => {
    const output = await runCliCommand('daemon files --help');
    
    // Verify the output contains expected options
    expect(output).toContain('List files associated with a task');
    expect(output).toContain('--task');
  });
});