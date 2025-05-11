import { Command } from 'commander';
import fs from 'fs/promises';
import { helpFormatter } from '../../../helpers/help-formatter.ts';
import { ApiService } from '../../../../core/api/service.ts';

/**
 * Create the export command
 * Exports tasks in various formats
 */
export function createExportCommand() {
  const exportCommand = new Command('export')
    .description('Export all tasks in JSON format for external tools')
    .option('--format <format>', 'Format of the export (json, flat, hierarchical)', 'json')
    .option('--filter <filter>', 'Filter the exported tasks')
    .option('--output <file>', 'Output file for results (default stdout)');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(exportCommand, {
    description: 'Export tasks in structured JSON formats for external tools, scripts, and integrations. Provides flexible options for data representation and filtering.',
    examples: [
      {
        command: 'tm api export',
        description: 'Export all tasks in detailed JSON format to stdout'
      },
      {
        command: 'tm api export --format hierarchical',
        description: 'Export tasks in a nested parent-child hierarchy'
      },
      {
        command: 'tm api export --filter status:todo',
        description: 'Export only todo tasks'
      },
      {
        command: 'tm api export --filter tag:UI --output ui-tasks.json',
        description: 'Export UI-related tasks to a file'
      },
      {
        command: 'tm api export --format flat',
        description: 'Export tasks in a simplified flat format'
      }
    ],
    notes: [
      'Supports three export formats:',
      '  - json: Full details including all task fields',
      '  - flat: Simplified format with just essential fields',
      '  - hierarchical: Nested tree structure showing parent-child relationships',
      'The filter option accepts key:value format (e.g., status:todo, tag:important)',
      'Export includes metadata about the operation (count, timestamp, filter used)',
      'Output goes to stdout by default, use --output to write to a file'
    ],
    seeAlso: ['api import', 'api batch']
  });

  return exportCommand
    .action(async (options) => {
      try {
        // Use the shared API service
        const apiService = new ApiService('./db/taskmaster.db', false, true);
        
        // Export tasks using the API service
        const output = await apiService.exportTasks(
          options.format,
          options.filter
        );
        
        // Output to file or stdout
        if (options.output) {
          await fs.writeFile(options.output, JSON.stringify(output, null, 2));
          console.log(`Exported ${output.count} tasks to ${options.output}`);
        } else {
          console.log(JSON.stringify(output, null, 2));
        }
        
        apiService.close();
      } catch (error) {
        console.error('Error exporting tasks:', error);
        process.exit(1);
      }
    });
}