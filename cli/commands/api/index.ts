import { Command } from 'commander';
import { createExportCommand } from './commands/export';
import { createImportCommand } from './commands/import';
import { createBatchCommand } from './commands/batch';
import { helpFormatter } from '../../helpers/help-formatter';

/**
 * Create the API command
 * Parent command for API-related functionality for machine consumption and Roo integration
 */
export function createApiCommand() {
  const apiCommand = new Command('api')
    .description('API commands for machine consumption and Roo integration')
    .option('--input <file>', 'JSON file with commands and options')
    .option('--output <file>', 'Output file for results (default stdout)');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(apiCommand, {
    description: 'Access Task Master functionality through structured API commands designed for scripts, automation, and AI agent integration. This family of commands provides programmable interfaces for Task Master.',
    examples: [
      {
        command: 'tm api export --format json',
        description: 'Export all tasks as structured JSON'
      },
      {
        command: 'tm api import --file tasks.json',
        description: 'Import tasks from a JSON file'
      },
      {
        command: 'tm api batch --input operations.json',
        description: 'Run multiple operations in a batch'
      },
      {
        command: 'tm api export --query "UI" --output ui-tasks.json',
        description: 'Export filtered tasks to a file'
      }
    ],
    notes: [
      'API commands are designed for machine consumption with predictable JSON outputs',
      'Use these commands for integration with scripts, automation systems, or AI agents',
      'The batch command allows executing multiple operations in a single request',
      'All API commands produce structured output that is easy to parse programmatically',
      'These commands form the foundation for the Task Master shared API layer'
    ],
    seeAlso: ['api batch', 'api export', 'api import']
  })
    .action(async (options) => {
      try {
        // Api command without subcommand should show help
        apiCommand.help();
      } catch (error) {
        console?.error('Error in API command:', error);
        process.exit(1);
      }
    });
  
  // Add subcommands
  apiCommand.addCommand(createExportCommand());
  apiCommand.addCommand(createImportCommand());
  apiCommand.addCommand(createBatchCommand());
  
  return apiCommand;
}