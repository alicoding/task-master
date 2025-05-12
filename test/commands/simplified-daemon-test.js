/**
 * Simplified test for the daemon CLI command
 * Tests that the daemon command is properly registered with the CLI
 */

import { createDaemon, closeDaemon } from '../../core/daemon/index.ts';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Main function to run tests
async function runTests() {
  let testDir = '';
  let testFile = '';

  try {
    // Create a test directory and file
    testDir = path.join(os.tmpdir(), `daemon-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    testFile = path.join(testDir, 'test-file.js');
    await fs.writeFile(testFile, 'console.log("Test file");');
    
    console.log('Created test directory:', testDir);
    console.log('Created test file:', testFile);
    
    // Verify the daemon command is registered
    await runCommand('daemon --help');
    
    // Verify the daemon start command
    await runCommand('daemon start --detach --path', [testDir, '--interval', '500']);
    
    // Verify the daemon status command
    await runCommand('daemon status');
    
    // Verify the file commands
    await runCommand('add --title', ['Test Task for Daemon']);
    await runCommand('daemon associate --file', [testFile, '--task', '1', '--relationship', 'implements']);
    await runCommand('daemon files --task', ['1']);
    await runCommand('daemon tasks --file', [testFile]);
    
    // Verify the stop command
    await runCommand('daemon stop');
    
    console.log('All daemon CLI command tests passed!');
  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    // Cleanup
    try {
      if (testDir) {
        await fs.rm(testDir, { recursive: true, force: true });
      }
      
      // Make sure daemon is stopped
      try {
        const daemon = createDaemon();
        if (daemon) {
          await daemon.stop();
        }
        await closeDaemon();
      } catch (err) {
        // Ignore errors
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  }
}

// Helper function to run CLI commands
async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const fullArgs = args.length > 0 ? `${command} ${args.join(' ')}` : command;
    const cmd = `npm run dev -- ${fullArgs}`;
    
    console.log(`\nRunning command: ${cmd}`);
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command failed: ${error.message}`);
        console.error('stderr:', stderr);
        reject(error);
        return;
      }
      
      console.log('Command output:');
      console.log(stdout);
      
      resolve(stdout);
    });
  });
}

// Run the tests
runTests();