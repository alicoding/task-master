/**
 * Test script for the file tracking system
 * Tests the FileTrackingRepository functionality
 */

import { TaskRepository } from '../core/repo.ts';
import fs from 'fs/promises';
import path from 'path';
import { File } from '../db/schema-extensions.ts';

// File paths for testing
const testDir = path.join(process.cwd(), 'test/tmp');
const testFile1 = path.join(testDir, 'test-file-1.txt');
const testFile2 = path.join(testDir, 'test-file-2.js');

// Test content
const testContent1 = 'This is test file 1 content';
const testContent2 = 'function testFunction() { return "test"; }';

/**
 * Setup test files
 */
async function setupTestFiles() {
  console.log('Setting up test files...');
  
  // Create test directory if it doesn't exist
  try {
    await fs.mkdir(testDir, { recursive: true });
  } catch (error) {
    // Directory may already exist
  }
  
  // Create test files
  await fs.writeFile(testFile1, testContent1);
  await fs.writeFile(testFile2, testContent2);
  
  console.log(`Created test files in ${testDir}`);
}

/**
 * Clean up test files
 */
async function cleanupTestFiles() {
  console.log('Cleaning up test files...');
  
  try {
    await fs.unlink(testFile1);
    await fs.unlink(testFile2);
    await fs.rmdir(testDir);
  } catch (error) {
    console.error('Error cleaning up test files:', error);
  }
}

/**
 * Test tracking a file
 */
async function testTrackFile(repo: TaskRepository) {
  console.log('\nTesting trackFile...');
  
  // Track the first test file
  const result = await repo.trackFile(testFile1);
  
  if (!result.success || !result.data) {
    console.error('Failed to track file:', result.error?.message);
    return null;
  }
  
  console.log(`✅ File tracked: ${result.data.path}`);
  console.log(`  ID: ${result.data.id}`);
  console.log(`  Hash: ${result.data.hash}`);
  console.log(`  Type: ${result.data.fileType}`);
  
  return result.data;
}

/**
 * Test tracking a file that has been modified
 */
async function testTrackModifiedFile(repo: TaskRepository, file: File) {
  console.log('\nTesting tracking a modified file...');
  
  // Modify the file
  const newContent = testContent1 + '\nThis line was added';
  await fs.writeFile(testFile1, newContent);
  
  // Track the modified file
  const result = await repo.trackFile(testFile1);
  
  if (!result.success || !result.data) {
    console.error('Failed to track modified file:', result.error?.message);
    return;
  }
  
  console.log(`✅ Modified file tracked: ${result.data.path}`);
  console.log(`  Old hash: ${file.hash}`);
  console.log(`  New hash: ${result.data.hash}`);
  
  // Get change history
  const historyResult = await repo.getFileChangeHistory(testFile1);
  
  if (!historyResult.success || !historyResult.data) {
    console.error('Failed to get file change history:', historyResult.error?.message);
    return;
  }
  
  console.log(`✅ Change history retrieved with ${historyResult.data.length} entries`);
  
  for (const change of historyResult.data) {
    console.log(`  Change type: ${change.changeType}`);
    console.log(`  Timestamp: ${new Date(change.timestamp).toLocaleString()}`);
    console.log(`  Previous hash: ${change.previousHash || 'N/A'}`);
    console.log(`  Current hash: ${change.currentHash || 'N/A'}`);
    console.log(`  Associated task: ${change.taskId || 'N/A'}`);
    console.log('  ---');
  }
}

/**
 * Test associating a file with a task
 */
async function testAssociateFileWithTask(repo: TaskRepository) {
  console.log('\nTesting associating a file with a task...');
  
  // Create a test task
  const taskResult = await repo.createTask({
    title: 'File Tracking Test Task'
  });
  
  if (!taskResult.success || !taskResult.data) {
    console.error('Failed to create test task:', taskResult.error?.message);
    return;
  }
  
  const taskId = taskResult.data.id;
  console.log(`✅ Created test task with ID: ${taskId}`);
  
  // Associate the file with the task
  const associationResult = await repo.associateFileWithTask(
    taskId,
    testFile2,
    'implements',
    90
  );
  
  if (!associationResult.success || !associationResult.data) {
    console.error('Failed to associate file with task:', associationResult.error?.message);
    return;
  }
  
  console.log(`✅ Associated file with task`);
  console.log(`  Relationship type: ${associationResult.data.relationshipType}`);
  console.log(`  Confidence: ${associationResult.data.confidence}%`);
  
  // Get files for task
  const filesResult = await repo.getFilesForTask(taskId);
  
  if (!filesResult.success || !filesResult.data) {
    console.error('Failed to get files for task:', filesResult.error?.message);
    return;
  }
  
  console.log(`✅ Retrieved ${filesResult.data.length} files for task ${taskId}`);
  
  for (const item of filesResult.data) {
    console.log(`  File: ${item.file.path}`);
    console.log(`  Relationship: ${item.relationship.relationshipType}`);
    console.log(`  Confidence: ${item.relationship.confidence}%`);
  }
  
  // Get tasks for file
  const tasksResult = await repo.getTasksForFile(testFile2);
  
  if (!tasksResult.success || !tasksResult.data) {
    console.error('Failed to get tasks for file:', tasksResult.error?.message);
    return;
  }
  
  console.log(`✅ Retrieved ${tasksResult.data.length} tasks for file ${testFile2}`);
  
  for (const item of tasksResult.data) {
    console.log(`  Task: ${item.task.id} - ${item.task.title}`);
    console.log(`  Relationship: ${item.relationship.relationshipType}`);
    console.log(`  Confidence: ${item.relationship.confidence}%`);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Running file tracking tests...');
  
  // Setup test files
  await setupTestFiles();
  
  try {
    // Create repository with the real database, not in-memory
    const repo = new TaskRepository('./db/taskmaster.db', false);
    
    try {
      // Test tracking a file
      const file = await testTrackFile(repo);
      
      if (file) {
        // Test tracking a modified file
        await testTrackModifiedFile(repo, file);
      }
      
      // Test associating a file with a task
      await testAssociateFileWithTask(repo);
      
      console.log('\n✨ All file tracking tests completed!');
    } finally {
      // Close repository
      repo.close();
    }
  } catch (error) {
    console.error('Error during tests:', error);
  } finally {
    // Clean up test files
    await cleanupTestFiles();
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});