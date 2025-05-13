/**
 * Script to fix JSON tags format in the database
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

// Fix tags for all tasks
async function fixAllTags() {
  console.log('Fixing task tags...');
  
  // Get all tasks with malformed tags
  try {
    const { stdout } = await execPromise(`sqlite3 "./db/taskmaster.db" "SELECT id, tags FROM tasks;"`);
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      if (!line) continue;
      
      // Parse the ID and tags
      const [id, tagsStr] = line.split('|');
      if (!id || !tagsStr) continue;
      
      // Check if the tags are malformed (not properly JSON formatted)
      try {
        JSON.parse(tagsStr);
        // If this succeeds, the tags are properly formatted
      } catch (e) {
        // Tags are malformed, fix them
        console.log(`Found malformed tags for task ${id}: ${tagsStr}`);
        
        // Extract tag values assuming format like [tagA,tagB]
        let tags = [];
        if (tagsStr.startsWith('[') && tagsStr.endsWith(']')) {
          const tagContent = tagsStr.substring(1, tagsStr.length - 1);
          if (tagContent) {
            tags = tagContent.split(',').map(tag => tag.trim());
          }
        }
        
        // Create properly formatted JSON
        const fixedTags = JSON.stringify(tags);
        console.log(`Fixing to: ${fixedTags}`);
        
        // Update the database
        const updateQuery = `UPDATE tasks SET tags = '${fixedTags}' WHERE id = '${id}';`;
        await runSqlite(updateQuery);
      }
    }
  } catch (error) {
    console.error('Error fixing tags:', error);
  }
  
  console.log('Completed fixing task tags.');
}

// Run the script
fixAllTags().catch(error => {
  console.error('Error fixing tags:', error);
  process.exit(1);
});