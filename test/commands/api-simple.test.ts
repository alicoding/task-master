import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo';
import { createApiCommand } from '../../cli/commands/api/index';

test('API Command - basic functionality', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create a sample task to work with
  await repo.createTask({
    title: 'API Test Task',
    tags: ['api', 'test']
  });
  
  // Get the API command reference
  const apiCommand = createApiCommand();
  
  // Verify API export command exists and has expected properties
  assert.ok(apiCommand);
  assert.ok(apiCommand.commands);
  assert.ok(apiCommand.commands.length > 0);
  
  // Verify export command
  const exportCmd = apiCommand.commands.find(cmd => cmd.name() === 'export');
  assert.ok(exportCmd);
  assert.equal(typeof exportCmd.action, 'function');
  
  // Verify import command
  const importCmd = apiCommand.commands.find(cmd => cmd.name() === 'import');
  assert.ok(importCmd);
  assert.equal(typeof importCmd.action, 'function');
  
  // Verify batch command
  const batchCmd = apiCommand.commands.find(cmd => cmd.name() === 'batch');
  assert.ok(batchCmd);
  assert.equal(typeof batchCmd.action, 'function');
  
  // Clean up
  repo.close();
});

test.run();