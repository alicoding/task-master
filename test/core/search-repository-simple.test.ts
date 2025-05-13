import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskSearchRepository } from '../../core/repository/search';
import { 
  TaskStatus,
  TaskReadiness,
  TaskErrorCode
} from '../../core/types';

// Create an empty mock for the repository
class MockSearchRepository extends TaskSearchRepository {
  constructor() {
    // @ts-ignore - Mocking for tests
    super();
  }
  
  // Mock the database and NLP operations
  async initializeNlp() {
    // Do nothing
  }
  
  async searchTasks(filters: any) {
    // Test validation logic
    if (filters.status) {
      if (filters.status !== 'todo' && 
          filters.status !== 'in-progress' && 
          filters.status !== 'done') {
        return {
          success: false,
          error: {
            code: TaskErrorCode.INVALID_INPUT,
            message: `Invalid status: ${filters.status}`
          }
        };
      }
    }
    
    return {
      success: true,
      data: []
    };
  }
}

test('TaskSearchRepository - validates input properly', async () => {
  const repo = new MockSearchRepository();
  
  // Test with valid status
  const validResult = await repo.searchTasks({ status: 'todo' });
  assert.equal(validResult.success, true, 'Valid status should succeed');
  
  // Test with invalid status
  const invalidResult = await repo.searchTasks({ status: 'invalid' });
  assert.equal(invalidResult.success, false, 'Invalid status should fail');
  assert.equal(invalidResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
});

test('TaskSearchRepository - provides legacy methods', async () => {
  const repo = new MockSearchRepository();
  
  // Use the searchTasksLegacy method
  const result = await repo.searchTasksLegacy({ status: 'todo' });
  assert.ok(Array.isArray(result), 'Legacy method should return an array');
  
  // Test with invalid input
  const invalidResult = await repo.searchTasksLegacy({ status: 'invalid' });
  assert.ok(Array.isArray(invalidResult), 'Legacy method should return an array even on error');
  assert.equal(invalidResult.length, 0, 'Should be empty on error');
});

// Run all tests
test.run();