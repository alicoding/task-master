import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo.js';

// Simple test for getMetadataField with dot notation
test('Test dot notation in metadata field access', async () => {
  // Create a repository with an in-memory database
  const repo = new TaskRepository('./test.db', true);
  
  try {
    // Create a test task with nested metadata
    const result = await repo.createTask({
      title: 'Test Task',
      metadata: {
        nested: {
          key1: 'value1',
          deep: {
            property: 'nested value'
          }
        }
      }
    });
    
    assert.ok(result.success, 'Task creation should succeed');
    
    if (result.success && result.data) {
      const taskId = result.data.id;
      
      // Test accessing nested field with dot notation
      const value = await repo.getMetadataField(taskId, 'nested.deep.property');
      assert.equal(value, 'nested value', 'Nested field value should match');
    }
  } finally {
    repo.close();
  }
});

test.run();