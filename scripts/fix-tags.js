/**
 * Script to fix JSON tags in the database
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

// Function to get all task IDs starting with 17
async function getTaskIds() {
  try {
    const { stdout } = await execPromise(`sqlite3 "./db/taskmaster.db" "SELECT id FROM tasks WHERE id LIKE '17%';"`);
    return stdout.trim().split('\n');
  } catch (error) {
    console.error('Error getting task IDs:', error);
    return [];
  }
}

// Function to get the tags for a task
async function getTaskTags(id) {
  try {
    const { stdout } = await execPromise(`sqlite3 "./db/taskmaster.db" "SELECT tags FROM tasks WHERE id = '${id}';"`);
    const tagsStr = stdout.trim();
    
    // Check if it's not valid JSON
    if (tagsStr.startsWith('[') && !tagsStr.includes('"')) {
      // Format: [tag1,tag2,tag3]
      const content = tagsStr.substring(1, tagsStr.length - 1);
      if (!content) return [];
      
      return content.split(',');
    } else {
      // Already valid JSON or empty
      try {
        return JSON.parse(tagsStr);
      } catch (e) {
        console.warn(`Warning: Could not parse tags for task ${id}: ${tagsStr}`);
        return [];
      }
    }
  } catch (error) {
    console.error(`Error getting tags for task ${id}:`, error);
    return [];
  }
}

// Function to update the tags for a task
async function updateTaskTags(id, tags) {
  const tagsJson = JSON.stringify(tags);
  const query = `UPDATE tasks SET tags = '${tagsJson}' WHERE id = '${id}';`;
  const success = await runSqlite(query);
  if (success) {
    console.log(`Updated tags for task ${id}: ${tagsJson}`);
  } else {
    console.error(`Failed to update tags for task ${id}`);
  }
  return success;
}

// Main function to fix all tags
async function fixAllTags() {
  console.log('Fixing task tags...');
  
  const taskIds = await getTaskIds();
  
  for (const id of taskIds) {
    const tags = await getTaskTags(id);
    await updateTaskTags(id, tags);
  }
  
  console.log('Completed fixing task tags.');
}

// Run the script
fixAllTags().catch(error => {
  console.error('Error fixing task tags:', error);
  process.exit(1);
});