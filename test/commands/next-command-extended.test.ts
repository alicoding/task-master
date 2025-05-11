/**
 * Extended integration tests for Next Command
 * Verifies that the next command correctly identifies the next task to work on
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import * as sinon from 'sinon';
import { TaskRepository } from '../../core/repo.ts';

// Import test helpers
import { createTestRepository, createSampleTasks } from '../core/test-helpers.ts';

// Test variables
let repo: TaskRepository;
let taskIds: string[];
let consoleLogStub: sinon.SinonStub;
let consoleErrorStub: sinon.SinonStub;
let consoleLogCalls: string[] = [];
let consoleErrorCalls: string[] = [];

// Setup before tests
test.before.each(async () => {
  // Create in-memory repository
  repo = createTestRepository();
  
  // Create sample tasks
  taskIds = await createSampleTasks(repo);
  
  // Stub console output
  consoleLogCalls = [];
  consoleErrorCalls = [];
  
  consoleLogStub = sinon.stub(console, 'log').callsFake((...args: any[]) => {
    consoleLogCalls.push(args.map(arg => String(arg)).join(' '));
  });
  
  consoleErrorStub = sinon.stub(console, 'error').callsFake((...args: any[]) => {
    consoleErrorCalls.push(args.map(arg => String(arg)).join(' '));
  });
});

// Cleanup after tests
test.after.each(() => {
  // Close repository
  if (repo) {
    repo.close();
  }
  
  // Restore console stubs
  if (consoleLogStub && consoleLogStub.restore) {
    consoleLogStub.restore();
  }
  
  if (consoleErrorStub && consoleErrorStub.restore) {
    consoleErrorStub.restore();
  }
});

// Test basic next command functionality
test('finds a single next task by default', async () => {
  // Create the command handler
  const { createNextCommand } = await import('../../cli/commands/next/index.ts');
  const nextCommand = createNextCommand();
  
  // Execute the command action
  await nextCommand.action({
    format: 'text',
    count: '1'
  });
  
  // Verify it found a task
  const nextTaskLine = consoleLogCalls.find(call => call.startsWith('Next task:'));
  assert.ok(nextTaskLine, 'Should find a next task');
  
  // Verify it includes the status, readiness, and tags
  const statusLine = consoleLogCalls.find(call => call.startsWith('Status:'));
  assert.ok(statusLine, 'Should include status information');
  
  const readinessLine = consoleLogCalls.find(call => call.startsWith('Readiness:'));
  assert.ok(readinessLine, 'Should include readiness information');
  
  const tagsLine = consoleLogCalls.find(call => call.startsWith('Tags:'));
  assert.ok(tagsLine, 'Should include tags information');
});

// Test finding multiple next tasks
test('finds multiple next tasks when count is greater than 1', async () => {
  // Create the command handler
  const { createNextCommand } = await import('../../cli/commands/next/index.ts');
  const nextCommand = createNextCommand();
  
  // Execute the command action
  await nextCommand.action({
    format: 'text',
    count: '3'
  });
  
  // Verify it found multiple tasks
  const foundTasksLine = consoleLogCalls.find(call => call.startsWith('Found '));
  assert.ok(foundTasksLine, 'Should indicate multiple tasks found');
  
  // Should be numbering the tasks
  const numberedTasks = consoleLogCalls.filter(call => /^\d+\./.test(call.trim()));
  assert.ok(numberedTasks.length > 0, 'Should list multiple tasks with numbers');
});

// Test filtering next tasks by tag
test('filters next tasks by tag', async () => {
  // Create the command handler
  const { createNextCommand } = await import('../../cli/commands/next/index.ts');
  const nextCommand = createNextCommand();
  
  // Execute the command action with tag filter
  await nextCommand.action({
    format: 'text',
    filter: 'important', // Using a tag that exists in sample tasks
    count: '5'
  });
  
  // Check if we found tasks with the important tag
  let foundImportantTasks = false;
  
  // Look for either a single result or multiple results
  const singleNextTask = consoleLogCalls.find(call => call.startsWith('Next task:'));
  const multipleTasks = consoleLogCalls.find(call => call.startsWith('Found '));
  
  // Check if we have matches for important tag
  if (singleNextTask) {
    // Single task mode
    const tagsLine = consoleLogCalls.find(call => call.startsWith('Tags:'));
    foundImportantTags = tagsLine && tagsLine.includes('important');
  } else if (multipleTasks) {
    // Multiple tasks mode
    const tagsLines = consoleLogCalls.filter(call => call.includes('Tags:'));
    foundImportantTags = tagsLines.some(line => line.includes('important'));
  }
  
  assert.ok(foundImportantTags || consoleLogCalls.includes('No tasks found matching the criteria'), 
    'Should find tasks with important tag or indicate no matching tasks');
});

// Test filtering next tasks by status
test('filters next tasks by status', async () => {
  // Create the command handler
  const { createNextCommand } = await import('../../cli/commands/next/index.ts');
  const nextCommand = createNextCommand();
  
  // Execute the command action with status filter
  await nextCommand.action({
    format: 'text',
    status: 'todo',
    count: '2'
  });
  
  // Check if we found tasks with todo status
  let foundTodoTasks = false;
  
  // Look through all console output for status: todo
  consoleLogCalls.forEach(line => {
    if (line.includes('Status: todo')) {
      foundTodoTasks = true;
    }
  });
  
  assert.ok(foundTodoTasks || consoleLogCalls.includes('No tasks found matching the criteria'), 
    'Should find todo tasks or indicate no matching tasks');
});

// Test filtering next tasks by readiness
test('filters next tasks by readiness', async () => {
  // Create the command handler
  const { createNextCommand } = await import('../../cli/commands/next/index.ts');
  const nextCommand = createNextCommand();
  
  // Execute the command action with readiness filter
  await nextCommand.action({
    format: 'text',
    readiness: 'ready',
    count: '2'
  });
  
  // Check if we found tasks with ready readiness
  let foundReadyTasks = false;
  
  // Look through all console output for readiness: ready
  consoleLogCalls.forEach(line => {
    if (line.includes('Readiness: ready')) {
      foundReadyTasks = true;
    }
  });
  
  assert.ok(foundReadyTasks || consoleLogCalls.includes('No tasks found matching the criteria'), 
    'Should find ready tasks or indicate no matching tasks');
});

// Test JSON output format
test('returns JSON output when format is json', async () => {
  // Create the command handler
  const { createNextCommand } = await import('../../cli/commands/next/index.ts');
  const nextCommand = createNextCommand();
  
  // Execute the command action
  await nextCommand.action({
    format: 'json',
    count: '2'
  });
  
  // Find a line that contains valid JSON
  const jsonLine = consoleLogCalls.find(call => {
    try {
      const parsed = JSON.parse(call);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch (e) {
      return false;
    }
  });
  
  assert.ok(jsonLine, 'Should output tasks in JSON format');
  
  // Verify the parsed JSON has expected task fields
  try {
    const tasks = JSON.parse(jsonLine);
    assert.ok(tasks[0].id, 'Task should have an ID');
    assert.ok(tasks[0].title, 'Task should have a title');
    assert.ok(tasks[0].status, 'Task should have a status');
    assert.ok(tasks[0].readiness, 'Task should have a readiness');
  } catch (e) {
    assert.fail('Failed to parse JSON output: ' + e);
  }
});

// Test handling of empty result set
test('handles case when no tasks match criteria', async () => {
  // Create the command handler
  const { createNextCommand } = await import('../../cli/commands/next/index.ts');
  const nextCommand = createNextCommand();
  
  // Execute the command action with criteria unlikely to match any tasks
  await nextCommand.action({
    format: 'text',
    filter: 'non-existent-tag-123',
    count: '1'
  });
  
  // Should show no tasks found message
  const noTasksLine = consoleLogCalls.find(call => call.includes('No tasks found'));
  assert.ok(noTasksLine, 'Should indicate when no tasks match criteria');
});

// Test next task selection prioritization
test('prioritizes ready tasks over draft tasks', async () => {
  // First make sure we have a draft and ready task
  const draftTask = await repo.createTask({
    title: 'Draft Priority Test Task',
    status: 'todo',
    readiness: 'draft',
    createdAt: Date.now() / 1000
  });
  
  const readyTask = await repo.createTask({
    title: 'Ready Priority Test Task',
    status: 'todo',
    readiness: 'ready',
    createdAt: Date.now() / 1000 - 1  // Make it older so it's not prioritized by time
  });
  
  // Reset console log calls
  consoleLogCalls = [];
  
  // Create the command handler
  const { createNextCommand } = await import('../../cli/commands/next/index.ts');
  const nextCommand = createNextCommand();
  
  // Execute the command action to get a single next task
  await nextCommand.action({
    format: 'text',
    count: '1'
  });
  
  // The next task should be the ready one
  const nextTaskLine = consoleLogCalls.find(call => call.startsWith('Next task:'));
  const titleInOutput = nextTaskLine && nextTaskLine.includes('Ready Priority Test Task');
  
  assert.ok(titleInOutput, 'Should prioritize ready tasks over draft tasks');
});

// Run all tests
test.run();