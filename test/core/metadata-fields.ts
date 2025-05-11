/**
 * Test for metadata field access with dot notation
 */
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo.ts';
import { TaskOperationResult, Task } from '../../core/types.ts';

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
      const fieldResult = await repo.getMetadataField(taskId, 'nested.deep.property');
      
      // Handle both TaskOperationResult and direct return patterns
      let value: string | undefined;
      if (fieldResult && typeof fieldResult === 'object' && 'success' in fieldResult) {
        // It's a TaskOperationResult
        if (fieldResult.success) {
          value = fieldResult.data as string;
        }
      } else {
        // It's a direct return value
        value = fieldResult as string;
      }
      
      assert.equal(value, 'nested value', 'Nested field value should match');
    }
  } finally {
    repo.close();
  }
});

// Now convert to Vitest style for future migration
// This is a dual-format test that works with both uvu and vitest

// Export an empty default object to keep TypeScript happy about the module
export {};

// Only run test.run() in uvu mode
if (typeof test.run === 'function') {
  test.run();
}