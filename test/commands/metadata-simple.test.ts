import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo.js';
import { createMetadataCommand } from '../../cli/commands/metadata/index.js';

test('Metadata Command - basic functionality', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create a task to work with
  const task = await repo.createTask({
    title: 'Metadata Test Task'
  });
  
  // Get the metadata command setup
  const metadataCommand = createMetadataCommand();
  
  // Verify command structure
  assert.ok(metadataCommand);
  assert.ok(metadataCommand.commands);
  assert.ok(metadataCommand.commands.length > 0);
  
  // Test command components
  const getCmd = metadataCommand.commands.find(cmd => cmd.name() === 'get');
  assert.ok(getCmd);
  assert.equal(typeof getCmd.action, 'function');
  
  const setCmd = metadataCommand.commands.find(cmd => cmd.name() === 'set');
  assert.ok(setCmd);
  assert.equal(typeof setCmd.action, 'function');
  
  const removeCmd = metadataCommand.commands.find(cmd => cmd.name() === 'remove');
  assert.ok(removeCmd);
  assert.equal(typeof removeCmd.action, 'function');
  
  const appendCmd = metadataCommand.commands.find(cmd => cmd.name() === 'append');
  assert.ok(appendCmd);
  assert.equal(typeof appendCmd.action, 'function');
  
  // Clean up
  repo.close();
});

test.run();