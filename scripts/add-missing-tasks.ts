/**
 * Script for adding missing tasks for the Task-Code Relationship Tracking System
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

// Function to run SQLite commands
async function runSqlite(query) {
  const dbPath = path.resolve('./db/taskmaster.db');
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
    const { stdout } = await execPromise(`sqlite3 "./db/taskmaster.db" "SELECT id FROM tasks WHERE id = '${id}'"`);
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

// Main function to add all missing tasks
async function addMissingTasks() {
  console.log('Adding missing tasks for the Task-Code Relationship Tracking System...');
  
  // 1. Multi-session support
  await addTask('17.10', 'Multi-Session Support', 'Implement support for multiple concurrent tracking sessions', '17', 'todo', 'draft', ['session', 'core']);
  await addTask('17.10.1', 'Session Manager', 'Create a session manager to track multiple active sessions', '17.10', 'todo', 'draft', ['session', 'manager']);
  await addTask('17.10.2', 'File Claiming', 'Implement mechanism for explicitly assigning files to tasks', '17.10', 'todo', 'draft', ['session', 'claim']);
  await addTask('17.10.3', 'Conflict Resolution', 'Create system for resolving file assignment conflicts between tasks', '17.10', 'todo', 'draft', ['session', 'conflict']);
  await addTask('17.10.4', 'Priority System', 'Implement priority levels for sessions to handle ambiguous changes', '17.10', 'todo', 'draft', ['session', 'priority']);
  
  // 2. Terminal independence improvements
  await addTask('17.7.1', 'Terminal Detection', 'Implement terminal session detection and tracking', '17.7', 'todo', 'draft', ['terminal', 'detection']);
  await addTask('17.7.2', 'Reconnection Mechanism', 'Create system for reconnecting to daemon after terminal restarts', '17.7', 'todo', 'draft', ['terminal', 'reconnection']);
  await addTask('17.7.3', 'Shell Status Indicator', 'Add visual indicator to shell prompt showing tracking status', '17.7', 'todo', 'draft', ['terminal', 'ui']);
  
  // 3. Session recovery improvements
  await addTask('17.8.1', 'Session Persistence', 'Implement session state persistence across terminal sessions', '17.8', 'todo', 'draft', ['session', 'persistence']);
  await addTask('17.8.2', 'Time Window Management', 'Create system for tracking time windows of activity', '17.8', 'todo', 'draft', ['session', 'timewindow']);
  await addTask('17.8.3', 'Retroactive Assignment', 'Implement ability to retroactively assign changes to tasks', '17.8', 'todo', 'draft', ['session', 'retroactive']);
  
  // 4. Database efficiency
  await addTask('17.11', 'Database Efficiency', 'Implement database optimization for efficient file tracking', '17', 'todo', 'draft', ['database', 'optimization']);
  await addTask('17.11.1', 'Cleanup Policies', 'Create policies for cleaning up old file change records', '17.11', 'todo', 'draft', ['database', 'cleanup']);
  await addTask('17.11.2', 'Indexing Strategy', 'Implement efficient indexing for file change queries', '17.11', 'todo', 'draft', ['database', 'indexing']);
  await addTask('17.11.3', 'Query Optimization', 'Optimize database queries for file-task relationships', '17.11', 'todo', 'draft', ['database', 'query']);
  
  // 5. Cost controls for AI
  await addTask('17.9.4', 'Cost Controls', 'Implement controls for AI token usage and associated costs', '17.9', 'todo', 'draft', ['ai', 'cost']);
  await addTask('17.9.5', 'Caching System', 'Create caching system for AI responses to reduce API calls', '17.9', 'todo', 'draft', ['ai', 'caching']);
  await addTask('17.9.6', 'Usage Analytics', 'Add analytics for AI usage and cost tracking', '17.9', 'todo', 'draft', ['ai', 'analytics']);
  
  // 6. Task hierarchy management
  await addTask('17.12', 'Task Hierarchy Management', 'Implement automatic task positioning and hierarchy management', '17', 'todo', 'draft', ['tasks', 'hierarchy']);
  await addTask('17.12.1', 'Auto-Positioning', 'Create system for automatically positioning new tasks', '17.12', 'todo', 'draft', ['tasks', 'positioning']);
  await addTask('17.12.2', 'Task Renumbering', 'Implement automatic renumbering of tasks when hierarchy changes', '17.12', 'todo', 'draft', ['tasks', 'renumbering']);
  await addTask('17.12.3', 'Reference Updates', 'Update task references when IDs change', '17.12', 'todo', 'draft', ['tasks', 'references']);
  await addTask('17.12.4', 'Gap Analysis', 'Detect missing integration tasks based on code analysis', '17.12', 'todo', 'draft', ['tasks', 'gaps']);
  
  // 7. Background recording
  await addTask('17.13', 'Background Activity Recording', 'Implement always-on change tracking in the background', '17', 'todo', 'draft', ['background', 'recording']);
  await addTask('17.13.1', 'Always-On Monitoring', 'Create system for background file monitoring', '17.13', 'todo', 'draft', ['background', 'monitoring']);
  await addTask('17.13.2', 'Activity Windows', 'Track time windows of development activity', '17.13', 'todo', 'draft', ['background', 'windows']);
  await addTask('17.13.3', 'Window Assignment', 'Create interface for assigning time windows to tasks', '17.13', 'todo', 'draft', ['background', 'assignment']);
  
  // 8. CLI Commands
  await addTask('17.4.4', 'Session Command', 'Implement session management commands', '17.4', 'todo', 'draft', ['cli', 'session']);
  await addTask('17.4.5', 'Prompts Command', 'Create command for managing AI prompts', '17.4', 'todo', 'draft', ['cli', 'prompts']);
  await addTask('17.4.6', 'Tasks Analysis Command', 'Implement task hierarchy analysis commands', '17.4', 'todo', 'draft', ['cli', 'analysis']);
  
  // Set up dependencies between top-level components to match implementation phases
  console.log('Setting up dependencies between components...');
  
  // Phase 1: Core infrastructure
  const dependencyQueries = [
    // 17.1 (Daemon) must be completed before 17.2 (File System Watcher)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.1', '17.2', 'after');`,
    // 17.2 (File System Watcher) must be completed before 17.3 (Database Extensions)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.2', '17.3', 'after');`,
    // 17.3 (Database) must be completed before 17.5 (Analysis Engine)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.3', '17.5', 'after');`,
    // 17.3 (Database) must be completed before 17.11 (Database Efficiency)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.3', '17.11', 'after');`,
    // 17.5 (Analysis) must be completed before 17.6 (File Change Analyzer)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.5', '17.6', 'after');`,
    // 17.7 (Terminal Integration) depends on 17.1 (Daemon)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.1', '17.7', 'after');`,
    // 17.8 (Session Recovery) depends on 17.7 (Terminal Integration)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.7', '17.8', 'after');`,
    // 17.10 (Multi-Session) depends on 17.8 (Session Recovery)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.8', '17.10', 'after');`,
    // 17.13 (Background Recording) depends on 17.10 (Multi-Session)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.10', '17.13', 'after');`,
    // 17.9 (AI Prompt System) is independent but before CLI
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.9', '17.4', 'after');`,
    // 17.12 (Task Hierarchy) depends on 17.5 (Analysis)
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.5', '17.12', 'after');`,
    // 17.4 (CLI) depends on everything else
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.13', '17.4', 'after');`,
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.12', '17.4', 'after');`,
    `INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES ('17.11', '17.4', 'after');`,
  ];
  
  for (const query of dependencyQueries) {
    try {
      await runSqlite(query);
    } catch (error) {
      console.warn(`Warning: Could not create dependency: ${error}`);
    }
  }
  
  console.log('Completed adding missing tasks and dependencies.');
}

// Run the script
addMissingTasks().catch(error => {
  console.error('Error adding missing tasks:', error);
  process.exit(1);
});