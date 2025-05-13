import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { TaskRepository } from '../../core/repo';
import { TaskGraph } from '../../core/graph';

test('TaskGraph - format hierarchy text', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  const graph = new TaskGraph(repo);
  
  // Create a root-level task
  const task1 = await repo.createTask({
    title: 'Root Task 1'
  });
  
  // Create a child task
  const task1_1 = await repo.createTask({
    title: 'Child Task 1.1',
    childOf: task1.id
  });
  
  // Create another child task
  const task1_2 = await repo.createTask({
    title: 'Child Task 1.2',
    childOf: task1.id
  });
  
  // Create a grandchild task
  const task1_1_1 = await repo.createTask({
    title: 'Grandchild Task 1.1.1',
    childOf: task1_1.id
  });
  
  // Create another root task
  const task2 = await repo.createTask({
    title: 'Root Task 2'
  });
  
  // Format as text
  const textOutput = await graph.formatHierarchyText();
  
  // Verify output contains all tasks with proper indentation
  assert.ok(textOutput.includes('1. Root Task 1'));
  assert.ok(textOutput.includes('  1.1. Child Task 1.1'));
  assert.ok(textOutput.includes('    1.1.1. Grandchild Task 1.1.1'));
  assert.ok(textOutput.includes('  1.2. Child Task 1.2'));
  assert.ok(textOutput.includes('2. Root Task 2'));
  
  // Clean up
  repo.close();
});

test('TaskGraph - format hierarchy json', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  const graph = new TaskGraph(repo);
  
  // Create a root-level task
  const task1 = await repo.createTask({
    title: 'Root Task 1'
  });
  
  // Create a child task
  const task1_1 = await repo.createTask({
    title: 'Child Task 1.1',
    childOf: task1.id
  });
  
  // Format as JSON
  const jsonOutput = await graph.formatHierarchyJson();
  
  // Verify structure
  assert.equal(Array.isArray(jsonOutput), true);
  assert.equal(jsonOutput.length, 2); // Two tasks total
  
  // Find root task
  const rootTask = jsonOutput.find(t => t.id === '1');
  assert.ok(rootTask);
  assert.equal(rootTask.title, 'Root Task 1');
  assert.equal(rootTask.parentId, null);
  
  // Find child task
  const childTask = jsonOutput.find(t => t.id === '1.1');
  assert.ok(childTask);
  assert.equal(childTask.title, 'Child Task 1.1');
  assert.equal(childTask.parentId, '1');
  
  // Clean up
  repo.close();
});

test('TaskGraph - build graph', async () => {
  // Create repo with in-memory DB for testing
  const repo = new TaskRepository('./test.db', true, true);
  const graph = new TaskGraph(repo);
  
  // Create a root-level task
  const task1 = await repo.createTask({
    title: 'Root Task 1'
  });
  
  // Create a child task
  const task1_1 = await repo.createTask({
    title: 'Child Task 1.1',
    childOf: task1.id
  });
  
  // Create another child task
  const task1_2 = await repo.createTask({
    title: 'Child Task 1.2',
    childOf: task1.id
  });
  
  // Build the graph
  const graphMap = await graph.buildGraph();
  
  // Verify graph structure
  assert.ok(graphMap.has(task1.id));
  assert.ok(graphMap.has(task1_1.id));
  assert.ok(graphMap.has(task1_2.id));
  
  // Root task should have two children
  const rootChildren = graphMap.get(task1.id);
  assert.ok(rootChildren);
  assert.equal(rootChildren.size, 2);
  assert.ok(rootChildren.has(task1_1.id));
  assert.ok(rootChildren.has(task1_2.id));
  
  // Child tasks should have no children
  const child1Children = graphMap.get(task1_1.id);
  const child2Children = graphMap.get(task1_2.id);
  assert.ok(child1Children);
  assert.ok(child2Children);
  assert.equal(child1Children.size, 0);
  assert.equal(child2Children.size, 0);
  
  // Clean up
  repo.close();
});

test.run();