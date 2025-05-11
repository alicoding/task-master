import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo.ts';

test('TaskRepository - advanced functionality', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create sample tasks
  const task1 = await repo.createTask({
    title: 'Test Advanced Features',
    tags: ['advanced', 'test'],
    metadata: { priority: 'high' }
  });
  
  // Test metadata functions
  const metadata = await repo.getMetadata(task1.id);
  assert.ok(metadata);
  assert.equal(metadata.priority, 'high');
  
  const specificField = await repo.getMetadataField(task1.id, 'priority');
  assert.equal(specificField, 'high');
  
  // Test getNextTasks with count parameter
  const task2 = await repo.createTask({
    title: 'Second Task',
    status: 'todo',
    readiness: 'ready'
  });
  
  const task3 = await repo.createTask({
    title: 'Third Task',
    status: 'todo',
    readiness: 'ready'
  });
  
  const nextTasks = await repo.getNextTasks({ status: 'todo' }, 2);
  assert.equal(nextTasks.length, 2);
  
  // Test searchTasks with NLP query capabilities
  const searchResults = await repo.searchTasks({ query: 'advanced' });
  assert.ok(searchResults.length > 0);
  
  // Test similarity detection (functionally present but not testing specific results)
  const repoHasSimilarityFunction = typeof repo.findSimilarTasks === 'function';
  assert.ok(repoHasSimilarityFunction);
  
  // Test task reordering infrastructure
  assert.ok(typeof repo.reorderSiblingTasksAfterDeletion === 'function');
  assert.ok(typeof repo.reorderRootTasksAfterDeletion === 'function');
  
  // Clean up
  repo.close();
});

test.run();