/**
 * Script for adding project tasks for the Task-Code Relationship Tracking System
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

// Main function to add all project tasks
async function addProjectTasks() {
  console.log('Adding project tasks for the Task-Code Relationship Tracking System...');
  
  // Main parent task
  await addTask('17', 'Task-Code Relationship Tracker', 'Main task for the Task-Code relationship tracking system', null, 'todo', 'draft', ['project', 'feature']);
  
  // Component tasks (children of 17)
  await addTask('17.1', 'Daemon Process Implementation', 'Create a background daemon process for file monitoring', '17', 'todo', 'draft', ['daemon', 'core']);
  await addTask('17.2', 'File System Watcher', 'Create a file system watcher module using chokidar', '17', 'todo', 'draft', ['filesystem', 'core']);
  await addTask('17.3', 'Database Extensions', 'Add database tables and queries for file tracking', '17', 'todo', 'draft', ['database', 'core']);
  await addTask('17.4', 'CLI Integration', 'Integrate daemon and file tracking with the CLI', '17', 'todo', 'draft', ['cli', 'ux']);
  await addTask('17.5', 'Analysis Engine', 'Create an analysis engine for relating file changes to tasks', '17', 'todo', 'draft', ['analysis', 'core']);
  await addTask('17.6', 'File Change Analyzer', 'Component to analyze file changes and extract metadata', '17', 'todo', 'draft', ['analysis', 'core']);
  await addTask('17.7', 'Terminal Integration', 'Implement terminal detection and session management', '17', 'todo', 'draft', ['terminal', 'ux']);
  await addTask('17.8', 'Session Recovery', 'Implement terminal session recovery mechanism', '17', 'todo', 'draft', ['session', 'recovery']);
  await addTask('17.9', 'AI Prompt System', 'Create customizable AI prompt system', '17', 'todo', 'draft', ['ai', 'prompts']);
  
  // Subcomponents for Daemon Process
  await addTask('17.1.1', 'Process Detachment', 'Implement proper process detachment from terminal', '17.1', 'todo', 'draft', ['daemon', 'process']);
  await addTask('17.1.2', 'Signal Handling', 'Implement proper signal handling for controlled shutdown', '17.1', 'todo', 'draft', ['daemon', 'signals']);
  await addTask('17.1.3', 'IPC Mechanism', 'Create inter-process communication for CLI and daemon', '17.1', 'todo', 'draft', ['daemon', 'ipc']);
  
  // Subcomponents for File System Watcher
  await addTask('17.2.1', 'Chokidar Integration', 'Integrate chokidar for file system watching', '17.2', 'todo', 'draft', ['filesystem', 'library']);
  await addTask('17.2.2', 'Event Filtering', 'Create filters for relevant file events', '17.2', 'todo', 'draft', ['filesystem', 'events']);
  await addTask('17.2.3', 'Debouncing', 'Implement debouncing for high-frequency changes', '17.2', 'todo', 'draft', ['filesystem', 'performance']);
  
  // Subcomponents for Database Extensions
  await addTask('17.3.1', 'File Changes Table', 'Create table for tracking file changes', '17.3', 'todo', 'draft', ['database', 'schema']);
  await addTask('17.3.2', 'Sessions Table', 'Create table for tracking terminal sessions', '17.3', 'todo', 'draft', ['database', 'schema']);
  await addTask('17.3.3', 'File-Task Relationships', 'Create table for relating files to tasks', '17.3', 'todo', 'draft', ['database', 'schema']);
  
  // Subcomponents for CLI Integration
  await addTask('17.4.1', 'Status Command', 'Create command to show tracking status', '17.4', 'todo', 'draft', ['cli', 'command']);
  await addTask('17.4.2', 'Files Command', 'Create command to show related files', '17.4', 'todo', 'draft', ['cli', 'command']);
  await addTask('17.4.3', 'Shell Integration', 'Create shell prompt integration', '17.4', 'todo', 'draft', ['cli', 'shell']);
  
  // Subcomponents for Analysis Engine
  await addTask('17.5.1', 'Content Analyzer', 'Create content analyzer for file relevance', '17.5', 'todo', 'draft', ['analysis', 'content']);
  await addTask('17.5.2', 'Task Matcher', 'Create algorithm to match files to tasks', '17.5', 'todo', 'draft', ['analysis', 'matching']);
  await addTask('17.5.3', 'Confidence Scoring', 'Implement confidence scoring for matches', '17.5', 'todo', 'draft', ['analysis', 'scoring']);
  
  // Subcomponents for AI Prompt System
  await addTask('17.9.1', 'Prompt Templates', 'Design and implement prompt templates', '17.9', 'todo', 'draft', ['ai', 'templates']);
  await addTask('17.9.2', 'Model Integration', 'Integrate with AI model providers', '17.9', 'todo', 'draft', ['ai', 'integration']);
  await addTask('17.9.3', 'Token Optimization', 'Implement token usage optimization', '17.9', 'todo', 'draft', ['ai', 'optimization']);
  
  console.log('Completed adding project tasks.');
}

// Run the script
addProjectTasks().catch(error => {
  console.error('Error adding project tasks:', error);
  process.exit(1);
});