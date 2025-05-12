/**
 * Vitest tests for the File Tracking Repository (Task 17.3)
 * 
 * These tests verify the database extensions for file tracking,
 * including tracking files, recording changes, and associating files with tasks.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FileTrackingRepository } from '../../core/repository/file-tracking.ts';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { File } from '../../db/schema-extensions.ts';

// File paths for testing
let testDir: string;
let testFile1: string;
let testFile2: string;

// Test content
const testContent1 = 'This is test file 1 content';
const testContent2 = 'function testFunction() { return "test"; }';

// Repository instance
let repository: FileTrackingRepository;

describe('FileTrackingRepository', () => {
  beforeAll(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `file-tracking-test-${Date.now()}`);
    testFile1 = path.join(testDir, 'test-file-1.txt');
    testFile2 = path.join(testDir, 'test-file-2.js');
    
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    
    // Create test files
    await fs.writeFile(testFile1, testContent1);
    await fs.writeFile(testFile2, testContent2);
    
    // Create repository with in-memory database for testing
    repository = new FileTrackingRepository();
  });
  
  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
    
    // Close repository
    await repository.close();
  });
  
  it('should track a file', async () => {
    // Track the test file
    const result = await repository.trackFile(testFile1);
    
    // Assert result is successful
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    // Assert file properties
    const file = result.data as File;
    expect(file.path).toBe(testFile1);
    expect(file.hash).toBeDefined();
    expect(file.fileType).toBe('txt');
    
    return file;
  });
  
  it('should detect and track file modifications', async () => {
    // First, track the original file
    const originalResult = await repository.trackFile(testFile1);
    expect(originalResult.success).toBe(true);
    
    const originalFile = originalResult.data as File;
    const originalHash = originalFile.hash;
    
    // Modify the file
    const modifiedContent = testContent1 + '\nThis line was added';
    await fs.writeFile(testFile1, modifiedContent);
    
    // Track the modified file
    const modifiedResult = await repository.trackFile(testFile1);
    expect(modifiedResult.success).toBe(true);
    
    const modifiedFile = modifiedResult.data as File;
    const newHash = modifiedFile.hash;
    
    // Verify hash changed
    expect(newHash).not.toBe(originalHash);
    
    // Get change history
    const historyResult = await repository.getFileChangeHistory(testFile1);
    expect(historyResult.success).toBe(true);
    expect(historyResult.data).toBeDefined();
    
    // Expect at least 2 changes: created and modified
    expect(historyResult.data?.length).toBeGreaterThanOrEqual(2);
    
    // The most recent change should be a modification
    const changes = historyResult.data || [];
    expect(changes.some(change => change.changeType === 'modified')).toBe(true);
  });
  
  it('should associate a file with a task', async () => {
    // Create a test task
    const taskResult = await repository.createTask({
      title: 'File Tracking Test Task'
    });
    
    expect(taskResult.success).toBe(true);
    expect(taskResult.data).toBeDefined();
    
    const taskId = taskResult.data?.id as string;
    
    // Associate the file with the task
    const associationResult = await repository.associateFileWithTask(
      taskId,
      testFile2,
      'implements',
      90
    );
    
    expect(associationResult.success).toBe(true);
    expect(associationResult.data).toBeDefined();
    
    const association = associationResult.data;
    expect(association?.relationshipType).toBe('implements');
    expect(association?.confidence).toBe(90);
    
    // Get files for task
    const filesResult = await repository.getFilesForTask(taskId);
    expect(filesResult.success).toBe(true);
    expect(filesResult.data).toBeDefined();
    expect(filesResult.data?.length).toBe(1);
    
    const fileRelation = filesResult.data?.[0];
    expect(fileRelation?.file.path).toBe(testFile2);
    expect(fileRelation?.relationship.relationshipType).toBe('implements');
    
    // Get tasks for file
    const tasksResult = await repository.getTasksForFile(testFile2);
    expect(tasksResult.success).toBe(true);
    expect(tasksResult.data).toBeDefined();
    expect(tasksResult.data?.length).toBe(1);
    
    const taskRelation = tasksResult.data?.[0];
    expect(taskRelation?.task.id).toBe(taskId);
    expect(taskRelation?.relationship.relationshipType).toBe('implements');
  });
  
  it('should calculate file hash consistently', () => {
    // Create repository instance
    const repo = new FileTrackingRepository();
    
    // Test with different content
    const content1 = 'Test content';
    const content2 = 'Test content';
    const content3 = 'Different content';
    
    // Calculate hashes
    const hash1 = repo.calculateFileHash(content1);
    const hash2 = repo.calculateFileHash(content2);
    const hash3 = repo.calculateFileHash(content3);
    
    // Same content should produce the same hash
    expect(hash1).toBe(hash2);
    
    // Different content should produce different hashes
    expect(hash1).not.toBe(hash3);
  });
});