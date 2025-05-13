import { TaskRepository } from '../core/repo';
import { tasks } from '../db/schema';
import { Task } from '../core/types';

/**
 * Debug test utility for testing task repository functionality
 * This is used to manually test the TaskRepository class with debug output
 */
async function main(): Promise<void> {
  try {
    console.log('Creating repository with legacy mode...');
    const repo = new TaskRepository('./test.db', true, true);
    
    console.log('Creating task...');
    const taskResult = await repo.createTask({
      title: 'Test Task',
      tags: ['test']
    });
    
    // Handle both TaskOperationResult and direct return patterns
    let task: any;
    if (taskResult && typeof taskResult === 'object') {
      if ('success' in taskResult) {
        // It's a TaskOperationResult
        if (taskResult.success) {
          task = taskResult.data;
        } else {
          throw new Error(`Failed to create task: ${taskResult.error?.message}`);
        }
      } else {
        // It's a direct task object from legacy method
        task = taskResult;
      }
    }
    
    console.log('Task created:', task);
    
    // Get the task
    console.log('Getting task with ID:', task.id);
    try {
      // Check if we can access the database (accessing private property with type assertion)
      const repoWithDb = repo as any;
      console.log('DB exists:', !!repoWithDb._db);

      if (repoWithDb._db) {
        const result = await repoWithDb._db.select()
          .from(tasks)
          .limit(10);
        console.log('All tasks in DB:', result);
      }

      const fetchedTaskResult = await repo.getTask(task.id);
      
      // Handle both TaskOperationResult and direct return patterns
      let fetchedTask: Task | undefined;
      if (fetchedTaskResult && typeof fetchedTaskResult === 'object') {
        if ('success' in fetchedTaskResult) {
          // It's a TaskOperationResult
          if (fetchedTaskResult.success) {
            fetchedTask = fetchedTaskResult.data;
          } else {
            console.error('Error in task result:', fetchedTaskResult.error);
          }
        } else {
          // It's a direct task object from legacy method
          fetchedTask = fetchedTaskResult as unknown as Task;
        }
      }
      
      console.log('Fetched task via getTask:', fetchedTask);
    } catch (e) {
      console.error('Error fetching task:', e);
    }
    
    // Close the repo
    repo.close();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();