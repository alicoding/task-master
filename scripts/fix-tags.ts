/**
 * Script to fix JSON tags in the database
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

/**
 * Run a SQLite command on the database
 * @param query SQL query to execute
 * @returns true if successful, false otherwise
 */
async function runSqlite(query: string): Promise<boolean> {
  const dbPath = path.resolve('./db/taskmaster.db');
  try {
    await execPromise(`sqlite3 "${dbPath}" "${query}"`);
    return true;
  } catch (error) {
    console.error(`Error executing query: ${query}`, error);
    return false;
  }
}

/**
 * Get all task IDs that start with 17
 * @returns Array of task IDs
 */
async function getTaskIds(): Promise<string[]> {
  try {
    const { stdout } = await execPromise(`sqlite3 "./db/taskmaster.db" "SELECT id FROM tasks WHERE id LIKE '17%';"`);
    // Handle empty result
    if (!stdout.trim()) {
      return [];
    }
    return stdout.trim().split('\n');
  } catch (error) {
    console.error('Error getting task IDs:', error);
    return [];
  }
}

/**
 * Get the tags for a specific task
 * @param id Task ID
 * @returns Array of tags
 */
async function getTaskTags(id: string): Promise<string[]> {
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
        if (!tagsStr) return [];
        return JSON.parse(tagsStr) as string[];
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

/**
 * Update the tags for a specific task
 * @param id Task ID
 * @param tags Array of tags
 * @returns true if successful, false otherwise
 */
async function updateTaskTags(id: string, tags: string[]): Promise<boolean> {
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

/**
 * Main function to fix all tags in the database
 */
async function fixAllTags(): Promise<void> {
  console.log('Fixing task tags...');
  
  const taskIds = await getTaskIds();
  console.log(`Found ${taskIds.length} tasks to process.`);
  
  for (const id of taskIds) {
    const tags = await getTaskTags(id);
    await updateTaskTags(id, tags);
  }
  
  console.log('Completed fixing task tags.');
}

// Run the script
fixAllTags().catch((error: Error) => {
  console.error('Error fixing task tags:', error);
  process.exit(1);
});