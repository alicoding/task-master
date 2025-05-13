import { Command } from 'commander';
import fs from 'fs/promises';
import { helpFormatter } from '../../../helpers/help-formatter';
import { ApiService } from '../../../../core/api/service';

/**
 * Create the import command
 * Imports tasks from JSON files
 */
export function createImportCommand() {
  const importCommand = new Command('import')
    .description('Import tasks from JSON file')
    .requiredOption('--input <file>', 'JSON file containing tasks to import')
    .option('--dry-run', 'Show what would be imported without making changes');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(importCommand, {
    description: 'Import tasks from a JSON file, supporting both creation of new tasks and updates to existing ones. Designed for migrating tasks or integrating with external systems.',
    examples: [
      {
        command: 'tm api import --input tasks.json',
        description: 'Import tasks from a JSON file'
      },
      {
        command: 'tm api import --input export-data.json --dry-run',
        description: 'Preview import without making changes'
      }
    ],
    notes: [
      'The input file must contain a tasks array in a structured format',
      'Expected format: { "tasks": [ {...task1}, {...task2} ] }',
      'Tasks with an ID field will update existing tasks',
      'Tasks without an ID field will be created as new tasks',
      'Each task supports fields: title, status, readiness, tags, parentId, metadata',
      'Import provides detailed results including counts of added, updated, and skipped tasks',
      'Use --dry-run to see what would be imported without making changes'
    ],
    seeAlso: ['api export', 'api batch']
  });

  return importCommand
    .action(async (options) => {
      try {
        // Use the shared API service
        const apiService = new ApiService('./db/taskmaster.db', false, true);
        
        // Read and parse the input file
        const fileContent = await fs.readFile(options.input, 'utf-8');
        const importData = JSON.parse(fileContent);
        
        if (!importData.tasks || !Array.isArray(importData.tasks)) {
          console?.error('Invalid import file format. Expected a "tasks" array.');
          apiService.close();
          return;
        }
        
        const tasks = importData.tasks;
        console.log(`Importing ${tasks.length} tasks ${options.dryRun ? '(dry run)' : ''}`);
        
        // Import tasks using the API service
        const results = await apiService.importTasks(tasks, options.dryRun);
        
        // Output results
        console.log(JSON.stringify({
          success: true,
          dryRun: options.dryRun || false,
          results: results.results
        }, null, 2));
        
        apiService.close();
      } catch (error) {
        console?.error('Error importing tasks:', error);
        process.exit(1);
      }
    });
}