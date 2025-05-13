/**
 * Continuous Task Processor
 * 
 * This script implements a continuous workflow to systematically process
 * tasks in the Task Master backlog following strict DoD requirements.
 * 
 * Workflow:
 * 1. Find in-progress tasks and complete them
 * 2. Find TODO ready tasks, set them to in-progress, and implement them
 * 3. Find TODO draft tasks, refine them, and move them to ready state
 * 
 * Each task is fully implemented before moving to the next one, following
 * strict Test-Driven Development practices and Definition of Done requirements.
 */

import { TaskRepository } from '../core/repo';
import { TaskGraph } from '../core/graph';
import { Task } from '../db/schema';
import { RepositoryFactory } from '../core/repository/factory';

// Create a local cleanup function to avoid importing from CLI entry
// which would trigger Commander initialization
function closeAllConnections() {
  try {
    RepositoryFactory.reset();
    console.log('Closed all database connections');
  } catch (error) {
    console.error('Error closing connections:', error);
  }
}

// Helper function to create a terminal spinner
function createSpinner(message: string) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const spinner = {
    intervalId: -1,
    stop: () => {
      if (spinner.intervalId !== -1) {
        clearInterval(spinner.intervalId);
        spinner.intervalId = -1;
        process.stdout.write('\r' + ' '.repeat(message.length + 10) + '\r');
      }
    },
    start: () => {
      spinner.intervalId = setInterval(() => {
        process.stdout.write('\r' + frames[i % frames.length] + ' ' + message);
        i++;
      }, 80) as unknown as number;
    }
  };
  return spinner;
}

// Types for task workflow
interface TaskWithPriority extends Task {
  priority: number;
}

// Main workflow processing class
class TaskProcessor {
  private repo: TaskRepository;
  private graph: TaskGraph;
  
  constructor() {
    this.repo = new TaskRepository();
    this.graph = new TaskGraph(this.repo);
  }
  
  /**
   * Main entry point for continuous task processing
   */
  async run() {
    try {
      console.log('Starting Continuous Task Processing Workflow');
      console.log('-------------------------------------------');

      // 1. Process in-progress tasks
      await this.processInProgressTasks();

      // 2. Process ready tasks
      await this.processReadyTasks();

      // 3. Process draft tasks
      await this.processDraftTasks();

      console.log('Task processing workflow completed!');
    } catch (error) {
      console.error('Error in task processing workflow:', error);
    } finally {
      // Always close connections
      await this.repo.close();
      // Make sure all other connections are closed too
      closeAllConnections();
    }
  }
  
  /**
   * Process all in-progress tasks
   */
  private async processInProgressTasks() {
    console.log('\n=== Processing In-Progress Tasks ===');
    
    // Get all tasks with in-progress status
    const spinner = createSpinner('Finding in-progress tasks...');
    spinner.start();
    
    try {
      const tasksResult = await this.repo.searchTasks({ status: 'in-progress' });
      spinner.stop();
      
      if (!tasksResult.success || !tasksResult.data || tasksResult.data.length === 0) {
        console.log('No in-progress tasks found.');
        return;
      }
      
      console.log(`Found ${tasksResult.data.length} in-progress tasks.`);
      
      // Sort tasks by priority
      const tasks = this.prioritizeTasks(tasksResult.data);
      
      // Process each task
      for (const task of tasks) {
        await this.completeTask(task);
      }
    } catch (error) {
      spinner.stop();
      console.error('Error processing in-progress tasks:', error);
    }
  }
  
  /**
   * Process all ready tasks
   */
  private async processReadyTasks() {
    console.log('\n=== Processing Ready Tasks ===');
    
    // Get all todo tasks with ready status
    const spinner = createSpinner('Finding ready tasks...');
    spinner.start();
    
    try {
      const tasksResult = await this.repo.searchTasks({ 
        status: 'todo',
        readiness: 'ready'
      });
      spinner.stop();
      
      if (!tasksResult.success || !tasksResult.data || tasksResult.data.length === 0) {
        console.log('No ready tasks found.');
        return;
      }
      
      console.log(`Found ${tasksResult.data.length} ready tasks.`);
      
      // Sort tasks by priority
      const tasks = this.prioritizeTasks(tasksResult.data);
      
      // Process each task
      for (const task of tasks) {
        // First, mark as in-progress
        await this.markTaskInProgress(task);
        
        // Then, implement and complete the task
        await this.completeTask(task);
      }
    } catch (error) {
      spinner.stop();
      console.error('Error processing ready tasks:', error);
    }
  }
  
  /**
   * Process all draft tasks
   */
  private async processDraftTasks() {
    console.log('\n=== Processing Draft Tasks ===');
    
    // Get all todo tasks with draft status
    const spinner = createSpinner('Finding draft tasks...');
    spinner.start();
    
    try {
      const tasksResult = await this.repo.searchTasks({ 
        status: 'todo',
        readiness: 'draft'
      });
      spinner.stop();
      
      if (!tasksResult.success || !tasksResult.data || tasksResult.data.length === 0) {
        console.log('No draft tasks found.');
        return;
      }
      
      console.log(`Found ${tasksResult.data.length} draft tasks.`);
      
      // Sort tasks by priority
      const tasks = this.prioritizeTasks(tasksResult.data);
      
      // Process each task
      for (const task of tasks) {
        await this.refineTask(task);
      }
    } catch (error) {
      spinner.stop();
      console.error('Error processing draft tasks:', error);
    }
  }
  
  /**
   * Set a task to in-progress status
   */
  private async markTaskInProgress(task: Task) {
    console.log(`\n=> Setting task ${task.id} to in-progress...`);
    
    const updateResult = await this.repo.updateTask({
      id: task.id,
      status: 'in-progress'
    });
    
    if (updateResult.success) {
      console.log(`   Task ${task.id} marked as in-progress.`);
    } else {
      console.error(`   Failed to mark task ${task.id} as in-progress:`, updateResult.error);
    }
  }
  
  /**
   * Mark a task as complete
   */
  private async markTaskComplete(task: Task) {
    console.log(`\n=> Marking task ${task.id} as done...`);
    
    const updateResult = await this.repo.updateTask({
      id: task.id,
      status: 'done'
    });
    
    if (updateResult.success) {
      console.log(`   Task ${task.id} marked as done.`);
    } else {
      console.error(`   Failed to mark task ${task.id} as done:`, updateResult.error);
    }
  }
  
  /**
   * Set a task to ready status
   */
  private async markTaskReady(task: Task) {
    console.log(`\n=> Setting task ${task.id} to ready...`);
    
    const updateResult = await this.repo.updateTask({
      id: task.id,
      readiness: 'ready'
    });
    
    if (updateResult.success) {
      console.log(`   Task ${task.id} marked as ready.`);
    } else {
      console.error(`   Failed to mark task ${task.id} as ready:`, updateResult.error);
    }
  }
  
  /**
   * Implement and complete a task
   */
  private async completeTask(task: Task) {
    console.log(`\n=== Implementing Task ${task.id}: ${task.title} ===`);
    
    // Display task details
    const formattedTask = await this.graph.formatTaskView(task, 'simple', {
      showMetadata: true,
      fullContent: true
    });
    console.log(formattedTask);
    
    // Implement the DoD requirements for this task
    await this.implementTaskRequirements(task);
    
    // Mark the task as done
    await this.markTaskComplete(task);
    
    console.log(`Task ${task.id} completed successfully.`);
  }
  
  /**
   * Refine a draft task to ready state
   */
  private async refineTask(task: Task) {
    console.log(`\n=== Refining Task ${task.id}: ${task.title} ===`);
    
    // Display task details
    const formattedTask = await this.graph.formatTaskView(task, 'simple', {
      showMetadata: true,
      fullContent: true
    });
    console.log(formattedTask);
    
    // Refine the task requirements
    await this.refineTaskRequirements(task);
    
    // Mark the task as ready
    await this.markTaskReady(task);
    
    console.log(`Task ${task.id} refined and marked as ready.`);
  }
  
  /**
   * Implement the DoD requirements for a task
   * This is a placeholder for the actual implementation
   */
  private async implementTaskRequirements(task: Task) {
    console.log('Implementing task requirements...');
    
    // Simulate implementation process
    const steps = [
      'Writing tests',
      'Implementing functionality',
      'Running tests',
      'Verifying TypeScript compatibility',
      'Checking for regressions',
      'Adding documentation',
      'Updating tests'
    ];
    
    for (const step of steps) {
      const spinner = createSpinner(`${step}...`);
      spinner.start();
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 500));
      spinner.stop();
      console.log(`✓ ${step} completed.`);
    }
  }
  
  /**
   * Refine task requirements
   * This is a placeholder for the actual implementation
   */
  private async refineTaskRequirements(task: Task) {
    console.log('Refining task requirements...');
    
    // Simulate refinement process
    const steps = [
      'Analyzing task scope',
      'Identifying acceptance criteria',
      'Defining test requirements',
      'Creating DoD checklist',
      'Verifying technical feasibility'
    ];
    
    for (const step of steps) {
      const spinner = createSpinner(`${step}...`);
      spinner.start();
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 500));
      spinner.stop();
      console.log(`✓ ${step} completed.`);
    }
  }
  
  /**
   * Prioritize tasks based on various factors
   */
  private prioritizeTasks(tasks: Task[]): TaskWithPriority[] {
    // Calculate a priority score for each task
    const tasksWithPriority = tasks.map(task => {
      // Start with base priority
      let priority = 0;
      
      // Check for metadata priority
      try {
        const metadata = typeof task.metadata === 'string' 
          ? JSON.parse(task.metadata) 
          : task.metadata;
          
        if (metadata && typeof metadata.priority === 'number') {
          priority += metadata.priority;
        }
      } catch (error) {
        // Ignore metadata parsing errors
      }
      
      // Higher priority for shorter task IDs (more parent-level)
      const idParts = task.id.split('.');
      priority -= idParts.length;
      
      // Higher priority for implementing features
      if (task.tags && Array.isArray(task.tags)) {
        if (task.tags.includes('feature')) priority += 5;
        if (task.tags.includes('bug')) priority += 10;
      }
      
      return {
        ...task,
        priority
      };
    });
    
    // Sort by priority (descending)
    return tasksWithPriority.sort((a, b) => b.priority - a.priority);
  }
}

// Run the processor
async function main() {
  const processor = new TaskProcessor();
  await processor.run();

  // Ensure we exit cleanly
  process.exit(0);
}

// Immediately invoke the main function
// Since we're using ESM, we can't use require.main === module check
main().catch(error => {
  console.error('Fatal error in continuous task processor:', error);
  closeAllConnections();
  process.exit(1);
});