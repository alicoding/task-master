/**
 * CLI command for daemon management
 * Part of Task 17.1: Daemon Process Implementation
 */

import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import {
  createDaemon,
  getDaemon,
  closeDaemon,
  FileTrackingDaemonConfig
} from '../../../core/daemon/index.ts';
import { FileTrackingRepository } from '../../../core/repository/file-tracking.ts';
import { createBaseRepository } from '../../../core/repository/factory.ts';

export default function registerDaemonCommand(program: Command): void {
  const daemonCommand = program
    .command('daemon')
    .description('Manage the file tracking daemon');

  // Start daemon subcommand
  daemonCommand
    .command('start')
    .description('Start the file tracking daemon')
    .option('-p, --path <paths...>', 'Paths to watch (default: current directory)')
    .option('-e, --exclude <paths...>', 'Paths to exclude (default: node_modules,.git,dist)')
    .option('-a, --auto-associate', 'Automatically associate files with tasks', true)
    .option('-c, --confidence <threshold>', 'Confidence threshold for auto-association (0-100)', parseFloat, 70)
    .option('-i, --interval <ms>', 'Polling interval in milliseconds', parseInt, 1000)
    .option('-d, --detach', 'Run daemon in detached mode (background)')
    .option('-f, --filter <extensions...>', 'Only watch files with these extensions (e.g., .js,.ts,.md)')
    .action(async (options) => {
      try {
        const config: Partial<FileTrackingDaemonConfig> = {
          watchPaths: options.path ? options.path.map((p: string) => path.resolve(p)) : [process.cwd()],
          excludePaths: options.exclude || ['node_modules', '.git', 'dist'],
          autoAssociate: options.autoAssociate,
          confidenceThreshold: options.confidence,
          pollingInterval: options.interval,
          includeExtensions: options.filter ?
            (Array.isArray(options.filter) ? options.filter : [options.filter])
              .map((ext: string) => ext.startsWith('.') ? ext : `.${ext}`) :
            []
        };

        // Create repository
        const baseRepo = createBaseRepository();
        const fileTrackingRepo = new FileTrackingRepository(baseRepo._db);

        // Create and start daemon
        const daemon = createDaemon(fileTrackingRepo, config);

        console.log(chalk.blue('Starting file tracking daemon...'));
        
        // Setup event listeners
        daemon.on('started', (info) => {
          console.log(chalk.green('✅ Daemon started successfully'));
          console.log(`Watching paths: ${info.watchPaths.map(p => chalk.yellow(p)).join(', ')}`);
          if (info.excludePaths && info.excludePaths.length > 0) {
            console.log(`Excluding paths: ${info.excludePaths.map(p => chalk.yellow(p)).join(', ')}`);
          }
          console.log(`Auto-association: ${daemon.config.autoAssociate ? chalk.green('enabled') : chalk.red('disabled')}`);
          console.log(`Confidence threshold: ${chalk.yellow(daemon.config.confidenceThreshold)}%`);
          
          if (!options.detach) {
            console.log(chalk.blue('\nPress Ctrl+C to stop the daemon'));
          }
        });

        daemon.on('error', (error) => {
          console.error(chalk.red(`❌ Daemon error: ${error.message}`));
        });

        daemon.on('fileChange', (event) => {
          console.log(chalk.blue(`📝 File ${event.type}: ${event.path}`));
        });

        daemon.on('taskAssociated', (event) => {
          console.log(
            chalk.green(`🔗 Associated file ${event.filePath} with task ${event.taskId} (${event.relationshipType}, ${event.confidence}% confidence)`)
          );
        });

        // Start the daemon
        await daemon.start();

        // If detached mode is enabled, return immediately
        if (options.detach) {
          console.log(chalk.blue('Daemon running in background'));
          console.log(`To check status: ${chalk.yellow('tm daemon status')}`);
          console.log(`To stop daemon: ${chalk.yellow('tm daemon stop')}`);
          return;
        }
        
        // Otherwise, keep the process running
        process.on('SIGINT', async () => {
          console.log(chalk.blue('\nStopping daemon...'));
          await daemon.stop();
          process.exit(0);
        });
      } catch (error) {
        console.error(chalk.red(`Failed to start daemon: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Stop daemon subcommand
  daemonCommand
    .command('stop')
    .description('Stop the file tracking daemon')
    .option('-f, --force', 'Force stop without waiting for pending operations')
    .action(async (options) => {
      try {
        const daemon = getDaemon();
        
        if (!daemon) {
          console.log(chalk.yellow('No daemon is currently running'));
          return;
        }

        console.log(chalk.blue('Stopping file tracking daemon...'));
        
        if (options.force) {
          await daemon.forceStop();
          console.log(chalk.green('✅ Daemon force stopped'));
        } else {
          await daemon.stop();
          console.log(chalk.green('✅ Daemon stopped gracefully'));
        }

        // Clean up daemon instance
        await closeDaemon();
      } catch (error) {
        console.error(chalk.red(`Failed to stop daemon: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Status subcommand
  daemonCommand
    .command('status')
    .description('Check the status of the file tracking daemon')
    .option('-v, --verbose', 'Show detailed status information')
    .action((options) => {
      const daemon = getDaemon();

      if (!daemon) {
        console.log(chalk.yellow('No daemon is currently running'));
        return;
      }

      console.log(chalk.blue('File Tracking Daemon Status'));
      console.log(`State: ${getStateColor(daemon.state)}`);
      console.log(`Watching paths: ${daemon.config.watchPaths.map(p => chalk.yellow(p)).join(', ')}`);

      if (daemon.config.excludePaths && daemon.config.excludePaths.length > 0) {
        console.log(`Excluding paths: ${daemon.config.excludePaths.map(p => chalk.yellow(p)).join(', ')}`);
      }

      console.log(`Auto-association: ${daemon.config.autoAssociate ? chalk.green('enabled') : chalk.red('disabled')}`);
      console.log(`Confidence threshold: ${chalk.yellow(daemon.config.confidenceThreshold)}%`);
      console.log(`Polling interval: ${chalk.yellow(daemon.config.pollingInterval)}ms`);
      console.log(`Max concurrent operations: ${chalk.yellow(daemon.config.maxConcurrentOperations)}`);

      // Get watcher stats if the daemon is running and verbose mode is enabled
      if (options.verbose && daemon.state === 'running' && daemon._watcher) {
        const watcherStatus = daemon._watcher.getStatus();

        console.log(chalk.blue('\nFile System Watcher Status'));
        console.log(`Active: ${watcherStatus.isWatching ? chalk.green('Yes') : chalk.red('No')}`);
        console.log(`Watched files: ${chalk.yellow(watcherStatus.watchedFiles)}`);
        console.log(`Pending events: ${chalk.yellow(watcherStatus.pendingEvents)}`);

        console.log(chalk.blue('\nEvent Statistics'));
        console.log(`Created files: ${chalk.yellow(watcherStatus.eventCounts.created)}`);
        console.log(`Modified files: ${chalk.yellow(watcherStatus.eventCounts.modified)}`);
        console.log(`Deleted files: ${chalk.yellow(watcherStatus.eventCounts.deleted)}`);
        console.log(`Renamed files: ${chalk.yellow(watcherStatus.eventCounts.renamed)}`);

        // Show file extensions being watched if any are specified
        if (watcherStatus.includeExtensions) {
          console.log(chalk.blue('\nFiltered Extensions'));
          console.log(`Watching only: ${watcherStatus.includeExtensions.map(ext => chalk.yellow(ext)).join(', ')}`);
        }
      }
    });

  // Associate subcommand
  daemonCommand
    .command('associate')
    .description('Manually associate a file with a task')
    .requiredOption('-f, --file <path>', 'Path to the file')
    .requiredOption('-t, --task <id>', 'Task ID')
    .option('-r, --relationship <type>', 'Relationship type (implements, tests, documents, related)', 'related')
    .option('-c, --confidence <score>', 'Confidence score (0-100)', parseFloat, 100)
    .action(async (options) => {
      try {
        const daemon = getDaemon();
        
        if (!daemon) {
          console.log(chalk.yellow('No daemon is currently running'));
          console.log(chalk.blue('Starting daemon...'));
          
          // Create and start daemon with default configuration
          const newDaemon = createDaemon();
          await newDaemon.start();
          console.log(chalk.green('✅ Daemon started successfully'));
        }

        const currentDaemon = getDaemon()!;
        
        // Validate relationship type
        const relationshipType = options.relationship as 'implements' | 'tests' | 'documents' | 'related';
        if (!['implements', 'tests', 'documents', 'related'].includes(relationshipType)) {
          console.error(chalk.red(`Invalid relationship type: ${options.relationship}`));
          console.log('Valid types: implements, tests, documents, related');
          return;
        }

        // Validate confidence score
        const confidence = Math.max(0, Math.min(100, options.confidence));
        
        // Resolve file path
        const filePath = path.resolve(options.file);

        console.log(chalk.blue(`Associating file ${filePath} with task ${options.task}...`));
        
        const result = await currentDaemon.associateFileWithTask(
          filePath,
          options.task,
          relationshipType,
          confidence
        );

        if (result.success) {
          console.log(chalk.green(`✅ Successfully associated file with task`));
          console.log(`File: ${chalk.yellow(filePath)}`);
          console.log(`Task: ${chalk.yellow(options.task)}`);
          console.log(`Relationship: ${chalk.yellow(relationshipType)}`);
          console.log(`Confidence: ${chalk.yellow(confidence)}%`);
        } else {
          console.error(chalk.red(`❌ Failed to associate file with task: ${result.error?.message || 'Unknown error'}`));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      }
    });

  // List files for task subcommand
  daemonCommand
    .command('files')
    .description('List files associated with a task')
    .requiredOption('-t, --task <id>', 'Task ID')
    .action(async (options) => {
      try {
        // Create repository
        const baseRepo = createBaseRepository();
        const fileTrackingRepo = new FileTrackingRepository(baseRepo._db);
        
        console.log(chalk.blue(`Finding files associated with task ${options.task}...`));
        
        const result = await fileTrackingRepo.getFilesForTask(options.task);

        if (result.success && result.data && result.data.length > 0) {
          console.log(chalk.green(`✅ Found ${result.data.length} files associated with task ${options.task}`));

          result.data.forEach((item, index) => {
            console.log(`\n${index + 1}. ${chalk.yellow(item.file.path)}`);
            console.log(`   Type: ${chalk.blue(item.relationship.relationshipType)}`);
            console.log(`   Confidence: ${chalk.blue(item.relationship.confidence)}%`);
            console.log(`   Last Modified: ${chalk.blue(new Date(item.file.lastModified).toLocaleString())}`);
          });
        } else if (result.success) {
          console.log(chalk.yellow(`No files found for task ${options.task}`));
        } else {
          console.error(chalk.red(`❌ Failed to get files: ${result.error?.message || 'Unknown error'}`));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      }
    });

  // List tasks for file subcommand
  daemonCommand
    .command('tasks')
    .description('List tasks associated with a file')
    .requiredOption('-f, --file <path>', 'Path to the file')
    .action(async (options) => {
      try {
        // Create repository
        const baseRepo = createBaseRepository();
        const fileTrackingRepo = new FileTrackingRepository(baseRepo._db);

        // Resolve file path
        const filePath = path.resolve(options.file);

        console.log(chalk.blue(`Finding tasks associated with file ${filePath}...`));

        const result = await fileTrackingRepo.getTasksForFile(filePath);

        if (result.success && result.data && result.data.length > 0) {
          console.log(chalk.green(`✅ Found ${result.data.length} tasks associated with file ${filePath}`));

          result.data.forEach((item, index) => {
            console.log(`\n${index + 1}. ${chalk.yellow(item.task.id)}: ${item.task.title}`);
            console.log(`   Type: ${chalk.blue(item.relationship.relationshipType)}`);
            console.log(`   Confidence: ${chalk.blue(item.relationship.confidence)}%`);
            console.log(`   Status: ${chalk.blue(item.task.status || 'Not set')}`);
          });
        } else if (result.success) {
          console.log(chalk.yellow(`No tasks found for file ${filePath}`));
        } else {
          console.error(chalk.red(`❌ Failed to get tasks: ${result.error?.message || 'Unknown error'}`));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      }
    });

  // Watch command
  daemonCommand
    .command('watch')
    .description('Add a path to the running daemon\'s watch list')
    .requiredOption('-p, --path <path>', 'Path to add to watch list')
    .action(async (options) => {
      try {
        const daemon = getDaemon();

        if (!daemon) {
          console.log(chalk.yellow('No daemon is currently running. Starting a new one...'));

          // Start a new daemon with default configuration
          const baseRepo = createBaseRepository();
          const fileTrackingRepo = new FileTrackingRepository(baseRepo._db);
          const newDaemon = createDaemon(fileTrackingRepo);
          await newDaemon.start();

          // Add the path
          const absolutePath = path.resolve(options.path);
          newDaemon._watcher?.addPath(absolutePath);

          console.log(chalk.green(`✅ Started daemon and added path ${absolutePath} to watch list`));
          return;
        }

        if (daemon.state !== 'running') {
          console.error(chalk.red(`Daemon is not running (current state: ${daemon.state})`));
          return;
        }

        if (!daemon._watcher) {
          console.error(chalk.red('Daemon watcher is not initialized'));
          return;
        }

        // Add the path to the watch list
        const absolutePath = path.resolve(options.path);
        daemon._watcher.addPath(absolutePath);

        console.log(chalk.green(`✅ Added path ${absolutePath} to watch list`));
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
}

/**
 * Get colored state for display
 */
function getStateColor(state: string): string {
  switch (state) {
    case 'running':
      return chalk.green('Running');
    case 'starting':
      return chalk.blue('Starting');
    case 'stopping':
      return chalk.yellow('Stopping');
    case 'stopped':
      return chalk.red('Stopped');
    case 'error':
      return chalk.red('Error');
    default:
      return chalk.gray(state);
  }
}