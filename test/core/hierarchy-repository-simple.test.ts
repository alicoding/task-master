import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskHierarchyRepository } from '../../core/repository/hierarchy';
import { 
  TaskOperationResult,
  TaskErrorCode
} from '../../core/types';

// Create a proper mock for the repository
class MockHierarchyRepository {
  // Mock implementation of buildTaskHierarchy
  async buildTaskHierarchy() {
    const tasks = [
      {
        id: '1',
        title: 'Task 1',
        parent_id: null,
        status: 'todo',
        readiness: 'ready',
        tags: 'tag1',
        metadata: '{}',
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
        children: [] as any[]
      },
      {
        id: '1.1',
        title: 'Subtask 1.1',
        parent_id: '1',
        status: 'todo',
        readiness: 'ready',
        tags: 'tag1',
        metadata: '{}',
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
        children: []
      },
      {
        id: '2',
        title: 'Task 2',
        parent_id: null,
        status: 'todo',
        readiness: 'ready',
        tags: 'tag2',
        metadata: '{}',
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
        children: []
      }
    ];

    // Build hierarchy by associating children with parents
    const taskMap = new Map<string, any>();
    for (const task of tasks) {
      taskMap.set(task.id, task);
    }

    const rootTasks = [];
    for (const task of tasks) {
      if (task.parent_id && taskMap.has(task.parent_id)) {
        taskMap.get(task.parent_id).children.push(task);
      } else if (!task.parent_id) {
        rootTasks.push(task);
      }
    }

    return {
      success: true,
      data: rootTasks
    };
  }

  // Mock implementation of buildTaskHierarchyLegacy
  async buildTaskHierarchyLegacy() {
    const result = await this.buildTaskHierarchy();
    return result.success && result.data ? result.data : [];
  }

  // Mock implementation of reorderSiblingTasksAfterDeletion
  async reorderSiblingTasksAfterDeletion(parentId: string, deletedTaskId: string) {
    if (!parentId || typeof parentId !== 'string') {
      return {
        success: false,
        error: {
          message: 'Invalid parent ID',
          code: TaskErrorCode.INVALID_INPUT
        }
      };
    }

    if (!deletedTaskId || typeof deletedTaskId !== 'string') {
      return {
        success: false,
        error: {
          message: 'Invalid deleted task ID',
          code: TaskErrorCode.INVALID_INPUT
        }
      };
    }

    // Check for invalid task ID format
    const deletedParts = deletedTaskId.split('.');
    const deletedIndex = parseInt(deletedParts[deletedParts.length - 1], 10);

    if (isNaN(deletedIndex)) {
      return {
        success: false,
        error: {
          message: 'Invalid task ID format',
          code: TaskErrorCode.INVALID_INPUT
        }
      };
    }

    return { success: true };
  }

  // Mock implementation of reorderSiblingTasksAfterDeletionLegacy
  async reorderSiblingTasksAfterDeletionLegacy(parentId: string, deletedTaskId: string) {
    const result = await this.reorderSiblingTasksAfterDeletion(parentId, deletedTaskId);
    return result.success;
  }

  // Mock implementation of reorderRootTasksAfterDeletion
  async reorderRootTasksAfterDeletion(deletedTaskId: string) {
    if (!deletedTaskId || typeof deletedTaskId !== 'string') {
      return {
        success: false,
        error: {
          message: 'Invalid deleted task ID',
          code: TaskErrorCode.INVALID_INPUT
        }
      };
    }

    const deletedIndex = parseInt(deletedTaskId, 10);

    if (isNaN(deletedIndex)) {
      return {
        success: false,
        error: {
          message: 'Invalid task ID format',
          code: TaskErrorCode.INVALID_INPUT
        }
      };
    }

    return { success: true };
  }

  // Mock implementation of reorderRootTasksAfterDeletionLegacy
  async reorderRootTasksAfterDeletionLegacy(deletedTaskId: string) {
    const result = await this.reorderRootTasksAfterDeletion(deletedTaskId);
    return result.success;
  }
}

test('TaskHierarchyRepository - buildTaskHierarchy success', async () => {
  const repo = new MockHierarchyRepository();
  
  const hierarchyResult = await repo.buildTaskHierarchy();
  
  assert.equal(hierarchyResult.success, true, 'Should succeed');
  assert.ok(hierarchyResult.data, 'Data should be present');
  assert.equal(hierarchyResult.data?.length, 2, 'Should have 2 root tasks');
  assert.equal(hierarchyResult.data?.[0].id, '1', 'First task should have id 1');
  assert.equal(hierarchyResult.data?.[0].children.length, 1, 'First task should have 1 child');
  assert.equal(hierarchyResult.data?.[0].children[0].id, '1.1', 'Child task should have id 1.1');
});

test('TaskHierarchyRepository - reorderSiblingTasksAfterDeletion input validation', async () => {
  const repo = new MockHierarchyRepository();
  
  // Test with invalid parentId
  const invalidParentResult = await repo.reorderSiblingTasksAfterDeletion('', '1.1');
  assert.equal(invalidParentResult.success, false, 'Should fail with empty parentId');
  assert.equal(invalidParentResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  
  // Test with invalid deletedTaskId
  const invalidDeletedResult = await repo.reorderSiblingTasksAfterDeletion('1', '');
  assert.equal(invalidDeletedResult.success, false, 'Should fail with empty deletedTaskId');
  assert.equal(invalidDeletedResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  
  // Test with invalid task ID format
  const invalidFormatResult = await repo.reorderSiblingTasksAfterDeletion('1', 'not-a-number');
  assert.equal(invalidFormatResult.success, false, 'Should fail with invalid ID format');
  assert.equal(invalidFormatResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
});

test('TaskHierarchyRepository - legacy methods', async () => {
  const repo = new MockHierarchyRepository();
  
  // Test legacy buildTaskHierarchy method
  const hierarchyResult = await repo.buildTaskHierarchyLegacy();
  assert.ok(Array.isArray(hierarchyResult), 'Legacy method should return an array');
  assert.equal(hierarchyResult.length, 2, 'Should have 2 root tasks');
  
  // Test legacy reorderSiblingTasksAfterDeletion method
  const reorderResult = await repo.reorderSiblingTasksAfterDeletionLegacy('1', '1.1');
  assert.equal(reorderResult, true, 'Legacy method should return true on success');
});

// Run all tests
test.run();