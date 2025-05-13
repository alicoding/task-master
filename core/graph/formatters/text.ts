/**
 * Text formatters for task graph visualization
 */

import { Task, TaskWithChildren } from '../../types';
import { formatSimpleText } from './simple';
import { formatTreeText, formatHierarchyWithSymbols } from './tree';
import { formatDetailedText, formatCompactText } from './detailed';
import { formatEnhancedTree } from './enhanced-tree';
import { formatBoxedTask } from './boxed-task';
import { formatEnhancedTask } from './enhanced-boxed-task';
import { formatPolishedTask } from './polished-task';
import { formatTaskTable } from './table-list';
import { createUiConfig, parseCliOptions, UiConfig } from './ui-config';

/**
 * Format tasks for human-readable display
 */
export async function formatHierarchyText(
  tasks: TaskWithChildren[] = [],
  format: string = 'enhanced',
  options: any = {}
): Promise<string> {
  // Parse options and create UI config
  const uiConfig = createUiConfig(parseCliOptions(options));

  // Different text formats for different use cases
  switch (format) {
    case 'simple':
      // Basic text hierarchy with indentation (original format)
      return formatSimpleText(tasks, 0, options);

    case 'tree':
      // ASCII tree with lines and symbols
      return formatTreeText(tasks, options);

    case 'detailed':
      // Detailed text with status, tags, and metadata
      return formatDetailedText(tasks, options);

    case 'compact':
      // Compact view with minimal information
      return formatCompactText(tasks, options);

    case 'enhanced':
      // Enhanced tree with better visuals (new default)
      return formatEnhancedTree(tasks, {
        useColor: uiConfig.useColor,
        showMetadata: uiConfig.showMetadata,
        showTags: uiConfig.showTags
      });

    case 'original':
      // Backward compatibility with original format
      return formatHierarchyWithSymbols(
        tasks,
        options.compact === true,
        options.showMetadata === true,
        options.useColor === true
      );

    default:
      // Default to enhanced format
      return formatEnhancedTree(tasks, {
        useColor: uiConfig.useColor,
        showMetadata: uiConfig.showMetadata,
        showTags: uiConfig.showTags
      });
  }
}

/**
 * Format a single task with enhanced visual display
 */
export async function formatTaskView(
  task: Task,
  format: string = 'polished',
  options: any = {}
): Promise<string> {
  // Parse options and create UI config
  const uiConfig = createUiConfig(parseCliOptions(options));

  // Determine terminal width if available
  let terminalWidth = 80; // Default width
  try {
    terminalWidth = process.stdout.columns || 80;
  } catch (e) {
    // Fallback if we can't access terminal info
  }

  // Choose format based on request and compatibility
  switch (format) {
    case 'polished':
      // Professional polished view (new default)
      return formatPolishedTask(task, {
        useColor: uiConfig.useColor,
        useBoxes: uiConfig.useBoxes,
        showMetadata: uiConfig.showMetadata,
        fullContent: options.fullContent === true,
        width: terminalWidth - 4 // Leave a small margin
      });

    case 'enhanced':
      // Enhanced unified view (previous default)
      return formatEnhancedTask(task, {
        useColor: uiConfig.useColor,
        useBoxes: uiConfig.useBoxes,
        showMetadata: uiConfig.showMetadata,
        width: terminalWidth - 4 // Leave a small margin
      });

    case 'boxed':
      // Original boxed view with multiple sections
      return formatBoxedTask(task, {
        useColor: uiConfig.useColor,
        useBoxes: uiConfig.useBoxes,
        showMetadata: uiConfig.showMetadata
      });

    case 'simple':
      // Simple text output without fancy formatting
      return formatTaskSimple(task, uiConfig);

    default:
      // Default to polished view
      return formatPolishedTask(task, {
        useColor: uiConfig.useColor,
        useBoxes: uiConfig.useBoxes,
        showMetadata: uiConfig.showMetadata,
        fullContent: options.fullContent === true,
        width: terminalWidth - 4
      });
  }
}

/**
 * Format a list of tasks with table or list view
 */
export async function formatTaskList(
  tasks: Task[],
  format: string = 'table',
  options: any = {}
): Promise<string> {
  // Parse options and create UI config
  const uiConfig = createUiConfig(parseCliOptions(options));

  // Choose format based on request and compatibility
  switch (format) {
    case 'table':
      // Table format with aligned columns
      return await formatTaskTable(tasks, {
        useColor: uiConfig.useColor,
        useTable: uiConfig.useTables,
        showDescription: uiConfig.showDescription,
        compact: uiConfig.compactMode
      });

    case 'list':
      // Simple list format
      return formatTaskListSimple(tasks, uiConfig);

    default:
      // Default to table format
      return await formatTaskTable(tasks, {
        useColor: uiConfig.useColor,
        useTable: uiConfig.useTables,
        showDescription: uiConfig.showDescription,
        compact: uiConfig.compactMode
      });
  }
}

/**
 * Simple text formatter for single task (fallback)
 */
function formatTaskSimple(task: Task, config: UiConfig): string {
  let result = '';

  // Try to use chalk if available and enabled
  let chalk;
  if (config.useColor) {
    try {
      chalk = require('chalk');
    } catch (e) {
      // Silent fail
    }
  }

  // Format header
  if (chalk) {
    result += `\n${chalk.bold.blue(`Task ${task.id}:`)} ${chalk.bold.white(task.title)}\n\n`;
  } else {
    result += `\nTask ${task.id}: ${task.title}\n\n`;
  }

  // Show description and body if available
  if (task.description && config.showDescription) {
    result += `Description:\n${task.description}\n\n`;
  }

  if (task.body && config.showBody) {
    result += `Details:\n${task.body}\n\n`;
  }

  // Task information
  result += `Status: ${task.status}\n`;
  result += `Readiness: ${task.readiness}\n`;

  if (task.tags && task.tags.length > 0) {
    const tagsStr = chalk
      ? task.tags.map(tag => chalk.green(`#${tag}`)).join(' ')
      : task.tags.map(tag => `#${tag}`).join(' ');
    result += `Tags: ${tagsStr}\n`;
  } else {
    result += `Tags: none\n`;
  }

  if (task.parentId && config.showParentInfo) {
    result += `Parent: ${task.parentId}\n`;
  }

  // Show dates if requested
  if (config.showDates) {
    result += `\nCreated: ${new Date(task.createdAt).toLocaleString()}\n`;
    result += `Updated: ${new Date(task.updatedAt).toLocaleString()}\n`;
  }

  // Show metadata if available and requested
  if (task.metadata && Object.keys(task.metadata).length > 0 && config.showMetadata) {
    result += `\nMetadata:\n${JSON.stringify(task.metadata, null, 2)}\n`;
  }

  return result;
}

/**
 * Simple list formatter for tasks (fallback)
 */
function formatTaskListSimple(tasks: Task[], config: UiConfig): string {
  // Try to use chalk if available and enabled
  let chalk;
  if (config.useColor) {
    try {
      chalk = require('chalk');
    } catch (e) {
      // Silent fail
    }
  }

  let result = '\n';

  // Format header
  if (chalk) {
    result += `${chalk.bold.underline('ID')}  ${chalk.bold.underline('Title')}${' '.repeat(35)}${chalk.bold.underline('Status')}     ${chalk.bold.underline('Tags')}\n`;
    result += chalk.gray('─'.repeat(100)) + '\n';
  } else {
    result += `ID  Title${' '.repeat(35)}Status     Tags\n`;
    result += '─'.repeat(100) + '\n';
  }

  // Format each task
  for (const task of tasks) {
    // Format title with truncation
    const maxTitleLength = config.titleMaxLength;
    const title = task.title.length > maxTitleLength
      ? `${task.title.substring(0, maxTitleLength - 3)}...`
      : task.title.padEnd(maxTitleLength);

    // Format status with color
    let statusColor = 'white';
    if (task.status === 'in-progress') statusColor = 'yellow';
    if (task.status === 'done') statusColor = 'green';

    // Format tags
    const tags = task.tags && task.tags.length > 0
      ? (chalk
          ? task.tags.map(tag => chalk.green(`#${tag}`)).join(' ')
          : task.tags.map(tag => `#${tag}`).join(' '))
      : (chalk ? chalk.gray('none') : 'none');

    // Format final line
    if (chalk) {
      result += `${chalk.cyan(task.id.padEnd(4))} ${chalk[statusColor](title)} ${chalk[statusColor](task.status.padEnd(12))} ${tags}\n`;
    } else {
      result += `${task.id.padEnd(4)} ${title} ${task.status.padEnd(12)} ${tags}\n`;
    }
  }

  return result;
}

// Re-export formatters
export {
  formatSimpleText,
  formatTreeText,
  formatDetailedText,
  formatCompactText,
  formatHierarchyWithSymbols,
  formatEnhancedTree,
  formatBoxedTask,
  formatEnhancedTask,
  formatPolishedTask,
  formatTaskTable,
  createUiConfig,
  parseCliOptions
};