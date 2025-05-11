/**
 * Tests for TaskMetadataRepository
 * Verifies proper metadata handling, nested field access, and error handling
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo.ts';
import { TaskMetadataRepository } from '../../core/repository/metadata.ts';
import { TaskOperationResult, Task, TaskErrorCode } from '../../core/types.ts';

// Simple test for dot notation in metadata field access
test('getMetadataField dot notation - nested properties', async () => {
  // Create in-memory repository
  const repo = new TaskRepository('./test.db', true);
  
  try {
    // Create a test task with nested metadata
    const taskData = {
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
        nested: {
          key1: 'value1',
          key2: 'value2',
          deep: {
            property: 'nested value'
          }
        }
      }
    };
    
    const result = await repo.createTask(taskData);
    assert.ok(result.success, 'Task creation should succeed');
    assert.ok(result.data, 'Task data should exist');
    
    if (result.success && result.data) {
      const taskId = result.data.id;
      
      // Test accessing nested fields with dot notation
      const nestedValue = await repo.getMetadataField(taskId, 'nested.deep.property');
      assert.equal(nestedValue, 'nested value', 'Nested field should be accessible');
      
      const configValue = await repo.getMetadataField(taskId, 'config.options.color');
      assert.equal(configValue, 'blue', 'Config options field should be accessible');
      
      const arrayItem = await repo.getMetadataField(taskId, 'items.0');
      assert.equal(arrayItem, 'item1', 'Array item should be accessible');
      
      const nonExistentField = await repo.getMetadataField(taskId, 'config.nonexistent');
      assert.equal(nonExistentField, undefined, 'Non-existent field should return undefined');
      
      const invalidPath = await repo.getMetadataField(taskId, 'items.nonexistent');
      assert.equal(invalidPath, undefined, 'Invalid path should return undefined');
    }
  } finally {
    repo.close();
  }
});

test('getMetadata - returns metadata object', async () => {
  const repo = new TaskRepository('./test.db', true);
  
  try {
    // Create a test task with metadata
    const result = await repo.createTask({
      title: 'Test Get Metadata',
      metadata: {
        simple: 'value',
        number: 42
      }
    });
    
    assert.ok(result.success, 'Task creation should succeed');
    
    if (result.success && result.data) {
      const taskId = result.data.id;
      
      // Get the metadata
      const metadata = await repo.getMetadata(taskId);
      
      assert.ok(metadata, 'Metadata should exist');
      assert.equal(metadata.simple, 'value', 'Metadata should contain the correct values');
      assert.equal(metadata.number, 42, 'Metadata should contain the correct values');
    }
  } finally {
    repo.close();
  }
});

test('updateMetadata - set operation', async () => {
  const repo = new TaskRepository('./test.db', true);
  
  try {
    // Create a test task
    const result = await repo.createTask({
      title: 'Test Update Metadata',
      metadata: {
        initial: 'value'
      }
    });
    
    assert.ok(result.success, 'Task creation should succeed');
    
    if (result.success && result.data) {
      const taskId = result.data.id;
      
      // Set a new metadata field
      const updatedTask = await repo.updateMetadata(taskId, 'newField', 'new value', 'set');
      
      assert.ok(updatedTask, 'Updated task should exist');
      assert.equal(updatedTask!.metadata.newField, 'new value', 'New field should be set');
      assert.equal(updatedTask!.metadata.initial, 'value', 'Original field should be preserved');
      
      // Verify by getting the field
      const value = await repo.getMetadataField(taskId, 'newField');
      assert.equal(value, 'new value', 'New field should be retrievable');
    }
  } finally {
    repo.close();
  }
});

test('updateMetadata - append operation', async () => {
  const repo = new TaskRepository('./test.db', true);
  
  try {
    // Create a test task with an array
    const result = await repo.createTask({
      title: 'Test Append Metadata',
      metadata: {
        array: [1, 2, 3],
        simple: 'value'
      }
    });
    
    assert.ok(result.success, 'Task creation should succeed');
    
    if (result.success && result.data) {
      const taskId = result.data.id;
      
      // Append to an array
      const updatedTask1 = await repo.updateMetadata(taskId, 'array', 4, 'append');
      
      assert.ok(updatedTask1, 'Updated task should exist');
      assert.equal(JSON.stringify(updatedTask1!.metadata.array), JSON.stringify([1, 2, 3, 4]), 'Value should be appended');
      
      // Convert a non-array to an array
      const updatedTask2 = await repo.updateMetadata(taskId, 'simple', 'appended', 'append');
      
      assert.ok(updatedTask2, 'Updated task should exist');
      assert.equal(JSON.stringify(updatedTask2!.metadata.simple), JSON.stringify(['value', 'appended']), 'Field should be converted to array');
      
      // Create a new array field
      const updatedTask3 = await repo.updateMetadata(taskId, 'newArray', 'first', 'append');
      
      assert.ok(updatedTask3, 'Updated task should exist');
      assert.equal(JSON.stringify(updatedTask3!.metadata.newArray), JSON.stringify(['first']), 'New array should be created');
    }
  } finally {
    repo.close();
  }
});

test('updateMetadata - remove operation', async () => {
  const repo = new TaskRepository('./test.db', true);
  
  try {
    // Create a test task
    const result = await repo.createTask({
      title: 'Test Remove Metadata',
      metadata: {
        field1: 'value1',
        field2: 'value2'
      }
    });
    
    assert.ok(result.success, 'Task creation should succeed');
    
    if (result.success && result.data) {
      const taskId = result.data.id;
      
      // Remove a field
      const updatedTask = await repo.updateMetadata(taskId, 'field1', null, 'remove');
      
      assert.ok(updatedTask, 'Updated task should exist');
      assert.equal(updatedTask!.metadata.field1, undefined, 'Field should be removed');
      assert.equal(updatedTask!.metadata.field2, 'value2', 'Other field should remain');
      
      // Verify by getting the field
      const value = await repo.getMetadataField(taskId, 'field1');
      assert.equal(value, undefined, 'Removed field should not be retrievable');
    }
  } finally {
    repo.close();
  }
});

test('error handling - non-existent task', async () => {
  const repo = new TaskRepository('./test.db', true);
  
  try {
    // Try operations on a non-existent task
    const metadata = await repo.getMetadata('non-existent-id');
    assert.equal(metadata, undefined, 'getMetadata should return undefined for non-existent task');
    
    const field = await repo.getMetadataField('non-existent-id', 'field');
    assert.equal(field, undefined, 'getMetadataField should return undefined for non-existent task');
    
    const updated = await repo.updateMetadata('non-existent-id', 'field', 'value', 'set');
    assert.equal(updated, undefined, 'updateMetadata should return undefined for non-existent task');
  } finally {
    repo.close();
  }
});

test.run();