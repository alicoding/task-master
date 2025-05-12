/**
 * Time window command for terminal integration
 * Implements Task 17.8: Session Recovery - Subtask 17.8.2: Time Window Management CLI
 * 
 * This module provides CLI commands for managing time windows, including
 * listing, creating, and manipulating time windows.
 */

import chalk from 'chalk';
import { createDb } from '../../../db/init.ts';
import { TerminalSessionManager } from '../../../core/terminal/terminal-session-manager-index.ts';
import { TimeWindowManager } from '../../../core/terminal/time-window-manager.ts';
import { tasks } from '../../../db/schema.ts';
import { eq } from 'drizzle-orm';

/**
 * Handle time window command
 */
export async function handleTimeWindowCommand(options: {
  list?: boolean;
  create?: boolean;
  merge?: boolean;
  split?: boolean;
  auto?: boolean;
  stats?: boolean;
  id?: string;
  start?: string;
  end?: string;
  name?: string;
  type?: string;
  ids?: string[];
  time?: string;
  format?: string;
}): Promise<void> {
  try {
    const { db } = createDb();
    const sessionManager = new TerminalSessionManager(db);
    
    // Initialize session
    await sessionManager.initialize();
    
    // Get session
    const session = sessionManager.getCurrentSession();
    
    if (!session) {
      console.error(chalk.red('No active terminal session.'));
      console.log('Run taskmaster terminal status to check your session status.');
      return;
    }
    
    // Get time window manager
    const timeWindowManager = sessionManager.getTimeWindowManager();
    
    if (!timeWindowManager) {
      console.error(chalk.red('Time window management is not available.'));
      return;
    }
    
    // List time windows (default if no other action specified)
    if (options.list || (!options.create && !options.merge && !options.split && !options.auto && !options.stats)) {
      await listTimeWindows(sessionManager, timeWindowManager, options);
      return;
    }
    
    // Create a time window
    if (options.create) {
      await createTimeWindow(sessionManager, timeWindowManager, options);
      return;
    }
    
    // Merge time windows
    if (options.merge) {
      await mergeTimeWindows(sessionManager, timeWindowManager, options);
      return;
    }
    
    // Split a time window
    if (options.split) {
      await splitTimeWindow(sessionManager, timeWindowManager, options);
      return;
    }
    
    // Auto-detect time windows
    if (options.auto) {
      await autoDetectTimeWindows(sessionManager, timeWindowManager);
      return;
    }
    
    // Show time window statistics
    if (options.stats) {
      await showTimeWindowStats(sessionManager, timeWindowManager, options);
      return;
    }
    
  } catch (error) {
    console.error(chalk.red('Error managing time windows:'), error);
    process.exit(1);
  }
}

/**
 * List time windows
 */
async function listTimeWindows(
  sessionManager: TerminalSessionManager,
  timeWindowManager: TimeWindowManager,
  options: {
    id?: string;
    type?: string;
    format?: string;
  }
): Promise<void> {
  // Get current session
  const session = sessionManager.getCurrentSession();
  
  if (!session) {
    console.error(chalk.red('No active terminal session.'));
    return;
  }
  
  // If specific ID provided, show that window
  if (options.id) {
    const timeWindow = await timeWindowManager.getTimeWindowInfo(options.id);
    
    if (!timeWindow) {
      console.error(chalk.red(`Time window ${options.id} not found.`));
      return;
    }
    
    displayTimeWindow(timeWindow, options.format);
    return;
  }
  
  // Find time windows for the current session
  const criteria: any = {
    sessionId: session.id
  };
  
  if (options.type) {
    criteria.type = options.type;
  }
  
  const timeWindows = await timeWindowManager.findTimeWindows(criteria);
  
  if (timeWindows.length === 0) {
    console.log(chalk.yellow('No time windows found for current session.'));
    console.log('Use --auto to auto-detect time windows or --create to create a new one.');
    return;
  }
  
  console.log(chalk.bold(`Time Windows for Session ${session.id}`));
  console.log('─'.repeat(50));
  
  for (const window of timeWindows) {
    // Get window info
    const windowInfo = await timeWindowManager.getTimeWindowInfo(window.id);
    
    if (windowInfo) {
      displayTimeWindow(windowInfo, options.format, true);
      console.log('');
    } else {
      // Fallback to basic display
      console.log(`Window: ${chalk.cyan(window.id)}`);
      console.log(`  Name: ${window.name || 'Unnamed'}`);
      console.log(`  Type: ${window.type || 'unknown'}`);
      console.log(`  Period: ${formatDate(window.startTime)} - ${formatDate(window.endTime)}`);
      console.log(`  Status: ${window.status || 'unknown'}`);
      console.log('');
    }
  }
}

/**
 * Create a time window
 */
async function createTimeWindow(
  sessionManager: TerminalSessionManager,
  timeWindowManager: TimeWindowManager,
  options: {
    start?: string;
    end?: string;
    name?: string;
    type?: string;
  }
): Promise<void> {
  // Get current session
  const session = sessionManager.getCurrentSession();
  
  if (!session) {
    console.error(chalk.red('No active terminal session.'));
    return;
  }
  
  // Validate required parameters
  if (!options.start || !options.end) {
    console.error(chalk.red('Start and end times are required for creating a time window.'));
    console.log('Example: --create --start "2023-01-01T09:00" --end "2023-01-01T17:00"');
    return;
  }
  
  // Parse start and end times
  let startTime: Date;
  let endTime: Date;
  
  try {
    startTime = new Date(options.start);
    endTime = new Date(options.end);
  } catch (error) {
    console.error(chalk.red('Invalid date format. Use ISO format (e.g., "2023-01-01T09:00").'));
    return;
  }
  
  // Validate time range
  if (endTime <= startTime) {
    console.error(chalk.red('End time must be after start time.'));
    return;
  }
  
  // Create time window
  try {
    const timeWindow = await timeWindowManager.createTimeWindow(
      session.id,
      startTime,
      endTime,
      {
        name: options.name,
        type: options.type || 'manual'
      }
    );
    
    console.log(chalk.green('Time window created successfully.'));
    
    // Display the created window
    const windowInfo = await timeWindowManager.getTimeWindowInfo(timeWindow.id);
    
    if (windowInfo) {
      displayTimeWindow(windowInfo);
    } else {
      console.log(`Window ID: ${chalk.cyan(timeWindow.id)}`);
      console.log(`Name: ${timeWindow.name || 'Unnamed'}`);
      console.log(`Type: ${timeWindow.type || 'unknown'}`);
      console.log(`Period: ${formatDate(timeWindow.startTime)} - ${formatDate(timeWindow.endTime)}`);
    }
  } catch (error) {
    console.error(chalk.red('Error creating time window:'), error);
  }
}

/**
 * Merge time windows
 */
async function mergeTimeWindows(
  sessionManager: TerminalSessionManager,
  timeWindowManager: TimeWindowManager,
  options: {
    ids?: string[];
    name?: string;
    type?: string;
  }
): Promise<void> {
  // Get current session
  const session = sessionManager.getCurrentSession();
  
  if (!session) {
    console.error(chalk.red('No active terminal session.'));
    return;
  }
  
  // Validate required parameters
  if (!options.ids || options.ids.length < 2) {
    console.error(chalk.red('At least two window IDs are required for merging.'));
    console.log('Example: --merge --ids window1,window2,window3');
    return;
  }
  
  // Merge time windows
  try {
    const mergedWindow = await timeWindowManager.mergeTimeWindows(
      options.ids,
      {
        name: options.name || 'Merged Window',
        type: options.type || 'manual',
        fillGaps: true,
        preserveBoundaries: true
      }
    );
    
    console.log(chalk.green('Time windows merged successfully.'));
    
    // Display the merged window
    const windowInfo = await timeWindowManager.getTimeWindowInfo(mergedWindow.id);
    
    if (windowInfo) {
      displayTimeWindow(windowInfo);
    } else {
      console.log(`Window ID: ${chalk.cyan(mergedWindow.id)}`);
      console.log(`Name: ${mergedWindow.name || 'Unnamed'}`);
      console.log(`Type: ${mergedWindow.type || 'unknown'}`);
      console.log(`Period: ${formatDate(mergedWindow.startTime)} - ${formatDate(mergedWindow.endTime)}`);
    }
  } catch (error) {
    console.error(chalk.red('Error merging time windows:'), error);
  }
}

/**
 * Split a time window
 */
async function splitTimeWindow(
  sessionManager: TerminalSessionManager,
  timeWindowManager: TimeWindowManager,
  options: {
    id?: string;
    time?: string;
  }
): Promise<void> {
  // Get current session
  const session = sessionManager.getCurrentSession();
  
  if (!session) {
    console.error(chalk.red('No active terminal session.'));
    return;
  }
  
  // Validate required parameters
  if (!options.id || !options.time) {
    console.error(chalk.red('Window ID and split time are required for splitting.'));
    console.log('Example: --split --id window1 --time "2023-01-01T12:00"');
    return;
  }
  
  // Parse split time
  let splitTime: Date;
  
  try {
    splitTime = new Date(options.time);
  } catch (error) {
    console.error(chalk.red('Invalid date format. Use ISO format (e.g., "2023-01-01T12:00").'));
    return;
  }
  
  // Split the time window
  try {
    const [firstWindow, secondWindow] = await timeWindowManager.splitTimeWindow(
      options.id,
      splitTime
    );
    
    console.log(chalk.green('Time window split successfully.'));
    
    // Display the resulting windows
    console.log(chalk.bold('First Window:'));
    const firstInfo = await timeWindowManager.getTimeWindowInfo(firstWindow.id);
    
    if (firstInfo) {
      displayTimeWindow(firstInfo, undefined, true);
    } else {
      console.log(`Window ID: ${chalk.cyan(firstWindow.id)}`);
      console.log(`Name: ${firstWindow.name || 'Unnamed'}`);
      console.log(`Period: ${formatDate(firstWindow.startTime)} - ${formatDate(firstWindow.endTime)}`);
    }
    
    console.log(chalk.bold('\nSecond Window:'));
    const secondInfo = await timeWindowManager.getTimeWindowInfo(secondWindow.id);
    
    if (secondInfo) {
      displayTimeWindow(secondInfo, undefined, true);
    } else {
      console.log(`Window ID: ${chalk.cyan(secondWindow.id)}`);
      console.log(`Name: ${secondWindow.name || 'Unnamed'}`);
      console.log(`Period: ${formatDate(secondWindow.startTime)} - ${formatDate(secondWindow.endTime)}`);
    }
  } catch (error) {
    console.error(chalk.red('Error splitting time window:'), error);
  }
}

/**
 * Auto-detect time windows
 */
async function autoDetectTimeWindows(
  sessionManager: TerminalSessionManager,
  timeWindowManager: TimeWindowManager
): Promise<void> {
  // Get current session
  const session = sessionManager.getCurrentSession();
  
  if (!session) {
    console.error(chalk.red('No active terminal session.'));
    return;
  }
  
  // Auto-detect time windows
  try {
    console.log(chalk.bold('Auto-detecting time windows...'));
    
    const detectedWindows = await timeWindowManager.autoDetectTimeWindows(session.id);
    
    if (detectedWindows.length === 0) {
      console.log(chalk.yellow('No time windows could be auto-detected for this session.'));
      console.log('This may be due to insufficient activity data.');
      return;
    }
    
    console.log(chalk.green(`Successfully detected ${detectedWindows.length} time windows.`));
    
    // Display detected windows
    console.log(chalk.bold('\nDetected Time Windows:'));
    
    for (const window of detectedWindows) {
      console.log(`Window: ${chalk.cyan(window.id)}`);
      console.log(`  Name: ${window.name || 'Auto-detected'}`);
      console.log(`  Type: ${window.type || 'auto'}`);
      console.log(`  Period: ${formatDate(window.startTime)} - ${formatDate(window.endTime)}`);
      console.log('');
    }
  } catch (error) {
    console.error(chalk.red('Error auto-detecting time windows:'), error);
  }
}

/**
 * Show time window statistics
 */
async function showTimeWindowStats(
  sessionManager: TerminalSessionManager,
  timeWindowManager: TimeWindowManager,
  options: {
    type?: string;
  }
): Promise<void> {
  // Get current session
  const session = sessionManager.getCurrentSession();
  
  if (!session) {
    console.error(chalk.red('No active terminal session.'));
    return;
  }
  
  // Prepare criteria
  const criteria: any = {
    sessionId: session.id
  };
  
  if (options.type) {
    criteria.type = options.type;
  }
  
  // Calculate statistics
  try {
    const stats = await timeWindowManager.calculateTimeWindowStats(criteria);
    
    console.log(chalk.bold('Time Window Statistics'));
    console.log('─'.repeat(30));
    console.log(`Total Windows: ${stats.totalWindows}`);
    console.log(`Total Duration: ${formatDuration(stats.totalDuration)}`);
    console.log(`Average Duration: ${formatDuration(stats.averageDuration)}`);
    console.log(`Total Tasks: ${stats.totalTasks}`);
    console.log(`Total Files: ${stats.totalFiles}`);
    
    console.log(chalk.bold('\nWindow Types:'));
    for (const [type, count] of Object.entries(stats.typeDistribution)) {
      console.log(`  ${type}: ${count}`);
    }
    
    console.log(chalk.bold('\nDuration Distribution:'));
    console.log(`  Short (<30m): ${stats.durationDistribution.short}`);
    console.log(`  Medium (30m-2h): ${stats.durationDistribution.medium}`);
    console.log(`  Long (2h-4h): ${stats.durationDistribution.long}`);
    console.log(`  Very Long (>4h): ${stats.durationDistribution.veryLong}`);
  } catch (error) {
    console.error(chalk.red('Error calculating time window statistics:'), error);
  }
}

/**
 * Display time window information
 */
function displayTimeWindow(
  window: any,
  format?: string,
  compact?: boolean
): void {
  if (format === 'json') {
    console.log(JSON.stringify(window, null, 2));
    return;
  }
  
  // Compact format for lists
  if (compact) {
    console.log(`Window: ${chalk.cyan(window.id)} - ${window.name || 'Unnamed'}`);
    console.log(`  Type: ${window.type || 'unknown'} | Status: ${window.status || 'unknown'}`);
    console.log(`  Period: ${formatDate(window.startTime)} - ${formatDate(window.endTime)} (${formatDuration(window.duration)})`);
    console.log(`  Content: ${window.taskCount} tasks, ${window.fileCount} files`);
    return;
  }
  
  // Full format for individual windows
  console.log(chalk.bold('Time Window Details'));
  console.log('─'.repeat(30));
  console.log(`Window ID: ${chalk.cyan(window.id)}`);
  console.log(`Name: ${window.name || 'Unnamed'}`);
  console.log(`Type: ${window.type || 'unknown'}`);
  console.log(`Status: ${window.status || 'unknown'}`);
  console.log(`Start Time: ${formatDate(window.startTime)}`);
  console.log(`End Time: ${formatDate(window.endTime)}`);
  console.log(`Duration: ${formatDuration(window.duration)}`);
  console.log(`Task Count: ${window.taskCount}`);
  console.log(`File Count: ${window.fileCount}`);
  
  // Show tasks if available
  if (window.taskIds && window.taskIds.length > 0) {
    console.log(chalk.bold('\nTasks in this Window:'));
    for (const taskId of window.taskIds) {
      console.log(`  ${chalk.cyan(taskId)}`);
    }
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