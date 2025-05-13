import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo';
import { createNextCommand } from '../../cli/commands/next/index';
import { 
  captureConsoleOutput, 
  restoreConsole,
  getConsoleOutput
} from './test-helpers';

test('Next Command - single and multiple next tasks', async () => {
  // Create repo with in-memory DB for testing and use legacy mode
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create several tasks with different priorities (IDs), statuses, and readiness
  await repo.createTask({
    title: 'Task 1',
    status: 'todo',
    readiness: 'ready',
    tags: ['test', 'priority']
  });
  
  await repo.createTask({
    title: 'Task 2',
    status: 'todo',
    readiness: 'ready',
    tags: ['test']
  });
  
  await repo.createTask({
    title: 'Task 3',
    status: 'todo',
    readiness: 'draft', // Not ready
    tags: ['test']
  });
  
  await repo.createTask({
    title: 'Task 4',
    status: 'in-progress', // Not todo
    readiness: 'ready',
    tags: ['test']
  });
  
  await repo.createTask({
    title: 'Task 5',
    status: 'todo',
    readiness: 'ready',
    tags: ['priority']
  });
  
  // Get the next command setup
  const nextCommand = createNextCommand();
  
  // Test 1: Basic next task (should be Task 1)
  captureConsoleOutput();
  await nextCommand.action({
    format: 'text',
    count: '1'
  });
  assert.ok(getConsoleOutput().some(o => o.includes('Next task: 1. Task 1')));
  restoreConsole();
  
  // Test 2: Next task with filter (should be Task 5)
  captureConsoleOutput();
  await nextCommand.action({
    format: 'text',
    count: '1',
    filter: 'priority',
    status: 'todo',
    readiness: 'ready'
  });
  // Should find either Task 1 or Task 5 depending on how they're sorted
  const taskOutput = getConsoleOutput().join(' ');
  assert.ok(
    taskOutput.includes('Task 1') || 
    taskOutput.includes('Task 5')
  );
  assert.ok(taskOutput.includes('Tags: priority') || taskOutput.includes('Tags: test, priority'));
  restoreConsole();
  
  // Test 3: Multiple next tasks
  captureConsoleOutput();
  await nextCommand.action({
    format: 'text',
    count: '3',
    readiness: 'ready',
    status: 'todo'
  });
  const multiOutput = getConsoleOutput().join(' ');
  assert.ok(multiOutput.includes('Found 3 next tasks'));
  assert.ok(multiOutput.includes('Task 1'));
  assert.ok(multiOutput.includes('Task 2'));
  assert.ok(multiOutput.includes('Task 5'));
  restoreConsole();
  
  // Test 4: JSON format output
  captureConsoleOutput();
  await nextCommand.action({
    format: 'json',
    count: '2'
  });
  const jsonOutput = getConsoleOutput().join(' ');
  assert.ok(jsonOutput.includes('['));
  assert.ok(jsonOutput.includes(']'));
  
  // Parse the JSON to verify structure
  const tasks = JSON.parse(jsonOutput);
  assert.equal(tasks.length, 2);
  assert.equal(typeof tasks[0].id, 'string');
  assert.equal(typeof tasks[0].title, 'string');
  assert.ok(Array.isArray(tasks[0].tags));
  restoreConsole();
  
  // Test 5: No matching tasks
  captureConsoleOutput();
  await nextCommand.action({
    format: 'text',
    status: 'done', // No tasks are done
    count: '1'
  });
  assert.ok(getConsoleOutput().some(o => o.includes('No tasks found matching the criteria')));
  restoreConsole();
  
  // Clean up
  repo.close();
});

test.run();