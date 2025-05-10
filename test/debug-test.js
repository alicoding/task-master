import { TaskRepository } from '../core/repo.js';

async function main() {
  try {
    console.log('Creating repository with legacy mode...');
    const repo = new TaskRepository('./test.db', true, true);
    
    console.log('Creating task...');
    const task = await repo.createTask({
      title: 'Test Task',
      tags: ['test']
    });
    
    console.log('Task created:', task);
    
    // Get the task
    console.log('Getting task with ID:', task.id);
    try {
      // Make sure we can access the database
      console.log('DB exists:', !!repo._db);

      if (repo._db) {
        const result = await repo._db.select()
          .from(repo._db.tasks)
          .limit(10);
        console.log('All tasks in DB:', result);
      }


      const fetchedTask = await repo.getTask(task.id);
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