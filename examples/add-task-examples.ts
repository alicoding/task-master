/**
 * Examples of Adding Tasks (Task 14: Test adding a new task)
 * 
 * This file demonstrates different ways to add tasks using the Task Master CLI:
 * 1. Basic task with just a title
 * 2. Task with description, status, and tags
 * 3. Child task (with parent)
 * 4. Task with metadata
 */

// These examples can be run with the Task Master CLI
// Instructions:

// Example 1: Basic Task
// Run: npm run dev -- add --title "Basic Task Example"
// This creates a simple task with default values:
// - Status: todo
// - Readiness: draft
// - No tags or metadata

// Example 2: Task with Description, Status, and Tags
// Run: npm run dev -- add --title "Feature: User Authentication" --description "Implement login and registration" --status in-progress --readiness ready --tags auth feature important
// This creates a more detailed task with:
// - Status: in-progress
// - Readiness: ready 
// - Tags: auth, feature, important

// Example 3: Child Task (Creating a Task Hierarchy)
// First create a parent:
// Run: npm run dev -- add --title "Parent: User Interface Redesign"
// Note the ID of the parent task (e.g., 28)
// Then create a child:
// Run: npm run dev -- add --title "Child: Update Button Styles" --child-of 28
// The child task will be linked to the parent task

// Example 4: Task with Metadata
// Run: npm run dev -- add --title "API Integration" --metadata '{"priority":"high","complexity":3,"estimated_hours":8}'
// This creates a task with structured metadata containing:
// - priority: high
// - complexity: 3
// - estimated_hours: 8
// Access metadata with: npm run dev -- metadata get --id [TASK_ID]

// Example 5: Force Option (Skip Similarity Check)
// Run: npm run dev -- add --title "Quick Task" --force
// The --force flag skips the similarity check, useful for quick task creation

// Example 6: Dry Run (Test Without Creating)
// Run: npm run dev -- add --title "Test Task" --dry-run
// This shows what would happen without actually creating the task

// Example 7: JSON Output
// Run: npm run dev -- add --title "JSON Example" --format json
// Returns the task in JSON format

// Example Usage Notes:
// --title: Required field, must provide a title
// --status: Optional, one of: todo, in-progress, done
// --readiness: Optional, one of: draft, ready, blocked
// --tags: Optional, provide multiple space-separated tags
// --metadata: Optional, provide as a JSON string
// --force: Optional, skip similarity check
// --format: Optional, one of: text, json
// --dry-run: Optional, preview without creating

/**
 * JavaScript/TypeScript Code Example
 * 
 * If you're integrating with the API programmatically:
 */

/*
import { TaskRepository } from '../core/repo.ts';
import { TaskInsertOptions } from '../core/types.ts';

async function createExampleTasks() {
  const repo = new TaskRepository();
  
  try {
    // Basic task
    const basicTask = await repo.createTask({
      title: 'Basic Task Example'
    });
    console.log(`Created task: ${basicTask.data?.id}`);
    
    // Detailed task
    const detailedTask = await repo.createTask({
      title: 'Feature: User Authentication',
      description: 'Implement login and registration',
      status: 'in-progress',
      readiness: 'ready',
      tags: ['auth', 'feature', 'important']
    });
    console.log(`Created detailed task: ${detailedTask.data?.id}`);
    
    // Task with metadata
    const metadataTask = await repo.createTask({
      title: 'API Integration',
      metadata: {
        priority: 'high',
        complexity: 3,
        estimated_hours: 8
      }
    });
    console.log(`Created task with metadata: ${metadataTask.data?.id}`);
    
    // Child task
    const parentTask = await repo.createTask({
      title: 'Parent: User Interface Redesign'
    });
    
    if (parentTask.success && parentTask.data) {
      const childTask = await repo.createTask({
        title: 'Child: Update Button Styles',
        childOf: parentTask.data.id
      });
      console.log(`Created child task: ${childTask.data?.id} (parent: ${parentTask.data.id})`);
    }
  } finally {
    repo.close();
  }
}
*/