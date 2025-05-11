/**
 * Integration tests for Update Command
 * Verifies that the update command correctly modifies existing tasks
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import * as sinon from 'sinon';
import { TaskRepository } from '../../core/repo.ts';
import { TaskStatus, TaskReadiness, Task } from '../../core/types.ts';

// Import test helpers
import { createTestRepository, createSampleTasks } from '../core/test-helpers.ts';

// Test variables
let repo: TaskRepository;
let taskIds: string[];
let consoleLogStub: sinon.SinonStub;
let consoleErrorStub: sinon.SinonStub;
let consoleLogCalls: string[] = [];
let consoleErrorCalls: string[] = [];

// Mock the interactive form
jest.mock('../../cli/commands/update/interactive-form.ts', () => ({
  InteractiveUpdateForm: class MockInteractiveForm {
    constructor(private task: Task, private repo: TaskRepository) {}
    
    run() {
      // Return a mock update result
      return Promise.resolve({
        id: this.task.id,
        title: 'Updated via interactive form',
        status: 'done' as TaskStatus
      });
    }
  }
}));

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

// Test updating a task's title
test('updates a task title', async () => {
  const taskId = taskIds[0];
  const newTitle = 'Updated Task Title';
  
  // Create the command handler and implement necessary methods to mimic CLI behavior
  const { createUpdateCommand } = await import('../../cli/commands/update/index.ts');
  const updateCommand = await createUpdateCommand();
  
  // Execute the command action with options
  await updateCommand.action({
    id: taskId,
    title: newTitle,
    format: 'text',
    dryRun: false
  });
  
  // Fetch the updated task directly from the repository
  const updatedTask = await repo.getTask(taskId);
  
  // Verify the task was updated
  assert.equal(updatedTask.title, newTitle, 'Task title should be updated');
  
  // Verify console output
  const successLine = consoleLogCalls.find(call => call.includes('updated successfully'));
  assert.ok(successLine, 'Should show success message');
});

// Test updating multiple fields
test('updates multiple task fields', async () => {
  const taskId = taskIds[1];
  const updates = {
    title: 'Multiple Updates Test',
    status: 'done' as TaskStatus,
    readiness: 'ready' as TaskReadiness,
    tags: ['updated', 'integration-test']
  };
  
  // Create the command handler
  const { createUpdateCommand } = await import('../../cli/commands/update/index.ts');
  const updateCommand = await createUpdateCommand();
  
  // Execute the command action
  await updateCommand.action({
    id: taskId,
    ...updates,
    format: 'text',
    dryRun: false
  });
  
  // Fetch the updated task
  const updatedTask = await repo.getTask(taskId);
  
  // Verify all fields were updated
  assert.equal(updatedTask.title, updates.title, 'Task title should be updated');
  assert.equal(updatedTask.status, updates.status, 'Task status should be updated');
  assert.equal(updatedTask.readiness, updates.readiness, 'Task readiness should be updated');
  assert.equal(JSON.stringify(updatedTask.tags), JSON.stringify(updates.tags), 'Task tags should be updated');
});

// Test updating task metadata
test('updates task metadata', async () => {
  const taskId = taskIds[2];
  const metadataJson = JSON.stringify({
    priority: 'high',
    complexity: 3,
    category: 'integration-test'
  });
  
  // Create the command handler
  const { createUpdateCommand } = await import('../../cli/commands/update/index.ts');
  const updateCommand = await createUpdateCommand();
  
  // Execute the command action
  await updateCommand.action({
    id: taskId,
    metadata: metadataJson,
    format: 'text',
    dryRun: false
  });
  
  // Fetch the updated task
  const updatedTask = await repo.getTask(taskId);
  
  // Verify metadata was updated
  assert.equal(updatedTask.metadata.priority, 'high', 'Metadata priority should be updated');
  assert.equal(updatedTask.metadata.complexity, 3, 'Metadata complexity should be updated');
  assert.equal(updatedTask.metadata.category, 'integration-test', 'Metadata category should be updated');
});

// Test dry run mode
test('does not update task in dry run mode', async () => {
  const taskId = taskIds[0];
  const originalTask = await repo.getTask(taskId);
  const newTitle = 'This Update Should Not Happen';
  
  // Create the command handler
  const { createUpdateCommand } = await import('../../cli/commands/update/index.ts');
  const updateCommand = await createUpdateCommand();
  
  // Execute the command action in dry run mode
  await updateCommand.action({
    id: taskId,
    title: newTitle,
    format: 'text',
    dryRun: true
  });
  
  // Fetch the task again
  const taskAfterDryRun = await repo.getTask(taskId);
  
  // Verify the task was not updated
  assert.equal(taskAfterDryRun.title, originalTask.title, 'Task title should not change in dry run');
  
  // Verify dry run message
  const dryRunLine = consoleLogCalls.find(call => call.includes('Would update task'));
  assert.ok(dryRunLine, 'Should show dry run message');
});

// Test JSON output format
test('returns JSON output when format is json', async () => {
  const taskId = taskIds[0];
  const newTitle = 'JSON Output Test';
  
  // Create the command handler
  const { createUpdateCommand } = await import('../../cli/commands/update/index.ts');
  const updateCommand = await createUpdateCommand();
  
  // Execute the command action with JSON format
  await updateCommand.action({
    id: taskId,
    title: newTitle,
    format: 'json',
    dryRun: false
  });
  
  // Find a line that contains valid JSON
  const jsonLine = consoleLogCalls.find(call => {
    try {
      const parsed = JSON.parse(call);
      return (
        parsed.id === taskId &&
        parsed.title === newTitle
      );
    } catch (e) {
      return false;
    }
  });
  
  assert.ok(jsonLine, 'Should output task in JSON format');
});

// Test error handling for invalid task ID
test('handles error when task ID is invalid', async () => {
  const invalidTaskId = 'non-existent-task';
  
  // Create the command handler
  const { createUpdateCommand } = await import('../../cli/commands/update/index.ts');
  const updateCommand = await createUpdateCommand();
  
  // Execute the command action with invalid ID
  await updateCommand.action({
    id: invalidTaskId,
    title: 'This Update Should Fail',
    format: 'text',
    dryRun: false
  });
  
  // Verify error message
  const errorLine = consoleErrorCalls.find(call => call.includes('not found'));
  assert.ok(errorLine, 'Should show error message for invalid task ID');
});

// Run all tests
test.run();