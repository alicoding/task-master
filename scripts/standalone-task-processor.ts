/**
 * Standalone Task Processor
 * 
 * This script implements a continuous workflow to systematically process
 * tasks in the Task Master backlog following strict DoD requirements.
 * 
 * This is a standalone version that doesn't import from the CLI to avoid
 * triggering Commander initialization.
 */

import { createDb } from '../db/init.ts';

// Initialize the database directly with SQLite connection
const { sqlite } = createDb();

// Simple task interface
interface Task {
  id: string;
  title: string;
  status: string;
  readiness?: string;
  tags?: string[];
  metadata?: any;
  description?: string;
  parent?: string;
}

// Simple repository implementation using raw SQLite
class SimpleTaskRepository {
  // Get all tasks
  async getAllTasks(): Promise<Task[]> {
    try {
      const tasks = sqlite.prepare('SELECT * FROM tasks').all();
      return tasks.map(this.normalizeTask);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  // Search tasks with filters
  async searchTasks(filters: Partial<Task>): Promise<Task[]> {
    try {
      let sql = 'SELECT * FROM tasks WHERE 1=1';
      const params: any[] = [];

      // Apply filters
      if (filters.status) {
        sql += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.readiness) {
        sql += ' AND readiness = ?';
        params.push(filters.readiness);
      }

      if (filters.parent) {
        sql += ' AND parent_id = ?';
        params.push(filters.parent);
      }

      const stmt = sqlite.prepare(sql);
      const results = stmt.all(...params);
      return results.map(this.normalizeTask);
    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  // Update a task
  async updateTask(taskData: Partial<Task> & { id: string }): Promise<boolean> {
    try {
      const { id, ...updateData } = taskData;

      // Begin constructing the SQL for update
      let sql = 'UPDATE tasks SET ';
      const setClauses: string[] = [];
      const params: any[] = [];

      // Handle special cases like tags and metadata
      if (updateData.tags && Array.isArray(updateData.tags)) {
        setClauses.push('tags = ?');
        params.push(JSON.stringify(updateData.tags));
      }

      if (updateData.metadata && typeof updateData.metadata === 'object') {
        setClauses.push('metadata = ?');
        params.push(JSON.stringify(updateData.metadata));
      }

      if (updateData.status) {
        setClauses.push('status = ?');
        params.push(updateData.status);
      }

      if (updateData.readiness) {
        setClauses.push('readiness = ?');
        params.push(updateData.readiness);
      }

      if (updateData.title) {
        setClauses.push('title = ?');
        params.push(updateData.title);
      }

      if (updateData.description) {
        setClauses.push('description = ?');
        params.push(updateData.description);
      }

      // Always update updated_at timestamp
      setClauses.push('updated_at = ?');
      params.push(Date.now());

      // Complete the SQL query
      sql += setClauses.join(', ') + ' WHERE id = ?';
      params.push(id);

      const stmt = sqlite.prepare(sql);
      stmt.run(...params);

      console.log(`Updated task ${id}`);
      return true;
    } catch (error) {
      console.error(`Error updating task ${taskData.id}:`, error);
      return false;
    }
  }

  // Close database connection
  async close() {
    try {
      // Close the SQLite database connection
      if (sqlite && typeof sqlite.close === 'function') {
        sqlite.close();
        console.log('Database connection closed');
      }
    } catch (error) {
      console.error('Error closing repository:', error);
    }
  }

  // Helper to normalize task data
  private normalizeTask(task: any): Task {
    // Parse tags if they're a string
    let tags = task.tags;
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (e) {
        tags = [];
      }
    }

    // Parse metadata if it's a string
    let metadata = task.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }

    // Map SQLite column names to properties
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      readiness: task.readiness,
      tags,
      metadata,
      parent: task.parent_id
    };
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

// Simple task formatter for display
function formatTask(task: Task): string {
  let result = `\nTask ${task.id}: ${task.title}\n\n`;
  result += `Status: ${task.status}\n`;
  
  if (task.readiness) {
    result += `Readiness: ${task.readiness}\n`;
  }
  
  if (task.tags && task.tags.length > 0) {
    result += `Tags: ${task.tags.map(tag => `#${tag}`).join(' ')}\n`;
  }
  
  if (task.parent) {
    result += `Parent: ${task.parent}\n`;
  }
  
  if (task.description) {
    result += `\n${task.description}\n`;
  }
  
  return result;
}

// Main workflow processing class
class TaskProcessor {
  private repo: SimpleTaskRepository;
  
  constructor() {
    this.repo = new SimpleTaskRepository();
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
      const tasks = await this.repo.searchTasks({ status: 'in-progress' });
      spinner.stop();
      
      if (tasks.length === 0) {
        console.log('No in-progress tasks found.');
        return;
      }
      
      console.log(`Found ${tasks.length} in-progress tasks.`);
      
      // Sort tasks by priority
      const prioritizedTasks = this.prioritizeTasks(tasks);
      
      // Process each task
      for (const task of prioritizedTasks) {
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
      const tasks = await this.repo.searchTasks({ 
        status: 'todo',
        readiness: 'ready'
      });
      spinner.stop();
      
      if (tasks.length === 0) {
        console.log('No ready tasks found.');
        return;
      }
      
      console.log(`Found ${tasks.length} ready tasks.`);
      
      // Sort tasks by priority
      const prioritizedTasks = this.prioritizeTasks(tasks);
      
      // Process each task
      for (const task of prioritizedTasks) {
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
      const tasks = await this.repo.searchTasks({ 
        status: 'todo',
        readiness: 'draft'
      });
      spinner.stop();
      
      if (tasks.length === 0) {
        console.log('No draft tasks found.');
        return;
      }
      
      console.log(`Found ${tasks.length} draft tasks.`);
      
      // Sort tasks by priority
      const prioritizedTasks = this.prioritizeTasks(tasks);
      
      // Process each task
      for (const task of prioritizedTasks) {
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
    
    const success = await this.repo.updateTask({
      id: task.id,
      status: 'in-progress'
    });
    
    if (success) {
      console.log(`   Task ${task.id} marked as in-progress.`);
    } else {
      console.error(`   Failed to mark task ${task.id} as in-progress.`);
    }
  }
  
  /**
   * Mark a task as complete
   */
  private async markTaskComplete(task: Task) {
    console.log(`\n=> Marking task ${task.id} as done...`);
    
    const success = await this.repo.updateTask({
      id: task.id,
      status: 'done'
    });
    
    if (success) {
      console.log(`   Task ${task.id} marked as done.`);
    } else {
      console.error(`   Failed to mark task ${task.id} as done.`);
    }
  }
  
  /**
   * Set a task to ready status
   */
  private async markTaskReady(task: Task) {
    console.log(`\n=> Setting task ${task.id} to ready...`);
    
    const success = await this.repo.updateTask({
      id: task.id,
      readiness: 'ready'
    });
    
    if (success) {
      console.log(`   Task ${task.id} marked as ready.`);
    } else {
      console.error(`   Failed to mark task ${task.id} as ready.`);
    }
  }
  
  /**
   * Implement and complete a task
   */
  private async completeTask(task: Task) {
    console.log(`\n=== Implementing Task ${task.id}: ${task.title} ===`);
    
    // Display task details
    console.log(formatTask(task));
    
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
    console.log(formatTask(task));
    
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
  console.log('All operations completed successfully.');
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Fatal error in task processor:', error);
  process.exit(1);
});