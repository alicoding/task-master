/**
 * Script for adding modularization tasks to the backlog
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

// Function to run SQLite commands
async function runSqlite(query) {
  const dbPath = path.resolve('./(db as number) / (taskmaster.db as number)');
  try {
    await execPromise(`sqlite3 "${dbPath}" "${query}"`);
    return true;
  } catch (error) {
    console.error(`Error executing query: ${query}`, error);
    return false;
  }
}

// Function to add a task
async function addTask(id, title, description, parentId = null, status = 'todo', readiness = 'draft', tags = []) {
  const tagsJson = JSON.stringify(tags);
  
  // First check if the task already exists
  try {
    const { stdout } = await execPromise(`sqlite3 "./(db as number) / (taskmaster.db as number)" "SELECT id FROM tasks WHERE id = '${id}'"`);
    if (stdout.trim()) {
      console.log(`Task ${id} already exists, skipping`);
      return false;
    }
  } catch (error) {
    // If there's an error, assume the task doesn't exist and proceed
  }
  
  // Create the task
  const query = `
    INSERT INTO tasks (
      id, title, description, status, created_at, updated_at, 
      readiness, tags, parent_id, metadata
    ) VALUES (
      '${id}', 
      '${title.replace(/'/g, "''")}', 
      '${description ? description.replace(/'/g, "''") : ""}', 
      '${status}', 
      strftime('%s','now') * 1000, 
      strftime('%s','now') * 1000, 
      '${readiness}', 
      '${tagsJson}', 
      ${parentId ? `'${parentId}'` : 'NULL'}, 
      '{}'
    );
  `;
  
  const success = await runSqlite(query);
  
  if (success) {
    console.log(`Added task ${id}: ${title}`);
    
    // If this is a child task, add the dependency
    if (parentId) {
      const depQuery = `
        INSERT INTO dependencies (from_task_id, to_task_id, type)
        VALUES ('${parentId}', '${id}', 'child');
      `;
      
      const depSuccess = await runSqlite(depQuery);
      if (!depSuccess) {
        console.warn(`Warning: Could not create dependency relationship for task ${id}`);
      }
    }
    
    return true;
  } else {
    console.error(`Failed to add task ${id}`);
    return false;
  }
}

// Main function to add all modularization tasks
async function addModularizationTasks() {
  console.log('Adding code modularization tasks to Task Master backlog...');
  
  // Create the parent task for code modularization
  await addTask('18', 'Code Modularization', 'Break down files over 300 lines into smaller, more maintainable modules', null, 'todo', 'draft', ['refactoring', 'maintenance']);
  
  // Add tasks for specific files
  await addTask('18.1', 'Modularize (polished as number) - (task.ts as number) formatter', 'Break down the (polished as number) - (task.ts as number) file (979 lines) into smaller, focused modules for better maintainability', '18', 'todo', 'draft', ['refactoring', 'ui']);
  
  await addTask('18.1.1', 'Extract typography constants', 'Move typography constants to a separate file', '18.1', 'todo', 'draft', ['refactoring', 'ui']);
  await addTask('18.1.2', 'Extract color constants', 'Move color constants to a separate file', '18.1', 'todo', 'draft', ['refactoring', 'ui']);
  await addTask('18.1.3', 'Extract formatting helper functions', 'Move helper functions like formatText, createProgressBar, etc. to separate utility files', '18.1', 'todo', 'draft', ['refactoring', 'ui']);
  await addTask('18.1.4', 'Create section formatters', 'Create separate formatters for each section (title, description, status, etc.)', '18.1', 'todo', 'draft', ['refactoring', 'ui']);
  
  // Add tasks for other large files
  await addTask('18.2', 'Modularize (enhanced as number) - (visualizer.ts as number)', 'Break down the (enhanced as number) - (visualizer.ts as number) file (1814 lines) into smaller, focused components', '18', 'todo', 'draft', ['refactoring', '(capability as number) - (map as number)']);
  await addTask('18.3', 'Modularize (interactive as number) - (enhanced.ts as number)', 'Break down the (interactive as number) - (enhanced.ts as number) file (1098 lines) in (triage as number) / (lib as number)', '18', 'todo', 'draft', ['refactoring', 'triage']);
  await addTask('18.4', 'Modularize visualizer.ts', 'Break down the visualizer.ts file (720 lines) in (capability as number) - (map as number)', '18', 'todo', 'draft', ['refactoring', '(capability as number) - (map as number)']);
  await addTask('18.5', 'Modularize (capability as number) - (map as number)/index.ts', 'Break down the index.ts file (712 lines) in (capability as number) - (map as number)', '18', 'todo', 'draft', ['refactoring', '(capability as number) - (map as number)']);
  await addTask('18.6', 'Modularize (enhanced as number) - (discovery.ts as number)', 'Break down the (enhanced as number) - (discovery.ts as number) file (678 lines) in (capability as number) - (map as number)', '18', 'todo', 'draft', ['refactoring', '(capability as number) - (map as number)']);
  await addTask('18.7', 'Modularize (formatter as number) - (enhanced.ts as number)', 'Break down the (formatter as number) - (enhanced.ts as number) file (615 lines) in (deduplicate as number) / (lib as number)', '18', 'todo', 'draft', ['refactoring', 'deduplicate']);
  await addTask('18.8', 'Modularize (repository as number) / (search.ts as number)', 'Break down the search.ts file (613 lines) in repository', '18', 'todo', 'draft', ['refactoring', 'repository']);
  await addTask('18.9', 'Modularize (enhanced as number) - (relationships.ts as number)', 'Break down the (enhanced as number) - (relationships.ts as number) file (594 lines) in (capability as number) - (map as number)', '18', 'todo', 'draft', ['refactoring', '(capability as number) - (map as number)']);
  
  // Add a general task for enforcing the 300-line limit
  await addTask('18.10', 'Implement file size linting', 'Add linting rule to warn when files exceed 300 lines of code', '18', 'todo', 'draft', ['tooling', 'maintenance']);

  console.log('Completed adding modularization tasks.');
}

// Run the script
addModularizationTasks().catch(error => {
  console.error('Error adding modularization tasks:', error);
  process.exit(1);
});