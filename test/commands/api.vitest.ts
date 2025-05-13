/**
 * API Command Integration Tests (Vitest)
 * 
 * This file provides comprehensive tests for the API command functionality
 * with improved reliability and isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskRepository } from '../../core/repo';
import { createApiCommand } from '../../cli/commands/api/index';
import * as fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../../core/utils/logger';
import { 
  initializeTestDatabase, 
  TestDatabaseFixture 
} from '../utils/robust-database-test-utils';

// Create logger
const logger = createLogger('ApiCommandTest');

// Test temp directory
const tempDir = path.join(process.cwd(), 'test', 'temp');

// We'll create the temp directory in the beforeEach block with fs.mkdir

describe('API Command Integration Tests', () => {
  let fixture: TestDatabaseFixture;
  let repo: TaskRepository;
  let apiCommand: any;
  let testFiles: {
    inputFilePath: string;
    batchFilePath: string;
    outputFilePath: string;
  };
  
  // Setup before each test
  beforeEach(async () => {
    // Create isolated test database
    fixture = initializeTestDatabase(true);
    
    // Create repo with test database
    repo = new TaskRepository(':memory:', true);
    
    // Override repo's database with our test fixture
    (repo as any).db = fixture.db;
    (repo as any).sqlite = fixture.sqlite;
    
    // Get the API command reference
    apiCommand = createApiCommand();
    
    // Create temporary test directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create test files
    testFiles = await createTestApiFiles();
    
    // Capture console output for testing
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const output = args.join(' ');
      logger.debug(`Console output: ${output}`);
      return originalConsoleLog(...args);
    };
  });
  
  // Cleanup after each test
  afterEach(async () => {
    // Clean up the database
    fixture.cleanup();
    
    // Close repository
    repo.close();
    
    // Clean up test files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      logger.error("Error cleaning up temp directory:", error);
    }
    
    // Restore console
    console.log = console.log;
  });
  
  it('should verify API command structure', async () => {
    return fixture.withTransaction(async () => {
      // Verify API command exists and has expected properties
      expect(apiCommand).toBeDefined();
      expect(apiCommand.commands).toBeDefined();
      expect(apiCommand.commands.length).toBeGreaterThan(0);
      
      // Verify export command
      const exportCmd = apiCommand.commands.find((cmd: any) => cmd.name() === 'export');
      expect(exportCmd).toBeDefined();
      expect(typeof exportCmd.action).toBe('function');
      
      // Verify import command
      const importCmd = apiCommand.commands.find((cmd: any) => cmd.name() === 'import');
      expect(importCmd).toBeDefined();
      expect(typeof importCmd.action).toBe('function');
      
      // Verify batch command
      const batchCmd = apiCommand.commands.find((cmd: any) => cmd.name() === 'batch');
      expect(batchCmd).toBeDefined();
      expect(typeof batchCmd.action).toBe('function');
    });
  });
  
  it('should export tasks in JSON format', async () => {
    return fixture.withTransaction(async () => {
      // Create some test tasks
      await repo.createTask({
        title: 'API Test Task 1',
        tags: ['api', 'test']
      });
      
      await repo.createTask({
        title: 'API Test Task 2',
        tags: ['api', 'important'],
        status: 'in-progress'
      });
      
      // Create a child task
      const parentTask = await repo.createTask({
        title: 'API Parent Task',
        tags: ['api', 'parent']
      });
      
      await repo.createTask({
        title: 'API Child Task',
        tags: ['api', 'child'],
        childOf: parentTask.id
      });
      
      // Export all tasks in JSON format
      await apiCommand.commands[0].action({
        format: 'json',
        output: testFiles.outputFilePath
      });
      
      // Read the output file and verify content
      const outputContent = await fs.readFile(testFiles.outputFilePath, 'utf-8');
      expect(outputContent).toBeTruthy();
      
      // Parse and validate the exported data
      const exportData = JSON.parse(outputContent);
      expect(exportData.type).toBe('full');
      expect(exportData.tasks.length).toBe(4);
      expect(exportData.tasks.some((t: any) => t.title === 'API Test Task 1')).toBe(true);
      expect(exportData.tasks.some((t: any) => t.title === 'API Test Task 2')).toBe(true);
      expect(exportData.tasks.some((t: any) => t.title === 'API Parent Task')).toBe(true);
      expect(exportData.tasks.some((t: any) => t.title === 'API Child Task')).toBe(true);
      
      // Verify child task has parent ID
      const childTask = exportData.tasks.find((t: any) => t.title === 'API Child Task');
      expect(childTask).toBeDefined();
      expect(childTask.parent_id).toBeDefined();
      expect(childTask.parent_id).toBe(parentTask.id);
    });
  });
  
  it('should export tasks with filtering', async () => {
    return fixture.withTransaction(async () => {
      // Create some test tasks
      await repo.createTask({
        title: 'API Test Task 1',
        tags: ['api', 'test']
      });
      
      await repo.createTask({
        title: 'API Test Task 2',
        tags: ['api', 'important'],
        status: 'in-progress'
      });
      
      // Export with filter
      await apiCommand.commands[0].action({
        format: 'json',
        filter: 'tag:important',
        output: testFiles.outputFilePath
      });
      
      // Read and verify the filtered output
      const outputContent = await fs.readFile(testFiles.outputFilePath, 'utf-8');
      expect(outputContent).toBeTruthy();
      
      const exportData = JSON.parse(outputContent);
      expect(exportData.tasks.length).toBe(1);
      expect(exportData.tasks[0].title).toBe('API Test Task 2');
      expect(exportData.tasks[0].tags).toContain('important');
    });
  });
  
  it('should import tasks from file', async () => {
    return fixture.withTransaction(async () => {
      // Verify no tasks exist initially
      const initialTasks = await repo.getAllTasks();
      expect(initialTasks.data?.length || 0).toBe(0);
      
      // Import tasks from file
      await apiCommand.commands[1].action({
        input: testFiles.inputFilePath
      });
      
      // Verify tasks were imported correctly
      const importedTasks = await repo.getAllTasks();
      expect(importedTasks.data?.length || 0).toBe(2);
      expect(importedTasks.data?.some(t => t.title === 'Imported Test Task 1')).toBe(true);
      expect(importedTasks.data?.some(t => t.title === 'Imported Test Task 2')).toBe(true);
      
      // Verify tags were imported
      const task1 = importedTasks.data?.find(t => t.title === 'Imported Test Task 1');
      expect(task1?.tags).toContain('api');
      expect(task1?.tags).toContain('test');

      // Verify status was imported
      const task2 = importedTasks.data?.find(t => t.title === 'Imported Test Task 2');
      expect(task2?.status).toBe('in-progress');
    });
  });
  
  it('should perform dry run import without adding tasks', async () => {
    return fixture.withTransaction(async () => {
      // Verify no tasks exist initially
      const initialTasks = await repo.getAllTasks();
      expect(initialTasks.data?.length || 0).toBe(0);
      
      // Import tasks with dry run
      await apiCommand.commands[1].action({
        input: testFiles.inputFilePath,
        dryRun: true
      });
      
      // Verify no tasks were added
      const afterTasks = await repo.getAllTasks();
      expect(afterTasks.length).toBe(0);
    });
  });
  
  it('should handle batch operations', async () => {
    return fixture.withTransaction(async () => {
      // Execute batch operations
      await apiCommand.commands[2].action({
        input: testFiles.batchFilePath
      });
      
      // Verify batch operations executed correctly
      const tasks = await repo.getAllTasks();
      expect(tasks.data?.length || 0).toBe(1);
      const task = tasks.data?.[0];
      expect(task?.title).toBe('Batch Add Task');
      expect(task?.tags).toContain('batch');
      expect(task?.tags).toContain('test');
    });
  });
});

/**
 * Helper to create test files for API command testing
 */
async function createTestApiFiles(): Promise<{
  inputFilePath: string;
  batchFilePath: string;
  outputFilePath: string;
}> {
  const inputFilePath = path.join(tempDir, 'api-test-input.json');
  const batchFilePath = path.join(tempDir, 'api-test-batch.json');
  const outputFilePath = path.join(tempDir, 'api-test-output.json');
  
  // Create import data file
  const importData = {
    tasks: [
      {
        title: "Imported Test Task 1",
        status: "todo",
        tags: ["api", "test"],
        metadata: { source: "api-test" }
      },
      {
        title: "Imported Test Task 2",
        status: "in-progress",
        tags: ["api", "important"],
        metadata: { priority: "high" }
      }
    ]
  };

  // Log directory and paths
  console.log('Directory created or exists');
  console.log(`Input path: ${inputFilePath}`);
  console.log(`Batch path: ${batchFilePath}`);
  console.log(`Output path: ${outputFilePath}`);

  try {
    await fs.writeFile(inputFilePath, JSON.stringify(importData, null, 2));
    console.log('Input file created');
  } catch (err) {
    console.error('Error creating input file:', err);
  }

  // Create batch operations file
  const batchData = {
    operations: [
      {
        type: "add",
        data: {
          title: "Batch Add Task",
          tags: ["batch", "test"],
          status: "todo"
        }
      },
      {
        type: "search",
        data: {
          tags: ["batch"]
        }
      }
    ]
  };

  try {
    await fs.writeFile(batchFilePath, JSON.stringify(batchData, null, 2));
    console.log('Batch file created');
  } catch (err) {
    console.error('Error creating batch file:', err);
  }

  // Create an empty output file
  try {
    await fs.writeFile(outputFilePath, '');
    console.log('Output file created');
  } catch (err) {
    console.error('Error creating output file:', err);
  }

  console.log(`Created test files. Output path: ${outputFilePath}`);
  
  return {
    inputFilePath,
    batchFilePath,
    outputFilePath
  };
}