/**
 * Boxed task formatter with advanced visual elements
 */

import { Task } from '@/core/types';

// Dynamic imports for ESM compatibility
let chalk: any;
let boxen: any;
let Table: any;

// Function to initialize dependencies
function initDependencies() {
  return Promise.all([
    import('chalk').then(module => { chalk = module.default; }),
    import('boxen').then(module => { boxen = module.default; }),
    import('cli-table3').then(module => { Table = module.default; })
  ]).catch(e => {
    console.warn('Warning: Formatting libraries not available, using plain text output');
  });
}

// Start loading dependencies in the background
const dependenciesPromise = initDependencies();

// Status symbol and color maps
const STATUS_SYMBOLS = {
  'todo': '□',
  'in-progress': '▶',
  'done': '✓'
};

const STATUS_LABELS = {
  'todo': 'TO DO',
  'in-progress': 'IN PROGRESS',
  'done': 'COMPLETED'
};

const READINESS_SYMBOLS = {
  'draft': '✎',
  'ready': '▣',
  'blocked': '⚠'
};

const READINESS_LABELS = {
  'draft': 'DRAFT',
  'ready': 'READY',
  'blocked': 'BLOCKED'
};

const COLORS = {
  'todo': 'white',
  'in-progress': 'yellow',
  'done': 'green',
  'draft': 'blue',
  'ready': 'magenta',
  'blocked': 'red'
};

/**
 * Format date in a friendly way
 */
function formatDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  
  // Format options
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Create a progress bar visualization
 */
function createProgressBar(task: Task, colorize: boolean = true): string {
  // Determine progress based on status
  let progressPercent = 0;
  
  switch (task.status) {
    case 'todo':
      progressPercent = 0;
      break;
    case 'in-progress':
      progressPercent = 50;
      break;
    case 'done':
      progressPercent = 100;
      break;
  }
  
  // Create visual bar
  const barLength = 20;
  const completedLength = Math.floor(barLength * (progressPercent / 100));
  const remainingLength = barLength - completedLength;
  
  let bar: string;
  
  if (colorize && chalk) {
    const completedSection = chalk.green('█'.repeat(completedLength));
    const remainingSection = chalk.gray('░'.repeat(remainingLength));
    bar = `${completedSection}${remainingSection} ${progressPercent}%`;
  } else {
    const completedSection = '█'.repeat(completedLength);
    const remainingSection = '░'.repeat(remainingLength);
    bar = `${completedSection}${remainingSection} ${progressPercent}%`;
  }
  
  return bar;
}

/**
 * Format task status with symbol, label and color
 */
function formatStatus(status: string, colorize: boolean = true): string {
  // Handle null or undefined status
  if (status == null) status = 'todo';

  const symbol = STATUS_SYMBOLS[status as keyof typeof STATUS_SYMBOLS] || '?';
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || (status ? status.toUpperCase() : 'UNKNOWN');

  if (colorize && chalk) {
    const color = COLORS[status as keyof typeof COLORS] || 'white';
    return `${chalk[color](symbol)} ${chalk[color].bold(label)}`;
  }

  return `${symbol} ${label}`;
}

/**
 * Format task readiness with symbol, label and color
 */
function formatReadiness(readiness: string, colorize: boolean = true): string {
  // Handle null or undefined readiness
  if (readiness == null) readiness = 'draft';

  const symbol = READINESS_SYMBOLS[readiness as keyof typeof READINESS_SYMBOLS] || '';
  const label = READINESS_LABELS[readiness as keyof typeof READINESS_LABELS] || (readiness ? readiness.toUpperCase() : 'UNKNOWN');

  if (colorize && chalk) {
    const color = COLORS[readiness as keyof typeof COLORS] || 'white';
    return `${chalk[color](symbol)} ${chalk[color].bold(label)}`;
  }

  return `${symbol} ${label}`;
}

/**
 * Format tags with color and style
 */
function formatTags(tags: string[] | null | undefined, colorize: boolean = true): string {
  if (!tags || tags.length === 0) return 'none';
  
  const formattedTags = tags.map(tag => {
    if (colorize && chalk) {
      return chalk.green(`#${tag}`);
    }
    return `#${tag}`;
  });
  
  return formattedTags.join(' ');
}

/**
 * Format metadata as a table
 */
function formatMetadata(metadata: Record<string, any> | null | undefined, colorize: boolean = true): string {
  if (!metadata || Object.keys(metadata).length === 0) return 'none';
  
  if (Table) {
    // Create a formatted table for metadata
    const table = new Table({
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      },
      style: {
        head: colorize && chalk ? ['cyan', 'bold'] : [],
        border: colorize && chalk ? ['gray'] : []
      }
    });
    
    // Add header row
    table.push(['Key', 'Value']);
    
    // Add metadata entries
    for (const [key, value] of Object.entries(metadata)) {
      table.push([
        colorize && chalk ? chalk.cyan(key) : key,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ]);
    }
    
    return table.toString();
  } else {
    // Fallback to simple format if Table isn't available
    let result = '';
    for (const [key, value] of Object.entries(metadata)) {
      const formattedKey = colorize && chalk ? chalk.cyan(key) : key;
      result += `${formattedKey}: ${JSON.stringify(value)}\n`;
    }
    return result;
  }
}

/**
 * Format description and body text with proper wrapping and section separation
 */
function formatContent(
  description: string | null | undefined, 
  body: string | null | undefined, 
  colorize: boolean = true
): string {
  let content = '';
  
  if (description !== undefined && description !== null && description !== '') {
    const descriptionLabel = colorize && chalk ? chalk.cyan.bold('Description:') : 'Description:';
    content += `${descriptionLabel}\n${description}\n\n`;
  }
  
  if (body !== undefined && body !== null && body !== '') {
    const bodyLabel = colorize && chalk ? chalk.cyan.bold('Details:') : 'Details:';
    content += `${bodyLabel}\n${body}`;
  }
  
  return content.trim();
}

/**
 * Format a single task with enhanced boxed UI
 */
export async function formatBoxedTask(task: Task, options: any = {}): Promise<string> {
  // Make sure dependencies are loaded
  await dependenciesPromise;
  const useColor = options.useColor !== false; // Default to using color
  const useBoxes = options.useBoxes !== false && boxen; // Default to using boxes if available
  
  // Format the task header (ID and title)
  let header = '';
  if (useColor && chalk) {
    const statusColor = COLORS[task.status as keyof typeof COLORS] || 'white';
    header = `${chalk.bold.blue(`Task ${task.id}:`)} ${chalk[statusColor].bold(task.title)}`;
  } else {
    header = `Task ${task.id}: ${task.title}`;
  }
  
  // Format the main content sections
  const content = formatContent(task.description, task.body, useColor);
  
  // Format status section with visual indicators
  let statusInfo = '';
  if (useColor && chalk) {
    statusInfo += `${chalk.yellow.bold('Status:')} ${formatStatus(task.status, useColor)}\n`;
    statusInfo += `${chalk.yellow.bold('Readiness:')} ${formatReadiness(task.readiness, useColor)}\n`;
    statusInfo += `${chalk.yellow.bold('Progress:')} ${createProgressBar(task, useColor)}\n`;
    statusInfo += `${chalk.yellow.bold('Tags:')} ${formatTags(task.tags, useColor)}\n`;
    
    if (task.parentId) {
      statusInfo += `${chalk.yellow.bold('Parent:')} ${chalk.cyan(task.parentId)}\n`;
    }
  } else {
    statusInfo += `Status: ${formatStatus(task.status, useColor)}\n`;
    statusInfo += `Readiness: ${formatReadiness(task.readiness, useColor)}\n`;
    statusInfo += `Progress: ${createProgressBar(task, useColor)}\n`;
    statusInfo += `Tags: ${formatTags(task.tags, useColor)}\n`;
    
    if (task.parentId) {
      statusInfo += `Parent: ${task.parentId}\n`;
    }
  }
  
  // Format dates section
  let datesInfo = '';
  if (useColor && chalk) {
    datesInfo += `${chalk.gray.bold('Created:')} ${formatDate(task.createdAt)}\n`;
    datesInfo += `${chalk.gray.bold('Updated:')} ${formatDate(task.updatedAt)}`;
  } else {
    datesInfo += `Created: ${formatDate(task.createdAt)}\n`;
    datesInfo += `Updated: ${formatDate(task.updatedAt)}`;
  }
  
  // Format metadata if present
  let metadataSection = '';
  if (task.metadata && Object.keys(task.metadata).length > 0) {
    const metadataLabel = useColor && chalk ? chalk.gray.bold('Metadata:') : 'Metadata:';
    metadataSection = `${metadataLabel}\n${formatMetadata(task.metadata, useColor)}`;
  }
  
  // Combine all sections into the final output
  let result = '';
  
  if (useBoxes) {
    // Header box
    const headerBox = boxen(header, {
      padding: 1,
      margin: { top: 1, bottom: 0 },
      borderStyle: 'round',
      borderColor: useColor ? 'blue' : undefined,
      title: useColor && chalk ? chalk.blue.bold('TASK DETAILS') : 'TASK DETAILS',
      titleAlignment: 'center'
    });
    
    // Content box (if content exists)
    let contentBox = '';
    if (content) {
      contentBox = boxen(content, {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: 'single',
        borderColor: useColor ? 'cyan' : undefined
      });
    }
    
    // Status box
    const statusBox = boxen(statusInfo, {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'single',
      borderColor: useColor ? 'yellow' : undefined,
      title: useColor && chalk ? chalk.yellow.bold('STATUS') : 'STATUS',
      titleAlignment: 'center'
    });
    
    // Dates box
    const datesBox = boxen(datesInfo, {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderStyle: 'single',
      borderColor: useColor ? 'gray' : undefined,
      title: useColor && chalk ? chalk.gray.bold('TIMESTAMPS') : 'TIMESTAMPS',
      titleAlignment: 'center'
    });
    
    // Metadata box (if metadata exists)
    let metadataBox = '';
    if (metadataSection) {
      metadataBox = boxen(metadataSection, {
        padding: 1,
        margin: { top: 0, bottom: 0 },
        borderStyle: 'single',
        borderColor: useColor ? 'gray' : undefined,
        title: useColor && chalk ? chalk.gray.bold('METADATA') : 'METADATA',
        titleAlignment: 'center'
      });
    }
    
    // Combine all boxes
    result = headerBox + '\n' + (content ? contentBox + '\n' : '') + statusBox + '\n' + datesBox + (metadataSection ? '\n' + metadataBox : '');
  } else {
    // Fallback to normal sections with dividers if boxen isn't available
    const divider = useColor && chalk ? chalk.gray('─'.repeat(80)) : '─'.repeat(80);
    
    result = `\n${header}\n${divider}\n\n`;
    
    if (content) {
      result += `${content}\n\n${divider}\n\n`;
    }
    
    result += `${statusInfo}\n${divider}\n\n`;
    result += `${datesInfo}\n${divider}\n\n`;
    
    if (metadataSection) {
      result += `${metadataSection}\n`;
    }
  }
  
  return result;
}