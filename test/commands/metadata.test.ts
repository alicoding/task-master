import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo.js';
import { createMetadataCommand } from '../../cli/commands/metadata/index.js';
import { 
  captureConsoleOutput, 
  restoreConsole,
  getConsoleOutput,
  createCommandParent
} from './test-helpers.js';

test('Metadata Command - get, set, remove operations', async () => {
  // Create repo with in-memory DB for testing and use legacy mode
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create a task to work with
  const task = await repo.createTask({
    title: 'Test Metadata Task'
  });
  
  // Get the metadata command setup
  const metadataCommand = createMetadataCommand();
  
  // Test 1: Set metadata
  captureConsoleOutput();
  await metadataCommand.commands[1].action(
    { id: task.id, field: 'priority', value: 'high' },
    { parent: createCommandParent('text') }
  );
  assert.ok(getConsoleOutput().some(o => o.includes('Metadata field \'priority\' set for task')));
  restoreConsole();
  
  // Verify metadata was set correctly
  let updatedTask = await repo.getTask(task.id);
  assert.equal(updatedTask.metadata.priority, 'high');
  
  // Test 2: Get metadata
  captureConsoleOutput();
  await metadataCommand.commands[0].action(
    { id: task.id },
    { parent: createCommandParent('text') }
  );
  const output = getConsoleOutput();
  assert.ok(output.some(o => o.includes('Metadata for task')));
  assert.ok(output.some(o => o.includes('priority')));
  assert.ok(output.some(o => o.includes('high')));
  restoreConsole();
  
  // Test 3: Get specific metadata field
  captureConsoleOutput();
  await metadataCommand.commands[0].action(
    { id: task.id, field: 'priority' },
    { parent: createCommandParent('text') }
  );
  const fieldOutput = getConsoleOutput();
  assert.ok(fieldOutput.some(o => o.includes('Metadata field \'priority\'')));
  assert.ok(fieldOutput.some(o => o.includes('high')));
  restoreConsole();
  
  // Test 4: Set JSON metadata
  captureConsoleOutput();
  await metadataCommand.commands[1].action(
    { id: task.id, field: 'details', value: '{"complexity":"medium","estimate":3}' },
    { parent: createCommandParent('text') }
  );
  assert.ok(getConsoleOutput().some(o => o.includes('Metadata field \'details\' set for task')));
  restoreConsole();
  
  // Verify complex metadata was set correctly
  updatedTask = await repo.getTask(task.id);
  assert.equal(updatedTask.metadata.details.complexity, 'medium');
  assert.equal(updatedTask.metadata.details.estimate, 3);
  
  // Test 5: Append to metadata array
  // First set the initial array
  await metadataCommand.commands[1].action(
    { id: task.id, field: 'notes', value: '["Initial note"]' },
    { parent: createCommandParent('text') }
  );
  
  // Now append to it
  captureConsoleOutput();
  await metadataCommand.commands[3].action(
    { id: task.id, field: 'notes', value: 'Second note' },
    { parent: createCommandParent('text') }
  );
  assert.ok(getConsoleOutput().some(o => o.includes('Value appended to metadata field')));
  restoreConsole();
  
  // Verify array metadata was appended correctly
  updatedTask = await repo.getTask(task.id);
  assert.equal(updatedTask.metadata.notes.length, 2);
  assert.equal(updatedTask.metadata.notes[0], 'Initial note');
  assert.equal(updatedTask.metadata.notes[1], 'Second note');
  
  // Test 6: Remove metadata field
  captureConsoleOutput();
  await metadataCommand.commands[2].action(
    { id: task.id, field: 'priority' },
    { parent: createCommandParent('text') }
  );
  assert.ok(getConsoleOutput().some(o => o.includes('Metadata field \'priority\' removed from task')));
  restoreConsole();
  
  // Verify field was removed
  updatedTask = await repo.getTask(task.id);
  assert.equal(updatedTask.metadata.priority, undefined);
  
  // Test 7: JSON format output
  captureConsoleOutput();
  await metadataCommand.commands[0].action(
    { id: task.id },
    { parent: createCommandParent('json') }
  );
  const jsonOutput = getConsoleOutput().join(' ');
  assert.ok(jsonOutput.includes('{'));
  assert.ok(jsonOutput.includes('}'));
  assert.ok(!jsonOutput.includes('Metadata for task')); // Should not include text formatting
  restoreConsole();
  
  // Clean up
  repo.close();
});

test.run();