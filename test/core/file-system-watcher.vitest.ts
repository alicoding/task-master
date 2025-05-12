/**
 * Tests for the FileSystemWatcher module (Task 17.2)
 * 
 * These tests verify the file system watcher's ability to 
 * detect file changes, handle debouncing, and emit correct events.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileSystemWatcher, FileSystemWatcherConfig } from '../../core/daemon/file-system-watcher.ts';
import { FileChangeEvent } from '../../core/daemon/file-tracking-daemon.ts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Test directory for created files
let testDir: string;

describe('FileSystemWatcher', () => {
  // Increase test timeout to handle file system operations
  vi.setConfig({ testTimeout: 10000 });
  beforeEach(async () => {
    // Create a temporary directory for test files
    testDir = path.join(os.tmpdir(), `file-watcher-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary test directory
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  it('should detect a new file being created', async () => {
    // Create a watcher instance configured to watch our test directory
    const config: FileSystemWatcherConfig = {
      watchPaths: [testDir],
      debounceTime: 100, // Short debounce time for tests
      ignoreInitial: true
    };

    const watcher = new FileSystemWatcher(config);

    // Create a mock for the fileChange event
    const onFileChange = vi.fn();
    watcher.on('fileChange', onFileChange);

    // Start the watcher and wait for it to be ready
    await watcher.start();
    
    // Create a new file in the test directory
    const testFilePath = path.join(testDir, 'test-file.txt');
    await fs.writeFile(testFilePath, 'Hello, world!');

    // Wait for the file change event to be debounced and emitted
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stop the watcher
    await watcher.stop();

    // Verify that the file change event was emitted with the correct properties
    expect(onFileChange).toHaveBeenCalled();
    const event = onFileChange.mock.calls[0][0] as FileChangeEvent;
    expect(event.path).toBe(testFilePath);
    expect(event.type).toBe('created');
  });

  it('should detect file modifications', async () => {
    // Create a test file first
    const testFilePath = path.join(testDir, 'modify-test.txt');
    await fs.writeFile(testFilePath, 'Initial content');

    // Create a watcher instance
    const config: FileSystemWatcherConfig = {
      watchPaths: [testDir],
      debounceTime: 100,
      ignoreInitial: true
    };

    const watcher = new FileSystemWatcher(config);

    // Create a mock for the fileChange event
    const onFileChange = vi.fn();
    watcher.on('fileChange', onFileChange);

    // Start the watcher and wait for it to be ready
    await watcher.start();
    
    // Modify the file
    await fs.writeFile(testFilePath, 'Modified content');

    // Wait for the file change event
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stop the watcher
    await watcher.stop();

    // Verify the modification event
    expect(onFileChange).toHaveBeenCalled();
    const event = onFileChange.mock.calls[0][0] as FileChangeEvent;
    expect(event.path).toBe(testFilePath);
    expect(event.type).toBe('modified');
  });

  it('should detect file deletions', async () => {
    // Create a test file first
    const testFilePath = path.join(testDir, 'delete-test.txt');
    await fs.writeFile(testFilePath, 'File to be deleted');

    // Create a watcher instance
    const config: FileSystemWatcherConfig = {
      watchPaths: [testDir],
      debounceTime: 100,
      ignoreInitial: true
    };

    const watcher = new FileSystemWatcher(config);

    // Create a mock for the fileChange event
    const onFileChange = vi.fn();
    watcher.on('fileChange', onFileChange);

    // Start the watcher and wait for it to be ready
    await watcher.start();
    
    // Delete the file
    await fs.unlink(testFilePath);

    // Wait for the file change event
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stop the watcher
    await watcher.stop();

    // Verify the deletion event
    expect(onFileChange).toHaveBeenCalled();
    const event = onFileChange.mock.calls[0][0] as FileChangeEvent;
    expect(event.path).toBe(testFilePath);
    expect(event.type).toBe('deleted');
  });

  it('should detect file renames as delete followed by add', async () => {
    // Create a test file first
    const originalPath = path.join(testDir, 'original.txt');
    const newPath = path.join(testDir, 'renamed.txt');
    await fs.writeFile(originalPath, 'File to be renamed');

    // Create a watcher instance
    const config: FileSystemWatcherConfig = {
      watchPaths: [testDir],
      debounceTime: 100,
      ignoreInitial: true
    };

    const watcher = new FileSystemWatcher(config);

    // Create a mock for the fileChange event
    const onFileChange = vi.fn();
    watcher.on('fileChange', onFileChange);

    // Start the watcher and wait for it to be ready
    await watcher.start();
    
    // Rename the file
    await fs.rename(originalPath, newPath);

    // Wait longer for renamed events as they require detecting both delete and add
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Stop the watcher
    await watcher.stop();

    // We should get at least two events (delete and add)
    expect(onFileChange).toHaveBeenCalledTimes(2);
    
    // Check all events to see if we got the rename detection
    const events = onFileChange.mock.calls.map(call => call[0] as FileChangeEvent);
    const hasDeleteEvent = events.some(e => e.path === originalPath && e.type === 'deleted');
    const hasAddOrRenameEvent = events.some(e => 
      (e.path === newPath && e.type === 'created') || 
      (e.path === newPath && e.type === 'renamed' && e.previousPath === originalPath)
    );
    
    expect(hasDeleteEvent || hasAddOrRenameEvent).toBeTruthy();
  });

  it('should properly handle file extension filtering', async () => {
    // Create a watcher instance that only watches .txt files
    const config: FileSystemWatcherConfig = {
      watchPaths: [testDir],
      includeExtensions: ['.txt'],
      debounceTime: 100,
      ignoreInitial: true
    };

    const watcher = new FileSystemWatcher(config);

    // Create mocks for the fileChange event
    const onFileChange = vi.fn();
    watcher.on('fileChange', onFileChange);

    // Start the watcher and wait for it to be ready
    await watcher.start();
    
    // Create files with different extensions
    const txtFilePath = path.join(testDir, 'test.txt');
    const jsFilePath = path.join(testDir, 'test.js');
    
    await fs.writeFile(txtFilePath, 'Text file content');
    await fs.writeFile(jsFilePath, 'JavaScript file content');

    // Wait for events
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stop the watcher
    await watcher.stop();

    // Verify we only got events for .txt files
    expect(onFileChange).toHaveBeenCalledTimes(1);
    const event = onFileChange.mock.calls[0][0] as FileChangeEvent;
    expect(event.path).toBe(txtFilePath);
    expect(event.type).toBe('created');
  });

  it('should batch file changes with batchFileChanges event', async () => {
    // Create a watcher instance
    const config: FileSystemWatcherConfig = {
      watchPaths: [testDir],
      debounceTime: 100,
      ignoreInitial: true
    };

    const watcher = new FileSystemWatcher(config);

    // Create mocks for events
    const onBatchFileChanges = vi.fn();
    watcher.on('batchFileChanges', onBatchFileChanges);

    // Start the watcher and wait for it to be ready
    await watcher.start();
    
    // Create multiple files in quick succession
    const file1 = path.join(testDir, 'batch1.txt');
    const file2 = path.join(testDir, 'batch2.txt');
    const file3 = path.join(testDir, 'batch3.txt');
    
    await fs.writeFile(file1, 'File 1');
    await fs.writeFile(file2, 'File 2');
    await fs.writeFile(file3, 'File 3');

    // Wait for the batch event
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Stop the watcher
    await watcher.stop();

    // Verify the batch event was triggered with multiple files
    expect(onBatchFileChanges).toHaveBeenCalled();
    const batchEvents = onBatchFileChanges.mock.calls[0][0] as FileChangeEvent[];
    expect(batchEvents.length).toBeGreaterThanOrEqual(3);
    
    // Verify all files are in the batch
    const paths = batchEvents.map(e => e.path);
    expect(paths).toContain(file1);
    expect(paths).toContain(file2);
    expect(paths).toContain(file3);
  });
});