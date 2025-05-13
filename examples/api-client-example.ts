/**
 * Example of using the Task Master API client
 * This demonstrates how to use the API client for external integrations
 */

import { ApiClient } from '../core/api/index';

async function main() {
  console.log('Task Master API Client Example');
  console.log('--------------------------------');

  // Create a client instance
  const client = new ApiClient({
    baseUrl: 'http://localhost:3000/api',
    debug: true
  });

  try {
    // Example 1: Get all tasks
    console.log('\n1. Getting all tasks...');
    const allTasks = await client.getAllTasks();
    console.log(`Retrieved ${allTasks.length} tasks`);

    // Example 2: Search for tasks
    console.log('\n2. Searching for tasks with "UI" tag...');
    const uiTasks = await client.searchTasks({ tags: ['UI'] });
    console.log(`Found ${uiTasks.length} UI-related tasks`);

    // Example 3: Creating a new task
    console.log('\n3. Creating a new task...');
    const newTask = await client.execute({
      type: 'add',
      data: {
        title: 'Task created via API client',
        tags: ['api', 'example'],
        status: 'todo'
      }
    });
    console.log('Task created:', newTask.result.id);

    // Example 4: Updating a task
    if (newTask.result && newTask.result.id) {
      console.log('\n4. Updating the new task...');
      const updateResult = await client.execute({
        type: 'update',
        data: {
          id: newTask.result.id,
          status: 'in-progress',
          tags: ['api', 'example', 'updated']
        }
      });
      console.log('Task updated:', updateResult.status === 'success');
    }

    // Example 5: Batch operations
    console.log('\n5. Executing batch operations...');
    const batchResults = await client.batch({
      operations: [
        {
          type: 'add',
          data: {
            title: 'First batch task',
            tags: ['batch', 'example']
          }
        },
        {
          type: 'add',
          data: {
            title: 'Second batch task',
            tags: ['batch', 'example']
          }
        }
      ]
    });
    console.log(`Batch completed: ${batchResults.results.success} succeeded, ${batchResults.results.failed} failed`);

    // Example 6: Export tasks
    console.log('\n6. Exporting tasks...');
    const exportedTasks = await client.exportTasks('hierarchical');
    console.log(`Exported ${exportedTasks.count} tasks in hierarchical format`);

    // Example 7: Get hierarchy
    console.log('\n7. Getting task hierarchy...');
    const hierarchy = await client.getHierarchy('json', { jsonStyle: 'tree' });
    console.log(`Retrieved task hierarchy with ${hierarchy.length} top-level tasks`);

  } catch (error) {
    console.error('Error in API client example:', error);
  }
}

main().catch(console.error);