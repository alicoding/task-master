import { Command } from 'commander';
import { TaskRepository } from '@/core/repo';
import { TaskUpdateOptions, OutputFormat } from '@/core/types';
import fs from 'fs/promises';
import { createBatchUpdateCommand } from '@/cli/commands/update/batch';
import { helpFormatter } from '@/cli/helpers/help-formatter';
import { InteractiveUpdateForm } from '@/cli/commands/update/interactive-form';

export async function createUpdateCommand() {
  const updateCommand = new Command('update')
    .description('Update tasks')
    .option('--id <id>', 'Task ID to update')
    .option('--title <title>', 'New task title')
    .option('--description <description>', 'Short description of the task')
    .option('--body <body>', 'Detailed task body/content')
    .option('--status <status>', 'New task status (todo, in-progress, done)')
    .option('--readiness <readiness>', 'New task readiness (draft, ready, blocked)')
    .option('--tags <tags...>', 'New task tags')
    .option('--metadata <json>', 'JSON string with metadata to add/update (PATCH-style)')
    .option('--format <format>', 'Output format (text, json)', 'text')
    .option('--interactive', 'Use interactive mode for updating task')
    .option('--dry-run', 'Show what would be updated without making changes')
    // --force option removed as DoD is now informational only

  // Enhance help with examples and additional information
  helpFormatter.enhanceHelp(updateCommand, {
    description: 'Modify existing tasks by updating their properties such as title, status, readiness, tags, or metadata. Supports both single task updates and batch modifications.',
    examples: [
      {
        command: 'tm update --id 42 --title "New task title"',
        description: 'Update the title of task #42'
      },
      {
        command: 'tm update --id 5 --status done',
        description: 'Mark task #5 as completed'
      },
      {
        command: 'tm update --id 8 --readiness blocked --tags priority blocker',
        description: 'Mark task as blocked and add tags'
      },
      {
        command: 'tm update --id 3 --metadata \'{"assignee":"jane","priority":1}\'',
        description: 'Add or update metadata fields'
      },
      {
        command: 'tm update batch --input updates.json',
        description: 'Update multiple tasks from a batch file'
      },
      {
        command: 'tm update --id 10 --dry-run',
        description: 'Preview changes without updating the task'
      }
    ],
    notes: [
      'The --id parameter is required for single task updates',
      'Metadata updates are applied as a patch (only specified fields are updated)',
      'For updating multiple tasks at once, use the batch subcommand',
      'Use the --dry-run flag to preview changes without making them',
      'Missing parameters are left unchanged from the original task'
    ],
    seeAlso: ['add', 'show', 'remove', 'update batch']
  })

  // Add batch subcommand
  updateCommand.addCommand(await createBatchUpdateCommand())
    .action(async (options) => {
      try {
        const repo = new TaskRepository();
        const format = options.format as OutputFormat;
        const dryRun = options.dryRun || false;

        // Check if this is a batch update from file
        if (options.input) {
          console.warn('--input option is deprecated for direct use with update command.');
          console.warn('Please use the batch subcommand instead: tm update batch --input <file>');
          console.warn('Redirecting to batch update subcommand...\n');

          // Forward to the batch command
          const batchCmd = createBatchUpdateCommand();
          await batchCmd.action({
            input: options.input,
            dry_run: dryRun,
            format
          });
        } else if (options.id) {
          // Get the current task for updating
          const originalTask = await repo.getTask(options.id);
          if (!originalTask) {
            console.error(`Task with ID ${options.id} not found`);
            repo.close();
            return;
          }

          let updateOptions: TaskUpdateOptions;

          // Check if interactive mode is enabled
          if (options.interactive) {
            // Use interactive form for update
            const form = new InteractiveUpdateForm(originalTask, repo, true);
            const formResult = await form.run();

            // If user cancelled, exit
            if (!formResult) {
              repo.close();
              return;
            }

            updateOptions = formResult;
          } else {
            // Regular command line update
            updateOptions = {
              id: options.id
            };

            if (options.title) updateOptions.title = options.title;
            if (options.description !== undefined) updateOptions.description = options.description;
            if (options.body !== undefined) updateOptions.body = options.body;
            if (options.status) updateOptions.status = options.status;
            if (options.readiness) updateOptions.readiness = options.readiness;
            if (options.tags) updateOptions.tags = options.tags;

            // Handle metadata from command line
            if (options.metadata) {
              try {
                updateOptions.metadata = JSON.parse(options.metadata);
              } catch (e) {
                console.error('Invalid JSON for metadata:', e);
                repo.close();
                return;
              }
            }
          }

          // Handle dry run mode
          if (dryRun) {
            console.log(`Would update task ${options.id}:`);
            console.log('- Current:', JSON.stringify(originalTask, null, 2));
            console.log('- Updates:', JSON.stringify(updateOptions, null, 2));
            repo.close();
            return;
          }

          // DoD requirements are now purely informational and don't require verification

          const result = await repo.updateTask(updateOptions);

          if (!result.success || !result.data) {
            console.error(`Failed to update task: ${result.error?.message || 'Unknown error'}`);
            repo.close();
            return;
          }

          const task = result.data;

          if (format === 'json') {
            console.log(JSON.stringify(task, null, 2));
          } else {
            const chalk = (await import('chalk')).default;
            console.log(chalk.green.bold(`\n✅ Task ${task.id} updated successfully!`));
            console.log(chalk.bold.white(`${task.title}`));

            if (task.description !== undefined && task.description !== null) {
              console.log(`\n${chalk.cyan(('Description:' as string))}\n${task.description}`);
            }

            if (task.body !== undefined && task.body !== null) {
              console.log(`\n${chalk.cyan(('Details:' as string))}\n${task.body}`);
            }

            console.log(`\n${chalk.yellow(('Status:' as string))} ${task.status}`);
            console.log(`${chalk.yellow(('Readiness:' as string))} ${task.readiness}`);

            if (task.tags && task.tags.length > 0) {
              console.log(`${chalk.yellow(('Tags:' as string))} ${task.tags.map(tag => chalk.green(`#${tag}`)).join(' ')}`);
            } else {
              console.log(`${chalk.yellow(('Tags:' as string))} none`);
            }

            console.log(`\n${chalk.gray(('Created:' as string))} ${new Date(task.createdAt).toLocaleString()}`);
            console.log(`${chalk.gray(('Updated:' as string))} ${new Date(task.updatedAt).toLocaleString()}`);

            if (Object.keys(task.metadata || {}).length > 0) {
              console.log(`\n${chalk.gray(('Metadata:' as string))}\n${JSON.stringify(task.metadata, null, 2)}`);
            }
          }
        } else {
          console.error('Either --id or --input must be provided');
        }
        
        repo.close();
      } catch (error) {
        console.error('Error updating task:', error);
        process.exit(1);
      }
    });
  
  return updateCommand;
}