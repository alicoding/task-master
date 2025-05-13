/**
 * Tests for metadata command
 * Verifies that the CLI metadata command correctly handles nested fields
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import * as sinon from 'sinon';
import { TaskRepository } from '../../core/repo';
import { MetadataCommandHandler } from '../../cli/commands/metadata/metadata-command';
import { OutputFormat } from '../../core/types';

// Test variables
let repo: TaskRepository;
let taskId: string;
let handler: MetadataCommandHandler;
let consoleLogStub: sinon.SinonStub;
let consoleErrorStub: sinon.SinonStub;
let consoleLogCalls: string[] = [];

// Setup before tests
test.before.each(async () => {
  // Create in-memory repository
  repo = new TaskRepository('./test.db', true);
  handler = new MetadataCommandHandler('metadata', repo);
  
  // Create test task with nested metadata
  const result = await repo.createTask({
    title: 'Metadata Command Test',
    metadata: {
      config: {
        enabled: true,
        options: {
          color: 'blue',
          size: 'medium',
          features: ['a', 'b', 'c']
        }
      },
      items: ['item1', 'item2'],
      nested: {
        key1: 'value1',
        key2: 'value2',
        deep: {
          property: 'nested value'
        }
      }
    }
  });
  
  assert.ok(result.success, 'Task creation should succeed');
  if (result.success && result.data) {
    taskId = result.data.id;
  }
  
  // Stub console output
  consoleLogCalls = [];
  consoleLogStub = sinon.stub(console, 'log').callsFake((...args: any[]) => {
    consoleLogCalls.push(args.map(arg => String(arg)).join(' '));
  });
  consoleErrorStub = sinon.stub(console, 'error');
});

// Cleanup after tests
test.after.each(() => {
  if (repo) {
    repo.close();
  }
  if (consoleLogStub && consoleLogStub.restore) {
    consoleLogStub.restore();
  }
  if (consoleErrorStub && consoleErrorStub.restore) {
    consoleErrorStub.restore();
  }
});

// Test getting all metadata
test('handleGetMetadata - get all metadata', async () => {
  await handler.handleGetMetadata({ id: taskId }, 'text' as OutputFormat);
  
  // Check for title line
  const titleLine = consoleLogCalls.find(call => call.includes(`Metadata for task ${taskId}:`));
  assert.ok(titleLine, 'Title line should be displayed');
  
  // Check for metadata content
  const metadataLine = consoleLogCalls.find(call => 
    call.includes('"config"') && 
    call.includes('"enabled": true') && 
    call.includes('"nested"') && 
    call.includes('"items"')
  );
  assert.ok(metadataLine, 'Metadata content should be displayed');
});

// Test getting a specific field
test('handleGetMetadata - get specific field', async () => {
  await handler.handleGetMetadata({ id: taskId, field: 'config' }, 'text' as OutputFormat);
  
  // Check for title line
  const titleLine = consoleLogCalls.find(call => call.includes(`Metadata field 'config' for task ${taskId}:`));
  assert.ok(titleLine, 'Field title should be displayed');
  
  // Check for field content
  const fieldLine = consoleLogCalls.find(call => 
    call.includes('"enabled"') && call.includes('"options"')
  );
  assert.ok(fieldLine, 'Field content should be displayed');
});

// Test getting a nested field
test('handleGetMetadata - get nested field with dot notation', async () => {
  await handler.handleGetMetadata({ id: taskId, field: 'nested.deep.property' }, 'text' as OutputFormat);
  
  // Check for title line
  const titleLine = consoleLogCalls.find(call => call.includes(`Metadata field 'nested.deep.property' for task ${taskId}:`));
  assert.ok(titleLine, 'Nested field title should be displayed');
  
  // Check for nested value
  const valueLine = consoleLogCalls.find(call => call.includes('"nested value"'));
  assert.ok(valueLine, 'Nested field value should be displayed');
});

// Test setting a new field
test('handleSetMetadata - set a new field', async () => {
  await handler.handleSetMetadata({ id: taskId, field: 'newField', value: 'new value' }, 'text' as OutputFormat);
  
  // Check for confirmation message
  const confirmLine = consoleLogCalls.find(call => call.includes(`Metadata field 'newField' set for task ${taskId}`));
  assert.ok(confirmLine, 'Confirmation message should be displayed');
  
  // Check that the field was actually set
  const value = await repo.getMetadataField(taskId, 'newField');
  assert.equal(value, 'new value', 'Field should be set in the repository');
});

// Test setting a nested JSON object
test('handleSetMetadata - set a nested JSON object', async () => {
  const jsonValue = '{"nested":{"value":42}}';
  await handler.handleSetMetadata({ id: taskId, field: 'complex', value: jsonValue }, 'text' as OutputFormat);
  
  // Check for confirmation message
  const confirmLine = consoleLogCalls.find(call => call.includes(`Metadata field 'complex' set for task ${taskId}`));
  assert.ok(confirmLine, 'Confirmation message should be displayed');
  
  // Check that the object was correctly parsed and set
  const value = await repo.getMetadataField(taskId, 'complex.nested.value');
  assert.equal(value, 42, 'Nested field in JSON object should be set correctly');
});

// Test removing a field
test('handleRemoveMetadata - remove a field', async () => {
  // First set a field to remove
  await handler.handleSetMetadata({ id: taskId, field: 'toRemove', value: 'temp' }, 'text' as OutputFormat);
  
  // Clear the log calls
  consoleLogCalls = [];
  
  // Now remove the field
  await handler.handleRemoveMetadata({ id: taskId, field: 'toRemove' }, 'text' as OutputFormat);
  
  // Check for confirmation message
  const confirmLine = consoleLogCalls.find(call => call.includes(`Metadata field 'toRemove' removed from task ${taskId}`));
  assert.ok(confirmLine, 'Confirmation message should be displayed');
  
  // Check that the field was actually removed
  const value = await repo.getMetadataField(taskId, 'toRemove');
  assert.equal(value, undefined, 'Field should be removed from the repository');
});

// Test appending to a field
test('handleAppendMetadata - append to a field', async () => {
  // First set up an array field
  await handler.handleSetMetadata({ id: taskId, field: 'tags', value: '["first"]' }, 'text' as OutputFormat);
  
  // Clear the log calls
  consoleLogCalls = [];
  
  // Now append to it
  await handler.handleAppendMetadata({ id: taskId, field: 'tags', value: 'second' }, 'text' as OutputFormat);
  
  // Check for confirmation message
  const confirmLine = consoleLogCalls.find(call => call.includes(`Value appended to metadata field 'tags' for task ${taskId}`));
  assert.ok(confirmLine, 'Confirmation message should be displayed');
  
  // Check that the value was appended
  const value = await repo.getMetadataField(taskId, 'tags');
  assert.equal(JSON.stringify(value), JSON.stringify(['first', 'second']), 'Value should be appended to the array');
});

// Test JSON format output
test('handleGetMetadata - JSON format', async () => {
  await handler.handleGetMetadata({ id: taskId }, 'json' as OutputFormat);
  
  // Find a line that contains valid JSON with the expected structure
  const jsonLine = consoleLogCalls.find(call => {
    try {
      const parsed = JSON.parse(call);
      return (
        parsed.config && 
        parsed.config.enabled === true && 
        parsed.items && 
        Array.isArray(parsed.items) && 
        parsed.nested && 
        parsed.nested.deep && 
        parsed.nested.deep.property === 'nested value'
      );
    } catch (e) {
      return false;
    }
  });
  
  assert.ok(jsonLine, 'Complete metadata should be returned as JSON');
});

// Run all tests
test.run();