/**
 * Example of using the new command-based API
 * This shows how to use the API to execute commands programmatically
 */

import { ApiService } from '../core/api/index-new.ts';
import { CommandContext, InputSource, OutputMode } from '../core/api/context.ts';
import { commandRegistry } from '../core/api/command.ts';
import { initCommandRegistry } from '../core/api/handlers/index.ts';

// Initialize command registry
initCommandRegistry();

// Create API service instance
const api = new ApiService('./db/taskmaster.db');

// Main async function to demonstrate API usage
async function main() {
  console.log('Task Master Command API Example\n');
  
  try {
    // List available commands
    console.log('Available Commands:');
    const commands = api.getAvailableCommands();
    commands.forEach(cmd => console.log(`- ${cmd}`));
    console.log();
    
    // Example 1: Add a task
    console.log('Example 1: Adding a new task');
    const addResult = await api.executeCommand('add', {
      title: 'Learn the Task Master API',
      status: 'in-progress',
      tags: ['example', 'api', 'learning'],
      readiness: 'ready'
    });
    console.log('Result:', JSON.stringify(addResult, null, 2));
    console.log();
    
    // If we successfully added a task, use its ID for the next examples
    const taskId = addResult.success ? addResult.result.id : '1';
    
    // Example 2: Update the task
    console.log(`Example 2: Updating task ${taskId}`);
    const updateResult = await api.executeCommand('update', {
      id: taskId,
      status: 'done',
      metadata: {
        completedAt: new Date().toISOString(),
        notes: 'Completed the example'
      }
    });
    console.log('Result:', JSON.stringify(updateResult, null, 2));
    console.log();
    
    // Example 3: Search for tasks
    console.log('Example 3: Searching for tasks');
    const searchResult = await api.executeCommand('search', {
      tags: ['example'],
      natural: true,
      fuzzy: true
    });
    console.log(`Found ${searchResult.result?.tasks.length} tasks`);
    console.log();
    
    // Example 4: Using a direct command context
    console.log('Example 4: Using CommandContext directly');
    const context = new CommandContext('./db/taskmaster.db', {
      source: InputSource.Script,
      output: OutputMode.Json
    });
    
    // Get the graph command handler
    const graphHandler = commandRegistry.get('graph');
    if (graphHandler) {
      // Execute the graph command
      const graphResult = await graphHandler.execute(context, {
        format: 'mermaid',
        textStyle: 'tree'
      });
      
      console.log('Got graph visualization in Mermaid format');
      // output is quite large, so just show a snippet
      console.log(graphResult.result.substring(0, 100) + '...');
    }
    
    // Clean up
    context.close();
    console.log();
    
    // Example 5: Batch operations
    console.log('Example 5: Batch operations');
    const batchResult = await api.executeCommand('batch', {
      operations: [
        {
          command: 'add',
          params: {
            title: 'Another batch example task',
            tags: ['batch']
          }
        },
        {
          command: 'search',
          params: {
            tags: ['batch']
          }
        }
      ]
    });
    console.log('Batch results:');
    console.log(`Success: ${batchResult.result.success}`);
    console.log(`Failed: ${batchResult.result.failed}`);
    console.log();
    
    // Example 6: Legacy compatibility
    console.log('Example 6: Legacy API compatibility');
    const legacyBatchResult = await api.executeBatch({
      operations: [
        {
          type: 'add',
          data: {
            title: 'Legacy batch task'
          }
        }
      ]
    });
    console.log('Legacy batch result:');
    console.log(`Success: ${legacyBatchResult.results.success}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Always close the API service when done
    api.close();
  }
}

// Run the example
main().catch(console.error);