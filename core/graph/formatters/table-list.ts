/**
 * Table formatter for task list visualization
 */

import { Task } from '../../types';

// Dynamic imports for ESM compatibility
let chalk: any;
let Table: any;

// Function to initialize dependencies
function initDependencies() {
  return Promise.all([
    import('chalk').then(module => { chalk = module.default; }),
    import('cli-table3').then(module => { Table = module.default; })
  ])
  .catch(e => {
    console.warn('Warning: Formatting libraries not available, using plain text output');
  });
}

// Start loading dependencies in the background
const dependenciesPromise = initDependencies();

// Status symbols and indicators
const STATUS_SYMBOLS = {
  'todo': '□',
  'in-progress': '▶',
  'done': '✓'
};

const STATUS_COLORS = {
  'todo': 'white',
  'in-progress': 'yellow',
  'done': 'green'
};

const READINESS_SYMBOLS = {
  'draft': '✎',
  'ready': '▣',
  'blocked': '⚠'
};

const READINESS_COLORS = {
  'draft': 'blue',
  'ready': 'magenta',
  'blocked': 'red'
};

/**
 * Format date in a compact way
 */
function formatCompactDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  
  // Format options for compact date
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a list of tasks as a table
 */
export async function formatTaskTable(tasks: Task[], options: any = {}): Promise<string> {
  // Make sure dependencies are loaded
  await dependenciesPromise;
  const useColor = options.useColor !== false; // Default to using color
  const useTable = options.useTable !== false && Table; // Use table format if available
  const showDescription = options.showDescription !== false; // Show description column by default
  const compact = options.compact === true; // Option for more compact output
  
  // Return early if no tasks
  if (!tasks || tasks.length === 0) {
    return useColor && chalk 
      ? chalk.yellow('No tasks found') 
      : 'No tasks found';
  }
  
  if (useTable) {
    // Define columns based on options
    const columns = ['ID', 'Title', 'Status'];
    
    if (showDescription) {
      columns.push('Description');
    }
    
    columns.push('Tags', 'Updated');
    
    // Create table with formatting
    const table = new Table({
      head: columns.map(col => useColor && chalk ? chalk.bold.white(col) : col),
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      },
      style: {
        head: useColor && chalk ? ['white', 'bold'] : [],
        border: useColor && chalk ? ['gray'] : []
      },
      // Adjust column widths
      colWidths: [
        10, // ID
        compact ? 25 : 35, // Title
        15, // Status
        showDescription ? (compact ? 20 : 30) : 0, // Description (optional)
        15, // Tags
        15  // Updated
      ].filter(width => width > 0)
    });
    
    // Add task rows
    for (const task of tasks) {
      // Format status with symbol and color
      const statusSymbol = STATUS_SYMBOLS[task.status as keyof typeof STATUS_SYMBOLS] || '?';
      const statusStr = `${statusSymbol} ${task.status.toUpperCase()}`;
      const statusColored = useColor && chalk 
        ? chalk[STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || 'white'](statusStr)
        : statusStr;
      
      // Format readiness
      const readinessSymbol = READINESS_SYMBOLS[task.readiness as keyof typeof READINESS_SYMBOLS] || '';
      const readinessStr = readinessSymbol ? `${readinessSymbol} ${task.readiness}` : task.readiness;
      const readinessColored = useColor && chalk && readinessSymbol
        ? chalk[READINESS_COLORS[task.readiness as keyof typeof READINESS_COLORS] || 'white'](readinessStr)
        : readinessStr;
      
      // Format tags
      const tagsFormatted = task.tags && task.tags.length > 0
        ? task.tags.map(tag => {
            return useColor && chalk 
              ? chalk.green(`#${tag}`) 
              : `#${tag}`;
          }).join(' ')
        : '';
      
      // Format title and ID 
      const idFormatted = useColor && chalk ? chalk.cyan(task.id) : task.id;
      const titleFormatted = useColor && chalk 
        ? (task.status === 'done' 
            ? chalk.green(task.title) 
            : task.status === 'in-progress' 
              ? chalk.yellow(task.title) 
              : task.title)
        : task.title;
      
      // Format date
      const dateFormatted = formatCompactDate(task.updatedAt);
      
      // Build the row
      const row = [
        idFormatted,
        titleFormatted,
        `${statusColored}\n${readinessColored}`
      ];
      
      // Add description if enabled
      if (showDescription) {
        const description = task.description || '';
        
        // Truncate description if needed
        const maxLength = compact ? 20 : 30;
        let truncatedDesc = description.substring(0, maxLength);
        
        if (description.length > maxLength) {
          truncatedDesc += '...';
        }
        
        row.push(truncatedDesc);
      }
      
      // Add remaining columns
      row.push(tagsFormatted, dateFormatted);
      
      // Add the row to the table
      table.push(row);
    }
    
    return `\n${table.toString()}\n`;
  } else {
    // Fallback to simpler formatting if Table isn't available
    let result = '\n';
    
    // Add header
    if (useColor && chalk) {
      result += `${chalk.bold.underline('ID')}  ${chalk.bold.underline('Title')}${' '.repeat(30)}`;
      result += `${chalk.bold.underline('Status')}     ${chalk.bold.underline('Tags')}\n`;
      result += chalk.gray('─'.repeat(100)) + '\n';
    } else {
      result += 'ID    Title' + ' '.repeat(30) + 'Status     Tags\n';
      result += '─'.repeat(100) + '\n';
    }
    
    // Add each task row
    for (const task of tasks) {
      // Format title with truncation
      const maxTitleLength = 35;
      const title = task.title.length > maxTitleLength
        ? `${task.title.substring(0, maxTitleLength - 3)}...`
        : task.title.padEnd(maxTitleLength);
      
      // Format status with color
      let statusColor = 'white';
      if (task.status === 'in-progress') statusColor = 'yellow';
      if (task.status === 'done') statusColor = 'green';
      
      // Format tags
      const tags = task.tags && task.tags.length > 0
        ? task.tags.map(tag => useColor && chalk ? chalk.green(`#${tag}`) : `#${tag}`).join(' ')
        : (useColor && chalk ? chalk.gray('none') : 'none');
      
      // Format task line
      if (useColor && chalk) {
        result += `${chalk.cyan(task.id.padEnd(4))} ${chalk[statusColor](title)} `;
        result += `${chalk[statusColor](task.status.padEnd(12))} ${tags}\n`;
      } else {
        result += `${task.id.padEnd(4)} ${title} ${task.status.padEnd(12)} ${tags}\n`;
      }
    }
    
    return result;
  }
}