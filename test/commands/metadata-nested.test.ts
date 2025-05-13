/**
 * Tests for Metadata Command with nested field access
 * Verifies the CLI command correctly handles nested metadata fields
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { stub } from 'sinon';
import { TaskRepository } from '../../core/repo';
import { MetadataCommandHandler } from '../../cli/commands/metadata/metadata-command';

// Setup variables
let repo;
let taskId;
let handler;
let consoleLogStub;
let consoleLogCalls = [];

// Setup before each test
test.before.each(async () => {
  // Create an in-memory repository
  repo = new TaskRepository('./test.db', true);
  handler = new MetadataCommandHandler('metadata', repo);
  
  // Create a test task with nested metadata
  const result = await repo.createTask({
    title: 'Test Nested Metadata',
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
      nestedArray: [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' }
      ],
      nested: {
        key1: 'value1',
        key2: 'value2',
        deep: {
          property: 'deep value'
        }
      }
    }
  });
  
  assert.ok(result.success, 'Task creation should succeed');
  if (result.success && result.data) {
    taskId = result.data.id;
  }
  
  // Stub console.log to capture output
  consoleLogCalls = [];
  consoleLogStub = stub(console, 'log').callsFake((...args) => {
    consoleLogCalls.push(args.join(' '));
  });
});

// Cleanup after each test
test.after.each(() => {
  if (repo) {
    repo.close();
  }
  if (consoleLogStub && consoleLogStub.restore) {
    consoleLogStub.restore();
  }
});

test('display all metadata correctly', async () => {
  await handler.handleGetMetadata({ id: taskId }, 'text');
  
  // Check that console.log was called with the metadata
  const titleLogFound = consoleLogCalls.some(call => 
    call.includes(`Metadata for task ${taskId}:`)
  );
  assert.ok(titleLogFound, 'Title should be displayed');
  
  // Check that one of the console.log calls contained the metadata JSON
  const metadataLogFound = consoleLogCalls.some(call => 
    call.includes('"config":') && 
    call.includes('"enabled": true') && 
    call.includes('"color": "blue"') && 
    call.includes('"features": [')
  );
  
  assert.ok(metadataLogFound, 'Metadata content should be displayed');
});

test('retrieve a specific field correctly', async () => {
  await handler.handleGetMetadata({ id: taskId, field: 'config' }, 'text');
  
  const titleLogFound = consoleLogCalls.some(call => 
    call.includes(`Metadata field 'config' for task ${taskId}:`)
  );
  assert.ok(titleLogFound, 'Field title should be displayed');
  
  // Verify the config object was returned
  const configLogFound = consoleLogCalls.some(call => 
    call.includes('"enabled":') && call.includes('"options":')
  );
  
  assert.ok(configLogFound, 'Config content should be displayed');
});

test('retrieve a nested field using dot notation', async () => {
  await handler.handleGetMetadata({ id: taskId, field: 'config.options.color' }, 'text');
  
  const titleLogFound = consoleLogCalls.some(call => 
    call.includes(`Metadata field 'config.options.color' for task ${taskId}:`)
  );
  assert.ok(titleLogFound, 'Nested field title should be displayed');
  
  // Verify the nested value was returned
  const valueLogFound = consoleLogCalls.some(call => 
    call.includes('"blue"')
  );
  
  assert.ok(valueLogFound, 'Nested field value should be displayed');
});

test('retrieve a deeply nested field using dot notation', async () => {
  await handler.handleGetMetadata({ id: taskId, field: 'nested.deep.property' }, 'text');
  
  const titleLogFound = consoleLogCalls.some(call => 
    call.includes(`Metadata field 'nested.deep.property' for task ${taskId}:`)
  );
  assert.ok(titleLogFound, 'Deep nested field title should be displayed');
  
  // Verify the nested value was returned
  const valueLogFound = consoleLogCalls.some(call => 
    call.includes('"deep value"')
  );
  
  assert.ok(valueLogFound, 'Deep nested field value should be displayed');
});

test('show undefined for non-existent nested field', async () => {
  await handler.handleGetMetadata({ id: taskId, field: 'config.nonexistent' }, 'text');
  
  const titleLogFound = consoleLogCalls.some(call => 
    call.includes(`Metadata field 'config.nonexistent' for task ${taskId}:`)
  );
  assert.ok(titleLogFound, 'Non-existent field title should be displayed');
  
  // Verify undefined was returned
  const undefinedLogFound = consoleLogCalls.some(call => 
    call === 'undefined'
  );
  
  assert.ok(undefinedLogFound, 'Undefined should be displayed for non-existent field');
});

test('access array elements via dot notation indices', async () => {
  await handler.handleGetMetadata({ id: taskId, field: 'items.0' }, 'text');
  
  const titleLogFound = consoleLogCalls.some(call => 
    call.includes(`Metadata field 'items.0' for task ${taskId}:`)
  );
  assert.ok(titleLogFound, 'Array index field title should be displayed');
  
  // Verify the array element was returned
  const valueLogFound = consoleLogCalls.some(call => 
    call.includes('"item1"')
  );
  
  assert.ok(valueLogFound, 'Array element should be displayed');
});

test('access properties of objects in arrays', async () => {
  await handler.handleGetMetadata({ id: taskId, field: 'nestedArray.1.name' }, 'text');
  
  const titleLogFound = consoleLogCalls.some(call => 
    call.includes(`Metadata field 'nestedArray.1.name' for task ${taskId}:`)
  );
  assert.ok(titleLogFound, 'Array object property field title should be displayed');
  
  // Verify the nested array property was returned
  const valueLogFound = consoleLogCalls.some(call => 
    call.includes('"Second"')
  );
  
  assert.ok(valueLogFound, 'Array object property should be displayed');
});

test('output entire metadata as JSON', async () => {
  await handler.handleGetMetadata({ id: taskId }, 'json');
  
  // Check if any output is valid JSON with the expected structure
  const jsonFound = consoleLogCalls.some(call => {
    try {
      const parsed = JSON.parse(call);
      return (
        parsed.config && 
        parsed.config.enabled === true && 
        parsed.items && 
        Array.isArray(parsed.items) && 
        parsed.nested && 
        parsed.nested.deep && 
        parsed.nested.deep.property === 'deep value'
      );
    } catch (e) {
      return false;
    }
  });
  
  assert.ok(jsonFound, 'Complete metadata should be returned as JSON');
});

test('output a specific field as JSON', async () => {
  await handler.handleGetMetadata({ id: taskId, field: 'config.options' }, 'json');
  
  // Check if any output is valid JSON with the expected structure
  const jsonFound = consoleLogCalls.some(call => {
    try {
      const parsed = JSON.parse(call);
      return (
        parsed.field === 'config.options' || // Direct repository return format
        (parsed.value && // API return format
         parsed.value.color === 'blue' && 
         parsed.value.size === 'medium' && 
         Array.isArray(parsed.value.features))
      );
    } catch (e) {
      return false;
    }
  });
  
  assert.ok(jsonFound, 'Field should be returned as JSON');
});

// Run all tests
test.run();