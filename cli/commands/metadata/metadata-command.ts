/**
 * Metadata command - CLI interface for managing task metadata
 */

import { Command } from 'commander';
import { TaskRepository } from '../../../core/repo';
import { OutputFormat } from '../../../core/types';
import { helpFormatter } from '../../helpers/help-formatter';
import { commandRegistry } from '../../../core/api/command';
import { CommandContext, InputSource, OutputMode } from '../../../core/api/context';
import { 
  SetMetadataParams,
  RemoveMetadataParams,
  GetMetadataParams,
  MetadataResult
} from '../../../core/api/handlers/task-metadata';

/**
 * Helper class for metadata value parsing
 */
class MetadataValueParser {
  /**
   * Try to parse a value as JSON if it looks like a complex type
   */
  static parseValue(value: string): any {
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']')) ||
      value === 'true' ||
      value === 'false' ||
      value === 'null' ||
      /^-?\d+(\.\d+)?$/.test(value)
    ) {
      try {
        return JSON.parse(value);
      } catch (e) {
        // If parsing fails, use the original string value
        console.warn('Note: Value not parsed as JSON, using as string');
      }
    }
    return value;
  }
}

/**
 * Handler class for metadata operations
 */
export class MetadataCommandHandler {
  private commandName: string;
  private repo: TaskRepository;
  
  constructor(commandName: string, repo: TaskRepository) {
    this.commandName = commandName;
    this.repo = repo;
  }
  
  /**
   * Handle the get metadata command
   */
  async handleGetMetadata(options: any, format: OutputFormat): Promise<any> {
    try {
      // Check if using the command registry
      if (commandRegistry.has('metadata.get')) {
        const context = new CommandContext('./db/taskmaster.db', {
          output: format === 'json' ? OutputMode.Json : OutputMode.Console,
          source: InputSource.Cli
        });

        const params: GetMetadataParams = {
          id: options.id,
          field: options.field
        };

        const command = commandRegistry.get('metadata.get');
        if (!command) {
          throw new Error("Command 'metadata.get' not found in registry");
        }

        const result = await command.execute(context, params);

        // Display result
        if (format === 'json') {
          console.log(JSON.stringify(result?.result ?? null, null, 2));
        } else {
          if (options.field) {
            console.log(`Metadata field '${options.field}' for task ${options.id}:`);
            console.log(JSON.stringify(result?.result?.value !== undefined ? result?.result?.value : null, null, 2));
          } else {
            console.log(`Metadata for task ${options.id}:`);
            console.log(JSON.stringify(result?.result?.metadata !== undefined ? result?.result?.metadata : null, null, 2));
          }
        }
        
        return result.result;
      }
      
      // Use direct repository access (fallback)
      if (options.field) {
        const value = await this.repo.getMetadataField(options.id, options.field);
        
        if (format === 'json') {
          console.log(JSON.stringify({ field: options.field, value }, null, 2));
        } else {
          console.log(`Metadata field '${options.field}' for task ${options.id}:`);
          console.log(JSON.stringify(value, null, 2));
        }
        
        return { field: options.field, value };
      } else {
        const metadata = await this.repo.getMetadata(options.id);
        
        if (format === 'json') {
          console.log(JSON.stringify(metadata, null, 2));
        } else {
          console.log(`Metadata for task ${options.id}:`);
          console.log(JSON.stringify(metadata, null, 2));
        }
        
        return metadata;
      }
    } catch (error) {
      console?.error('Error getting metadata:', error);
      throw error;
    }
  }
  
  /**
   * Handle the set metadata command
   */
  async handleSetMetadata(options: any, format: OutputFormat): Promise<any> {
    try {
      // Parse the value
      const parsedValue = MetadataValueParser.parseValue(options.value);
      
      // Check if using the command registry
      if (commandRegistry.has('metadata.set')) {
        const context = new CommandContext('./db/taskmaster.db', {
          output: format === 'json' ? OutputMode.Json : OutputMode.Console,
          source: InputSource.Cli
        });

        const params: SetMetadataParams = {
          id: options.id,
          field: options.field,
          value: parsedValue
        };

        const command = commandRegistry.get('metadata.set');
        if (!command) {
          throw new Error("Command 'metadata.set' not found in registry");
        }

        const result = await command.execute(context, params);
        const metadata = result?.result?.metadata !== undefined ? result?.result?.metadata : null;

        // Display result
        if (format === 'json') {
          console.log(JSON.stringify(metadata, null, 2));
        } else {
          console.log(`Metadata field '${options.field}' set for task ${options.id}`);
          console.log(`Updated metadata: ${JSON.stringify(metadata, null, 2)}`);
        }

        return metadata;
      }
      
      // Use direct repository access (fallback)
      const updatedTask = await this.repo.updateMetadata(options.id, options.field, parsedValue, 'set');
      
      if (!updatedTask) {
        console?.error(`Task with ID ${options.id} not found`);
        return null;
      }
      
      if (format === 'json') {
        console.log(JSON.stringify((updatedTask as any).metadata || {}, null, 2));
      } else {
        console.log(`Metadata field '${options.field}' set for task ${options.id}`);
        console.log(`Updated metadata: ${JSON.stringify((updatedTask as any).metadata || {}, null, 2)}`);
      }

      return (updatedTask as any).metadata || {};
    } catch (error) {
      console?.error('Error setting metadata:', error);
      throw error;
    }
  }
  
  /**
   * Handle the remove metadata command
   */
  async handleRemoveMetadata(options: any, format: OutputFormat): Promise<any> {
    try {
      // Check if using the command registry
      if (commandRegistry.has('metadata.remove')) {
        const context = new CommandContext('./db/taskmaster.db', {
          output: format === 'json' ? OutputMode.Json : OutputMode.Console,
          source: InputSource.Cli
        });

        const params: RemoveMetadataParams = {
          id: options.id,
          field: options.field
        };

        const command = commandRegistry.get('metadata.remove');
        if (!command) {
          throw new Error("Command 'metadata.remove' not found in registry");
        }

        const result = await command.execute(context, params);
        const metadata = result?.result?.metadata !== undefined ? result?.result?.metadata : null;

        // Display result
        if (format === 'json') {
          console.log(JSON.stringify(metadata, null, 2));
        } else {
          console.log(`Metadata field '${options.field}' removed from task ${options.id}`);
          console.log(`Updated metadata: ${JSON.stringify(metadata, null, 2)}`);
        }

        return metadata;
      }
      
      // Use direct repository access (fallback)
      const updatedTask = await this.repo.updateMetadata(options.id, options.field, null, 'remove');
      
      if (!updatedTask) {
        console?.error(`Task with ID ${options.id} not found`);
        return null;
      }
      
      if (format === 'json') {
        console.log(JSON.stringify((updatedTask as any).metadata || {}, null, 2));
      } else {
        console.log(`Metadata field '${options.field}' removed from task ${options.id}`);
        console.log(`Updated metadata: ${JSON.stringify((updatedTask as any).metadata || {}, null, 2)}`);
      }

      return (updatedTask as any).metadata || {};
    } catch (error) {
      console?.error('Error removing metadata:', error);
      throw error;
    }
  }
  
  /**
   * Handle the append metadata command
   */
  async handleAppendMetadata(options: any, format: OutputFormat): Promise<any> {
    try {
      // Parse the value
      const parsedValue = MetadataValueParser.parseValue(options.value);
      
      // Check if using the command registry
      if (commandRegistry.has('metadata.append')) {
        const context = new CommandContext('./db/taskmaster.db', {
          output: format === 'json' ? OutputMode.Json : OutputMode.Console,
          source: InputSource.Cli
        });

        const params: SetMetadataParams = {
          id: options.id,
          field: options.field,
          value: parsedValue
        };

        const command = commandRegistry.get('metadata.append');
        if (!command) {
          throw new Error("Command 'metadata.append' not found in registry");
        }

        const result = await command.execute(context, params);
        const updatedTask = result?.result?.task !== undefined ? result?.result?.task : null;

        // Display result
        if (format === 'json') {
          console.log(JSON.stringify(updatedTask?.metadata ?? null, null, 2));
        } else {
          console.log(`Value appended to metadata field '${options.field}' for task ${options.id}`);
          console.log(`Updated field: ${JSON.stringify(updatedTask?.metadata?.[options.field] ?? null, null, 2)}`);
        }

        return updatedTask?.metadata ?? null;
      }
      
      // Use direct repository access (fallback)
      const updatedTask = await this.repo.updateMetadata(options.id, options.field, parsedValue, 'append');
      
      if (!updatedTask) {
        console?.error(`Task with ID ${options.id} not found`);
        return null;
      }
      
      if (format === 'json') {
        console.log(JSON.stringify((updatedTask as any).metadata || {}, null, 2));
      } else {
        console.log(`Value appended to metadata field '${options.field}' for task ${options.id}`);
        console.log(`Updated field: ${JSON.stringify((updatedTask as any).metadata?.[options.field], null, 2)}`);
      }

      return (updatedTask as any).metadata || {};
    } catch (error) {
      console?.error('Error appending to metadata:', error);
      throw error;
    }
  }
}

/**
 * Create the metadata command
 */
export function createMetadataCommand() {
  const metadataCommand = new Command('metadata')
    .description('Manage task metadata')
    .option('--format <format>', 'Output format (text, json)', 'text');

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(metadataCommand, {
    description: 'Work with structured task metadata by managing custom fields. The metadata command allows you to get, set, remove, and append data to arbitrary fields on tasks.',
    examples: [
      {
        command: 'tm metadata get --id 5',
        description: 'Get all metadata for task #5'
      },
      {
        command: 'tm metadata get --id 8 --field assignee',
        description: 'Get only the assignee field from task #8'
      },
      {
        command: 'tm metadata set --id 3 --field priority --value high',
        description: 'Set the priority field to "high" for task #3'
      },
      {
        command: 'tm metadata set --id 10 --field details --value \'{"complexity":"medium","estimate":4}\'',
        description: 'Set a JSON object as a metadata field'
      },
      {
        command: 'tm metadata append --id 7 --field reviewers --value "alice"',
        description: 'Add "alice" to the reviewers list for task #7'
      },
      {
        command: 'tm metadata remove --id 4 --field temporary',
        description: 'Remove the "temporary" field from task #4'
      }
    ],
    notes: [
      'Metadata is stored as JSON and can contain any valid JSON data type',
      'The "set" command will create the field if it doesn\'t exist',
      'The "append" command will create an array if the field doesn\'t exist',
      'Append will convert a single value to an array when needed',
      'Complex values can be added as JSON strings with proper quoting',
      'Metadata is a powerful way to extend tasks with custom attributes'
    ],
    seeAlso: ['add', 'update', 'search']
  });
  
  // Get all metadata for a task
  const getCommand = metadataCommand
    .command('get')
    .description('Get all metadata for a task')
    .requiredOption('--id <id>', 'Task ID')
    .option('--field <field>', 'Get a specific metadata field');

  // Enhance help for get subcommand
  helpFormatter.enhanceHelp(getCommand, {
    description: 'Retrieve metadata from a task. You can get all metadata fields or request a specific field by name.',
    examples: [
      {
        command: 'tm metadata get --id 5',
        description: 'Get all metadata for task #5'
      },
      {
        command: 'tm metadata get --id 8 --field assignee',
        description: 'Get only the assignee field from task #8'
      },
      {
        command: 'tm metadata get --id 3 --format json',
        description: 'Get metadata in JSON format'
      }
    ],
    notes: [
      'If no field is specified, all metadata fields are returned',
      'Returns empty object {} if task has no metadata',
      'Returns null if the requested field doesn\'t exist'
    ],
    seeAlso: ['metadata set', 'metadata remove']
  })
    .action(async (options, command) => {
      try {
        const repo = new TaskRepository();
        const format = command.parent.opts().format as OutputFormat;
        const handler = new MetadataCommandHandler('get', repo);
        
        try {
          await handler.handleGetMetadata(options, format);
        } finally {
          repo.close();
        }
      } catch (error) {
        console?.error('Error getting metadata:', error);
        process.exit(1);
      }
    });
  
  // Set metadata field
  const setCommand = metadataCommand
    .command('set')
    .description('Set a metadata field for a task')
    .requiredOption('--id <id>', 'Task ID')
    .requiredOption('--field <field>', 'Metadata field name')
    .requiredOption('--value <value>', 'Field value');

  // Enhance help for set subcommand
  helpFormatter.enhanceHelp(setCommand, {
    description: 'Create or update a metadata field on a task. This command can add new fields or change existing ones.',
    examples: [
      {
        command: 'tm metadata set --id 3 --field priority --value high',
        description: 'Set a simple string value'
      },
      {
        command: 'tm metadata set --id 7 --field dueDate --value "2023-12-31"',
        description: 'Set a date as a string value'
      },
      {
        command: 'tm metadata set --id 10 --field storyPoints --value 5',
        description: 'Set a numeric value'
      },
      {
        command: 'tm metadata set --id 8 --field details --value \'{"complexity":"high","estimate":8}\'',
        description: 'Set a complex JSON object as a value'
      }
    ],
    notes: [
      'Values are automatically parsed as JSON when possible (numbers, booleans, objects, arrays)',
      'To set a string that looks like a number, wrap it in quotes in the command',
      'Complex values like objects must be properly quoted in the command',
      'Setting a field that already exists will overwrite its previous value'
    ],
    seeAlso: ['metadata get', 'metadata append', 'metadata remove']
  })
    .action(async (options, command) => {
      try {
        const repo = new TaskRepository();
        const format = command.parent.opts().format as OutputFormat;
        const handler = new MetadataCommandHandler('set', repo);
        
        try {
          await handler.handleSetMetadata(options, format);
        } finally {
          repo.close();
        }
      } catch (error) {
        console?.error('Error setting metadata:', error);
        process.exit(1);
      }
    });
  
  // Remove metadata field
  const removeCommand = metadataCommand
    .command('remove')
    .description('Remove a metadata field from a task')
    .requiredOption('--id <id>', 'Task ID')
    .requiredOption('--field <field>', 'Metadata field name');

  // Enhance help for remove subcommand
  helpFormatter.enhanceHelp(removeCommand, {
    description: 'Delete a metadata field from a task. This permanently removes the field and its value.',
    examples: [
      {
        command: 'tm metadata remove --id 4 --field temporary',
        description: 'Remove the "temporary" field from task #4'
      },
      {
        command: 'tm metadata remove --id 12 --field obsolete --format json',
        description: 'Remove a field and get the updated metadata as JSON'
      }
    ],
    notes: [
      'Removing a field is permanent and cannot be undone',
      'If the field does not exist, the command is a no-op (succeeds without error)',
      'The command returns the complete metadata object after removal'
    ],
    seeAlso: ['metadata get', 'metadata set']
  })
    .action(async (options, command) => {
      try {
        const repo = new TaskRepository();
        const format = command.parent.opts().format as OutputFormat;
        const handler = new MetadataCommandHandler('remove', repo);
        
        try {
          await handler.handleRemoveMetadata(options, format);
        } finally {
          repo.close();
        }
      } catch (error) {
        console?.error('Error removing metadata:', error);
        process.exit(1);
      }
    });
  
  // Append to metadata field (for array values)
  const appendCommand = metadataCommand
    .command('append')
    .description('Append to a metadata field (creates/converts to array if needed)')
    .requiredOption('--id <id>', 'Task ID')
    .requiredOption('--field <field>', 'Metadata field name')
    .requiredOption('--value <value>', 'Value to append');

  // Enhance help for append subcommand
  helpFormatter.enhanceHelp(appendCommand, {
    description: 'Add a value to an array field, creating the array if needed. This allows you to build lists of values incrementally.',
    examples: [
      {
        command: 'tm metadata append --id 7 --field reviewers --value "alice"',
        description: 'Add "alice" to the reviewers list'
      },
      {
        command: 'tm metadata append --id 5 --field blockers --value 12',
        description: 'Add task #12 as a blocker'
      },
      {
        command: 'tm metadata append --id 3 --field comments --value \'{"author":"bob","text":"Looks good"}\'',
        description: 'Add a complex object to a comments array'
      }
    ],
    notes: [
      'If the field doesn\'t exist, it will be created as an array with the single value',
      'If the field exists but is not an array, it will be converted to an array containing both the old value and the new value',
      'Use this command to build lists incrementally without overwriting existing values',
      'Values are parsed as JSON when possible, similar to the set command'
    ],
    seeAlso: ['metadata set', 'metadata get', 'metadata remove']
  })
    .action(async (options, command) => {
      try {
        const repo = new TaskRepository();
        const format = command.parent.opts().format as OutputFormat;
        const handler = new MetadataCommandHandler('append', repo);
        
        try {
          await handler.handleAppendMetadata(options, format);
        } finally {
          repo.close();
        }
      } catch (error) {
        console?.error('Error appending to metadata:', error);
        process.exit(1);
      }
    });
  
  return metadataCommand;
}