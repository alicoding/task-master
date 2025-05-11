import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo.ts';
import { createNextCommand } from '../../cli/commands/next/index.ts';

test('Next Command - basic functionality', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create a task for testing
  await repo.createTask({
    title: 'Test Next Task',
    status: 'todo',
    readiness: 'ready'
  });
  
  // Get the next command reference
  const nextCommand = createNextCommand();
  
  // Verify command structure
  assert.ok(nextCommand);
  assert.equal(typeof nextCommand.action, 'function');
  
  // Verify command accepts required options
  assert.ok(nextCommand.options.some(opt => opt.flags.includes('--filter')));
  assert.ok(nextCommand.options.some(opt => opt.flags.includes('--status')));
  assert.ok(nextCommand.options.some(opt => opt.flags.includes('--readiness')));
  assert.ok(nextCommand.options.some(opt => opt.flags.includes('--format')));
  assert.ok(nextCommand.options.some(opt => opt.flags.includes('--count')));
  
  // Clean up
  repo.close();
});

test.run();