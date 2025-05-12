/**
 * Terminal integration command for Task Master CLI
 * Implements Task 17.7: Terminal Integration - CLI Command
 * 
 * This module provides CLI commands for terminal integration, including
 * session management, status display, and shell integration.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createDb } from '../../../db/init.ts';
import { TerminalSessionManager } from '../../../core/terminal/terminal-session-manager-index.ts';
import { TerminalStatusIndicator, TaskIndicatorData } from '../../../core/terminal/terminal-status-indicator.ts';
import { tasks } from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { handleTimeWindowCommand } from './window-command.ts';

/**
 * Create the terminal command
 */
export function createTerminalCommand(): Command {
  const terminalCommand = new Command('terminal')
    .description('Terminal integration commands')
    .alias('term');
  
  // Add subcommands
  terminalCommand
    .command('status')
    .description('Show terminal integration status')
    .action(showStatus);
  
  terminalCommand
    .command('prompt')
    .description('Generate terminal prompt')
    .option('-f, --format <format>', 'Prompt format (simple, detailed, compact)', 'simple')
    .option('-c, --colors <boolean>', 'Use colors in prompt', 'true')
    .action(generatePrompt);
  
  terminalCommand
    .command('setup')
    .description('Setup terminal shell integration')
    .option('-s, --shell <shell>', 'Shell type (bash, zsh, fish)', '')
    .option('-o, --output <path>', 'Output path for shell script', '')
    .option('-p, --print', 'Print script instead of installing')
    .action(setupShellIntegration);
  
  terminalCommand
    .command('task')
    .description('Set current task for terminal session')
    .argument('<taskId>', 'Task ID to set as current')
    .action(setCurrentTask);
  
  terminalCommand
    .command('session')
    .description('Session management commands')
    .option('-l, --list', 'List active sessions')
    .option('-d, --disconnect', 'Disconnect current session')
    .option('-i, --id <sessionId>', 'Operate on a specific session by ID')
    .option('-t, --tasks', 'Show tasks for the session')
    .option('-f, --files', 'Show files modified in the session')
    .action(manageSessions);

  terminalCommand
    .command('recover')
    .description('Recover terminal sessions')
    .option('-a, --all', 'Recover all disconnected sessions for current user')
    .option('-i, --id <sessionId>', 'Recover a specific session by ID')
    .option('-r, --recent', 'Recover the most recent session (default)')
    .action(recoverSessions);

  // Add time window subcommand
  const windowCommand = terminalCommand
    .command('window')
    .description('Manage time windows for terminal sessions')
    .option('-l, --list', 'List time windows for current session')
    .option('-c, --create', 'Create a new time window')
    .option('-m, --merge', 'Merge multiple time windows')
    .option('-s, --split', 'Split a time window')
    .option('-a, --auto', 'Auto-detect time windows based on activity')
    .option('--stats', 'Show time window statistics')
    .option('-i, --id <windowId>', 'Specify a time window ID')
    .option('--ids <windowIds>', 'Comma-separated list of window IDs for merging', (val) => val.split(','))
    .option('--start <startTime>', 'Start time for a new window (ISO format)')
    .option('--end <endTime>', 'End time for a new window (ISO format)')
    .option('--time <splitTime>', 'Split time for window splitting (ISO format)')
    .option('--name <name>', 'Name for the time window')
    .option('--type <type>', 'Type of time window (work, break, meeting, etc.)')
    .option('-f, --format <format>', 'Output format (text, json)', 'text')
    .action(handleTimeWindowCommand);

  return terminalCommand;
}

/**
 * Show terminal integration status
 */
async function showStatus(): Promise<void> {
  try {
    const { db } = createDb();
    const sessionManager = new TerminalSessionManager(db);
    
    // Initialize session
    await sessionManager.initialize();
    
    // Get integration status
    const status = await sessionManager.getIntegrationStatus();
    
    if (!status.enabled) {
      console.log(chalk.yellow('Terminal integration is not active.'));
      console.log('Run the following command to enable it:');
      console.log(chalk.cyan('  taskmaster terminal setup'));
      return;
    }
    
    // Format output
    console.log(chalk.bold('Terminal Integration Status'));
    console.log('─'.repeat(30));
    console.log(`Session ID:      ${chalk.cyan(status.sessionId)}`);
    console.log(`TTY:             ${status.tty}`);
    console.log(`Status:          ${formatSessionStatus(status.status)}`);
    console.log(`Duration:        ${formatDuration(status.sessionDuration)}`);
    console.log(`Shell Integrated: ${status.shellIntegrated ? chalk.green('Yes') : chalk.yellow('No')}`);
    console.log(`Tasks Used:      ${status.taskCount}`);
    console.log(`Files Modified:  ${status.fileCount}`);
    
    if (status.currentTaskId) {
      const currentTask = await db.query.tasks.findFirst({
        where: eq(tasks.id, status.currentTaskId)
      });
      
      if (currentTask) {
        console.log('\nCurrent Task:');
        console.log(`  ${chalk.cyan(currentTask.id)}: ${currentTask.title}`);
        console.log(`  Status: ${formatTaskStatus(currentTask.status)}`);
      }
    }
    
    if (!status.shellIntegrated) {
      console.log('\nTo enable shell integration, run:');
      console.log(chalk.cyan('  taskmaster terminal setup'));
    }
  } catch (error) {
    console.error(chalk.red('Error showing terminal status:'), error);
    process.exit(1);
  }
}

/**
 * Generate terminal prompt
 */
async function generatePrompt(options: { format: string; colors: string }): Promise<void> {
  try {
    const { db } = createDb();
    const sessionManager = new TerminalSessionManager(db);
    
    // Initialize session
    await sessionManager.initialize();
    
    // Get current session
    const session = sessionManager.getCurrentSession();
    
    if (!session) {
      console.log('');
      return;
    }
    
    // Get current task if set
    let currentTask: TaskIndicatorData | undefined;
    
    if (session.currentTaskId) {
      const taskData = await db.query.tasks.findFirst({
        where: eq(tasks.id, session.currentTaskId)
      });
      
      if (taskData) {
        currentTask = {
          id: taskData.id,
          title: taskData.title,
          status: taskData.status
        };
      }
    }
    
    // Get session stats
    const status = await sessionManager.getIntegrationStatus();
    const stats = {
      taskCount: status.taskCount,
      fileCount: status.fileCount,
      duration: status.sessionDuration
    };
    
    // Create status indicator
    const statusIndicator = new TerminalStatusIndicator({
      format: options.format as any || 'simple',
      useColors: options.colors === 'true',
      showTaskCount: true,
      showFileCount: true
    });
    
    // Output prompt - just the indicator itself, no wrapping
    process.stdout.write(statusIndicator.generateStatusIndicator(session, currentTask, stats));
  } catch (error) {
    // Don't show error, just output nothing
    process.stdout.write('');
  }
}

/**
 * Setup shell integration
 */
async function setupShellIntegration(options: { 
  shell: string; 
  output: string;
  print: boolean;
}): Promise<void> {
  try {
    // Create status indicator with auto-detection
    const statusIndicator = new TerminalStatusIndicator();
    
    // If shell is specified, override the auto-detected shell
    if (options.shell) {
      statusIndicator.config.shellType = options.shell as any;
    }
    
    // Generate shell script
    const script = statusIndicator.generateShellIntegrationScript();
    
    // If print flag is set, just print the script
    if (options.print) {
      console.log(script);
      return;
    }
    
    // Determine output path
    let outputPath = options.output;
    
    if (!outputPath) {
      const homeDir = os.homedir();
      
      // Determine default config file based on shell type
      switch (statusIndicator.config.shellType) {
        case 'bash':
          outputPath = path.join(homeDir, '.bashrc');
          break;
        case 'zsh':
          outputPath = path.join(homeDir, '.zshrc');
          break;
        case 'fish':
          outputPath = path.join(homeDir, '.config', 'fish', 'config.fish');
          break;
        default:
          console.error(chalk.red(`Shell type ${statusIndicator.config.shellType} not supported for automatic installation.`));
          console.log('Use --print to get the script and install it manually.');
          return;
      }
    }
    
    // Check if file exists
    if (!fs.existsSync(outputPath)) {
      console.error(chalk.red(`Output file ${outputPath} does not exist.`));
      console.log('Use --print to get the script and install it manually.');
      return;
    }
    
    // Create backup
    const backupPath = `${outputPath}.taskmaster-backup`;
    fs.copyFileSync(outputPath, backupPath);
    
    // Read existing file
    const existingContent = fs.readFileSync(outputPath, 'utf-8');
    
    // Check if integration is already installed
    if (existingContent.includes('Task Master Terminal Integration')) {
      console.log(chalk.yellow('Terminal integration already installed.'));
      console.log(`To reinstall, remove the integration block from ${outputPath} first.`);
      return;
    }
    
    // Append the script
    const separator = '\n\n# ===== Task Master Terminal Integration =====\n';
    const newContent = existingContent + separator + script;
    
    // Write the file
    fs.writeFileSync(outputPath, newContent);
    
    console.log(chalk.green('Terminal integration installed successfully!'));
    console.log(`Integration added to ${chalk.cyan(outputPath)}`);
    console.log(`Backup created at ${chalk.cyan(backupPath)}`);
    console.log('\nRestart your shell or source the file to activate:');
    console.log(chalk.cyan(`  source ${outputPath}`));
    
  } catch (error) {
    console.error(chalk.red('Error setting up shell integration:'), error);
    process.exit(1);
  }
}

/**
 * Set current task for terminal session
 */
async function setCurrentTask(taskId: string): Promise<void> {
  try {
    const { db } = createDb();
    const sessionManager = new TerminalSessionManager(db);
    
    // Initialize session
    await sessionManager.initialize();
    
    // Get current session
    const session = sessionManager.getCurrentSession();
    
    if (!session) {
      console.error(chalk.red('No active terminal session.'));
      console.log('Run taskmaster terminal status to check your session status.');
      return;
    }
    
    // Check if task exists
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId)
    });
    
    if (!task) {
      console.error(chalk.red(`Task ${taskId} not found.`));
      return;
    }
    
    // Set current task
    await sessionManager.updateSession({
      currentTaskId: taskId
    });
    
    console.log(chalk.green(`Current task set to ${chalk.cyan(taskId)}: ${task.title}`));
    
  } catch (error) {
    console.error(chalk.red('Error setting current task:'), error);
    process.exit(1);
  }
}

/**
 * Manage terminal sessions
 */
async function manageSessions(options: {
  list?: boolean;
  disconnect?: boolean;
  id?: string;
  tasks?: boolean;
  files?: boolean;
}): Promise<void> {
  try {
    const { db } = createDb();
    const sessionManager = new TerminalSessionManager(db);
    
    // Initialize session if no specific actions
    if (!options.list && !options.disconnect && !options.id) {
      await sessionManager.initialize();
      const session = sessionManager.getCurrentSession();
      
      if (!session) {
        console.log(chalk.yellow('No active terminal session.'));
        return;
      }
      
      // Show current session
      displaySession(session);
      return;
    }
    
    // List all active sessions
    if (options.list) {
      const activeSessions = await sessionManager.getActiveSessions();
      
      if (activeSessions.length === 0) {
        console.log(chalk.yellow('No active terminal sessions found.'));
        return;
      }
      
      console.log(chalk.bold('Active Terminal Sessions'));
      console.log('─'.repeat(30));
      
      for (const session of activeSessions) {
        console.log(`Session: ${chalk.cyan(session.id)}`);
        console.log(`  TTY: ${session.fingerprint.tty}`);
        console.log(`  User: ${session.fingerprint.user}`);
        console.log(`  Started: ${formatDate(session.startTime)}`);
        console.log(`  Last Active: ${formatDate(session.lastActive)}`);
        console.log('');
      }
      
      return;
    }
    
    // Disconnect current session
    if (options.disconnect) {
      await sessionManager.disconnectSession();
      console.log(chalk.green('Terminal session disconnected.'));
      return;
    }
    
    // Show specific session by ID
    if (options.id) {
      const session = await sessionManager.getSessionById(options.id);
      
      if (!session) {
        console.error(chalk.red(`Session ${options.id} not found.`));
        return;
      }
      
      displaySession(session);
      
      // Show tasks for the session
      if (options.tasks) {
        const sessionTasks = await sessionManager.getSessionTasks(options.id);
        
        if (sessionTasks.length === 0) {
          console.log(chalk.yellow('\nNo tasks used in this session.'));
          return;
        }
        
        console.log(chalk.bold('\nTasks Used in Session'));
        console.log('─'.repeat(30));
        
        for (const task of sessionTasks) {
          console.log(`${chalk.cyan(task.id)}: ${task.title}`);
          console.log(`  Last Used: ${formatDate(task.accessTime)}`);
          console.log(`  Status: ${formatTaskStatus(task.status)}`);
          console.log('');
        }
      }
      
      // Show files for the session (not implemented yet)
      if (options.files) {
        console.log(chalk.yellow('\nFile tracking display not implemented yet.'));
      }
    }
  } catch (error) {
    console.error(chalk.red('Error managing sessions:'), error);
    process.exit(1);
  }
}

/**
 * Display session information
 */
function displaySession(session: any): void {
  console.log(chalk.bold('Terminal Session'));
  console.log('─'.repeat(30));
  console.log(`Session ID: ${chalk.cyan(session.id)}`);
  console.log(`TTY:        ${session.fingerprint?.tty || session.tty || 'unknown'}`);
  console.log(`User:       ${session.fingerprint?.user || session.user || 'unknown'}`);
  console.log(`Shell:      ${session.fingerprint?.shell || session.shell || 'unknown'}`);
  console.log(`Status:     ${formatSessionStatus(session.status)}`);
  console.log(`Started:    ${formatDate(session.startTime)}`);
  console.log(`Last Active: ${formatDate(session.lastActive)}`);
  
  if (session.currentTaskId) {
    console.log(`Current Task: ${chalk.cyan(session.currentTaskId)}`);
  }
  
  if (session.connectionCount > 1) {
    console.log(`Connections: ${session.connectionCount}`);
  }
}

/**
 * Format session status with color
 */
function formatSessionStatus(status: string): string {
  switch (status) {
    case 'active':
      return chalk.green('Active');
    case 'inactive':
      return chalk.yellow('Inactive');
    case 'disconnected':
      return chalk.red('Disconnected');
    default:
      return status;
  }
}

/**
 * Format task status with color
 */
function formatTaskStatus(status: string): string {
  switch (status) {
    case 'done':
      return chalk.green('Done');
    case 'in-progress':
      return chalk.yellow('In Progress');
    case 'todo':
      return chalk.cyan('Todo');
    default:
      return status;
  }
}

/**
 * Format duration in milliseconds to human readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format date nicely
 */
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString();
}

/**
 * Recover terminal sessions
 */
async function recoverSessions(options: {
  all?: boolean;
  id?: string;
  recent?: boolean;
}): Promise<void> {
  try {
    const { db } = createDb();
    const sessionManager = new TerminalSessionManager(db);

    // Initialize first to set up the recovery manager
    await sessionManager.initialize();

    // Get access to the recovery manager by adding it to the session manager
    // This is a bit hacky but avoids having to create a new instance
    const recoveryManager = (sessionManager as any)._recoveryManager;

    if (!recoveryManager) {
      console.error(chalk.red('Session recovery is not enabled in this environment.'));
      process.exit(1);
    }

    // Recover a specific session by ID
    if (options.id) {
      console.log(chalk.bold(`Attempting to recover session ${options.id}...`));

      const recoveredSession = await recoveryManager.recoverSession(options.id);

      if (recoveredSession) {
        console.log(chalk.green(`Successfully recovered session: ${options.id}`));
        displaySession(recoveredSession);
      } else {
        console.error(chalk.red(`Failed to recover session: ${options.id}`));
      }

      return;
    }

    // Recover all sessions for current user
    if (options.all) {
      console.log(chalk.bold('Recovering all disconnected sessions for current user...'));

      const result = await recoveryManager.recoverAllUserSessions();

      console.log(chalk.bold(`Recovery results: ${result.successful}/${result.total} successful`));

      if (result.successful > 0) {
        console.log(chalk.green(`Successfully recovered ${result.successful} sessions.`));
      }

      if (result.failed > 0) {
        console.log(chalk.yellow(`Failed to recover ${result.failed} sessions.`));
      }

      if (result.total === 0) {
        console.log(chalk.yellow('No disconnected sessions found for current user.'));
      }

      return;
    }

    // Default: recover most recent session
    console.log(chalk.bold('Attempting to recover most recent session...'));

    const recoveredSession = await recoveryManager.recoverMostRecentSession();

    if (recoveredSession) {
      console.log(chalk.green(`Successfully recovered session: ${recoveredSession.id}`));
      displaySession(recoveredSession);
    } else {
      console.log(chalk.yellow('No suitable session found for recovery.'));
    }
  } catch (error) {
    console.error(chalk.red('Error recovering sessions:'), error);
    process.exit(1);
  }
}