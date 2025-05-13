/**
 * Batch update command implementation
 * Handles updating multiple tasks in a single operation via JSON file
 */

import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo';
import { TaskUpdateOptions } from '../../../core/types';
import fs from 'fs/promises';

export async function createBatchUpdateCommand() {
  const batchUpdateCommand = new Command('batch')
    .description('Update multiple tasks in a batch from a JSON file')
    .requiredOption('--input <file>', 'JSON file with task updates')
    .option('--dry-run', 'Show what would be updated without making changes')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--legacy', 'Use legacy format (flat array rather than structured object)')

  // Import helpFormatter here to avoid circular dependency
  // Using dynamic import instead of require for ESM compatibility
  const helpFormatterModule = await import('../../helpers/help-formatter');
  const helpFormatter = helpFormatterModule.helpFormatter;

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(batchUpdateCommand, {
    description: 'Process multiple task updates in a single operation from a JSON file. This command allows efficient bulk updating of tasks with detailed reporting of results.',
    examples: [
      {
        command: 'tm update batch --input updates.json',
        description: 'Update multiple tasks from a JSON file'
      },
      {
        command: 'tm update batch --input updates.json --dry-run',
        description: 'Preview batch updates without applying them'
      },
      {
        command: 'tm update batch --input updates.json --format json',
        description: 'Get batch update results in JSON format'
      }
    ],
    notes: [
      'The input file must contain a JSON array of task updates or a structured object',
      'Each update must include an "id" field to identify the task',
      'Supported formats: flat array, {tasks:[...]}, {updates:[...]}, or {operations:[...]}',
      'The command reports successful updates, skipped tasks, and failures',
      'Sample input file format:',
      '  [',
      '    {"id": "1", "status": "done"},',
      '    {"id": "2", "title": "Updated title", "tags": ["important"]}',
      '  ]'
    ],
    seeAlso: ['update', 'api batch']
  })
    .action(async (options) => {
      try {
        const repo = new TaskRepository();
        
        // Read and parse the input file
        const fileContent = await fs.readFile(options.input, 'utf-8');
        let updates: TaskUpdateOptions[] = [];
        
        // Parse input based on format
        try {
          const parsed = JSON.parse(fileContent);
          
          // Handle different formats
          if (Array.isArray(parsed)) {
            // Legacy format: direct array of updates
            updates = parsed;
          } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
            // Modern format: structured with tasks array
            updates = parsed.tasks;
          } else if (parsed.updates && Array.isArray(parsed.updates)) {
            // Alternative format: structured with updates array
            updates = parsed.updates;
          } else if (parsed.operations && Array.isArray(parsed.operations)) {
            // Extract updates from operations array (similar to API batch)
            updates = parsed.operations
              .filter(op => op.type === 'update')
              .map(op => op?.data);
          } else {
            throw new Error('Invalid batch update format. Expected an array of updates or a structured object with a tasks/updates array.');
          }
        } catch (e) {
          console?.error('Error parsing JSON file:', e);
          repo.close();
          return;
        }
        
        console.log(`Processing ${updates.length} task updates ${options.dry_run ? '(dry run)' : ''}`);
        
        // Track results
        const results = {
          updated: [] as any[],
          failed: [] as any[],
          skipped: [] as any[]
        };
        
        // Process each update
        for (const update of updates) {
          try {
            // Skip updates without ID
            if (!update.id) {
              results.skipped.push({
                update,
                reason: 'Missing required id field'
              });
              continue;
            }
            
            // Check if the task exists
            const existingTask = await repo.getTask(update.id);
            if (!existingTask) {
              results.skipped.push({
                id: update.id,
                reason: 'Task not found'
              });
              continue;
            }
            
            // Skip actual updates in dry run mode
            if (options.dry_run) {
              results.updated.push({
                ...update,
                dry_run: true
              });
              continue;
            }
            
            // Perform the update
            const updatedTask = await repo.updateTask(update);
            results.updated.push(updatedTask);
          } catch (error) {
            console?.error(`Error updating task ${update.id}:`, error);
            results.failed.push({
              update,
              error: error.message
            });
          }
        }
        
        // Output results based on format
        if (options.format === 'json') {
          console.log(JSON.stringify({
            status: 'completed',
            dry_run: options.dry_run || false,
            results
          }, null, 2));
        } else {
          console.log('\nBatch update results:');
          console.log(`- Tasks updated: ${results.updated.length}`);
          console.log(`- Tasks skipped: ${results.skipped.length}`);
          console.log(`- Tasks failed: ${results.failed.length}`);
          
          if (results.failed.length > 0) {
            console.log('\nFailed updates:');
            results.failed.forEach((item, i) => {
              console.log(`  ${i + 1}. Task ID: ${item.update.id}`);
              console.log(`     Error: ${item?.error}`);
            });
          }
          
          if (options.dry_run) {
            console.log('\nDry run completed. No changes were made.');
          }
        }
        
        repo.close();
      } catch (error) {
        console?.error('Error processing batch update:', error);
        process.exit(1);
      }
    });
  
  return batchUpdateCommand;
}