import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo.ts';
import { SearchFilters } from '../../core/types.ts';

test('TaskRepository - advanced search features', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create tasks with various metadata
  await repo.createTask({
    title: 'NLP Search Test',
    tags: ['search', 'nlp'],
    status: 'todo',
    metadata: {
      description: 'This is a task for testing NLP search functionality',
      complexity: 'medium'
    }
  });
  
  await repo.createTask({
    title: 'Regular Task',
    tags: ['test'],
    status: 'todo',
    metadata: {
      complexity: 'low'
    }
  });
  
  await repo.createTask({
    title: 'Another task with natural language details',
    tags: ['test', 'nlp'],
    status: 'todo'
  });
  
  // Test NLP search by query
  const nlpResults = await repo.searchTasks({ 
    query: 'natural language processing' 
  });
  
  // Should match tasks with "NLP" in tags or "natural language" in title
  assert.ok(nlpResults.length > 0);
  assert.ok(nlpResults.some(task => task.title === 'NLP Search Test'));
  assert.ok(nlpResults.some(task => task.title === 'Another task with natural language details'));
  
  // Test metadata search
  const metadataResults = await repo.searchTasks({
    metadata: {
      complexity: 'medium'
    }
  });
  
  assert.equal(metadataResults.length, 1);
  assert.equal(metadataResults[0].title, 'NLP Search Test');
  
  // Test combined filters
  const combinedResults = await repo.searchTasks({
    tags: ['test'],
    status: 'todo',
    metadata: {
      complexity: 'low'
    }
  });
  
  assert.equal(combinedResults.length, 1);
  assert.equal(combinedResults[0].title, 'Regular Task');
  
  // Clean up
  repo.close();
});

test('TaskRepository - deduplication and similarity detection', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create some tasks with similar titles
  await repo.createTask({
    title: 'Test deduplication feature'
  });
  
  await repo.createTask({
    title: 'Testing the deduplication functionality'
  });
  
  await repo.createTask({
    title: 'Completely different task'
  });
  
  // Test similar task detection
  const similarTasks = await repo.findSimilarTasks('Test duplication features');
  
  // Should find at least one similar task
  assert.ok(similarTasks.length > 0);
  
  // Each task should have a similarity score
  assert.ok(typeof similarTasks[0].similarityScore === 'number');
  assert.ok(similarTasks[0].similarityScore > 0.4);
  
  // The first match should be the closest one
  assert.ok(
    similarTasks[0].title === 'Test deduplication feature' || 
    similarTasks[0].title === 'Testing the deduplication functionality'
  );
  
  // Test for nearly exact matches
  const exactDuplicates = await repo.findSimilarTasks('Test deduplication feature');
  
  // Should find at least one match
  assert.ok(exactDuplicates.length > 0);
  // Check if it's the one we expect
  if (exactDuplicates.length > 0) {
    assert.ok(exactDuplicates.some(t => t.title === 'Test deduplication feature'));
  }
  
  // Clean up
  repo.close();
});

test('TaskRepository - getNextTasks with multiple results', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create tasks with various priorities (IDs)
  await repo.createTask({
    title: 'Priority 1 Task',
    status: 'todo',
    readiness: 'ready'
  });
  
  // Create a child task of priority 1
  const task1 = await repo.getTask('1');
  await repo.createTask({
    title: 'Priority 1.1 Task',
    childOf: task1.id,
    status: 'todo',
    readiness: 'ready'
  });
  
  await repo.createTask({
    title: 'Priority 2 Task',
    status: 'todo',
    readiness: 'ready'
  });
  
  await repo.createTask({
    title: 'Priority 3 Task',
    status: 'todo',
    readiness: 'ready'
  });
  
  await repo.createTask({
    title: 'In Progress Task',
    status: 'in-progress',
    readiness: 'ready'
  });
  
  // Get multiple next tasks
  const nextTasks = await repo.getNextTasks({}, 3);
  
  // Should get 3 tasks in priority order
  assert.equal(nextTasks.length, 3);
  assert.equal(nextTasks[0].id, '1');
  assert.equal(nextTasks[1].id, '1.1');
  assert.equal(nextTasks[2].id, '2');
  
  // Test with filter
  const filteredTasks = await repo.getNextTasks({ 
    status: 'todo',
    readiness: 'ready'
  }, 2);
  
  assert.equal(filteredTasks.length, 2);
  assert.equal(filteredTasks[0].id, '1');
  assert.equal(filteredTasks[1].id, '1.1');
  
  // Test backward compatibility with getNextTask
  const singleTask = await repo.getNextTask();
  assert.equal(singleTask.id, '1');
  
  // Clean up
  repo.close();
});

test('TaskRepository - metadata operations', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create a task with initial metadata
  const task = await repo.createTask({
    title: 'Metadata Test Task',
    metadata: {
      priority: 'high',
      notes: ['Initial note']
    }
  });
  
  // Test getMetadata
  const metadata = await repo.getMetadata(task.id);
  assert.equal(metadata.priority, 'high');
  assert.equal(metadata.notes.length, 1);
  assert.equal(metadata.notes[0], 'Initial note');
  
  // Test getMetadataField
  const priority = await repo.getMetadataField(task.id, 'priority');
  assert.equal(priority, 'high');
  
  // Test updateMetadata - set operation
  await repo.updateMetadata(task.id, 'complexity', 'medium', 'set');
  let updatedTask = await repo.getTask(task.id);
  assert.equal(updatedTask.metadata.complexity, 'medium');
  
  // Test updateMetadata - append operation
  await repo.updateMetadata(task.id, 'notes', 'Second note', 'append');
  updatedTask = await repo.getTask(task.id);
  assert.equal(updatedTask.metadata.notes.length, 2);
  assert.equal(updatedTask.metadata.notes[1], 'Second note');
  
  // Test updateMetadata - remove operation
  await repo.updateMetadata(task.id, 'priority', null, 'remove');
  updatedTask = await repo.getTask(task.id);
  
  // Check that the priority field is no longer in the metadata
  assert.ok(!('priority' in updatedTask.metadata));
  
  // Clean up
  repo.close();
});

test('TaskRepository - dependency reordering', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  
  // Create a parent task
  const parentTask = await repo.createTask({
    title: 'Parent Task'
  });
  
  // Create several child tasks
  await repo.createTask({
    title: 'Child Task 1',
    childOf: parentTask.id
  });
  
  const childTask2 = await repo.createTask({
    title: 'Child Task 2',
    childOf: parentTask.id
  });
  
  await repo.createTask({
    title: 'Child Task 3',
    childOf: parentTask.id
  });
  
  // Test the reordering functionality when a task is removed
  await repo.removeTask(childTask2.id);
  
  // This function currently just logs, but we can test that it runs without errors
  await repo.reorderSiblingTasksAfterDeletion(parentTask.id, childTask2.id);
  
  // For root task reordering
  const rootTask2 = await repo.createTask({
    title: 'Root Task 2'
  });
  
  await repo.createTask({
    title: 'Root Task 3'
  });
  
  await repo.removeTask(rootTask2.id);
  await repo.reorderRootTasksAfterDeletion(rootTask2.id);
  
  // Clean up
  repo.close();
});

test.run();