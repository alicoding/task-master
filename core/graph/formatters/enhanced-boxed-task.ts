/**
 * Enhanced boxed task formatter with professional layout and visual elements
 */

import { Task } from '../../types';

// Dynamic imports for ESM compatibility
let chalk: any;
let boxen: any;
let Table: any;
let stringWidth: any;
let wrapAnsi: any;

// Function to initialize dependencies
function initDependencies() {
  return Promise.all([
    import('chalk').then(module => { chalk = module.default; }),
    import('boxen').then(module => { boxen = module.default; }),
    import('cli-table3').then(module => { Table = module.default; })
  ])
  .then(() => {
    // These might be unavailable in some environments
    return Promise.all([
      import('string-width')
        .then(module => { stringWidth = module.default; })
        .catch(() => {
          // Fallback implementation if the module isn't available
          stringWidth = (str: string) => str.replace(/\u001b\[\d+m/g, '').length;
        }),
      import('wrap-ansi')
        .then(module => { wrapAnsi = module.default; })
        .catch(() => {
          // Simple fallback for text wrapping
          wrapAnsi = (str: string, width: number) => {
            const words = str.split(' ');
            let result = '';
            let line = '';

            for (const word of words) {
              if (line.length + word.length > width) {
                result += line + '\n';
                line = word;
              } else {
                if (line) line += ' ';
                line += word;
              }
            }

            if (line) result += line;
            return result;
          };
        })
    ]);
  })
  .catch(e => {
    console.warn('Warning: Formatting libraries not available, using plain text output');

    // Fallback implementations
    stringWidth = (str: string) => str.replace(/\u001b\[\d+m/g, '').length;
    wrapAnsi = (str: string, width: number) => {
      const words = str.split(' ');
      let result = '';
      let line = '';

      for (const word of words) {
        if (line.length + word.length > width) {
          result += line + '\n';
          line = word;
        } else {
          if (line) line += ' ';
          line += word;
        }
      }

      if (line) result += line;
      return result;
    };
  });
}

// Start loading dependencies in the background
const dependenciesPromise = initDependencies();

// Icons and symbols for consistent visual language
const ICONS = {
  TASK: '📋',
  STATUS: '⚡',
  DESC: '📝',
  DETAILS: '📄',
  PROGRESS: '📊',
  TAGS: '🏷️',
  PARENT: '⬆️',
  TIME: '🕒',
  METADATA: '🔍',
  CHECK: '✓',
  PENDING: '▶',
  TODO: '□',
  WARNING: '⚠',
  DRAFT: '✎',
  READY: '▣',
};

// Status symbol and color maps
const STATUS_SYMBOLS = {
  'todo': ICONS.TODO,
  'in-progress': ICONS.PENDING,
  'done': ICONS.CHECK
};

const STATUS_LABELS = {
  'todo': 'TO DO',
  'in-progress': 'IN PROGRESS',
  'done': 'COMPLETED'
};

const READINESS_SYMBOLS = {
  'draft': ICONS.DRAFT,
  'ready': ICONS.READY,
  'blocked': ICONS.WARNING
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
  'blocked': 'red',
  'header': 'blue',
  'border': 'gray',
  'title': 'white',
  'subtitle': 'cyan',
  'section': 'yellow',
  'muted': 'gray',
  'tag': 'green',
  'progress-bar': 'green',
  'progress-empty': 'gray'
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
 * Create an integrated progress bar visualization
 */
function createProgressBar(task: Task, width: number = 25, colorize: boolean = true): string {
  // Determine progress based on status
  let progressPercent = 0;
  let statusLabel = '';
  let statusSymbol = '';
  let statusColor = 'white';
  
  switch (task.status) {
    case 'todo':
      progressPercent = 0;
      statusLabel = STATUS_LABELS.todo;
      statusSymbol = STATUS_SYMBOLS.todo;
      statusColor = COLORS.todo;
      break;
    case 'in-progress':
      progressPercent = 50;
      statusLabel = STATUS_LABELS['in-progress'];
      statusSymbol = STATUS_SYMBOLS['in-progress'];
      statusColor = COLORS['in-progress'];
      break;
    case 'done':
      progressPercent = 100;
      statusLabel = STATUS_LABELS.done;
      statusSymbol = STATUS_SYMBOLS.done;
      statusColor = COLORS.done;
      break;
  }
  
  // Calculate bar length based on percentage
  const barWidth = width - 7; // Account for percentage display
  const completedWidth = Math.floor(barWidth * (progressPercent / 100));
  const emptyWidth = barWidth - completedWidth;
  
  // Build the progress bar
  let progressBar = '';
  
  if (colorize && chalk) {
    const formattedSymbol = chalk[statusColor](statusSymbol);
    const formattedStatus = chalk[statusColor].bold(statusLabel);
    const formattedPercent = chalk.bold(`${progressPercent}%`);
    const completedSection = chalk[COLORS['progress-bar']]('█'.repeat(completedWidth));
    const emptySection = chalk[COLORS['progress-empty']]('░'.repeat(emptyWidth));
    
    progressBar = `${formattedSymbol} ${formattedStatus}\n`;
    progressBar += `[${completedSection}${emptySection}] ${formattedPercent}`;
  } else {
    progressBar = `${statusSymbol} ${statusLabel}\n`;
    progressBar += `[${'█'.repeat(completedWidth)}${'░'.repeat(emptyWidth)}] ${progressPercent}%`;
  }
  
  return progressBar;
}

/**
 * Format readiness with symbol, label and color
 */
function formatReadiness(readiness: string, colorize: boolean = true): string {
  const symbol = READINESS_SYMBOLS[readiness as keyof typeof READINESS_SYMBOLS] || '';
  const label = READINESS_LABELS[readiness as keyof typeof READINESS_LABELS] || readiness.toUpperCase();
  
  if (colorize && chalk) {
    const color = COLORS[readiness as keyof typeof COLORS] || 'white';
    return `${chalk[color](symbol)} ${chalk[color].bold(label)}`;
  }
  
  return `${symbol} ${label}`;
}

/**
 * Format tags as visual badges
 */
function formatTagBadges(tags: string[] | null | undefined, colorize: boolean = true): string {
  if (!tags || tags.length === 0) {
    return colorize && chalk ? chalk.dim('No tags') : 'No tags';
  }
  
  const badges = tags.map(tag => {
    // Create a badge-like format for each tag
    if (colorize && chalk) {
      return chalk.green.bgBlack(`  ${tag}  `);
    }
    return `[ ${tag} ]`;
  });
  
  // Join badges with spacing
  return badges.join('  ');
}

/**
 * Format metadata in a structured way
 */
function formatMetadata(metadata: Record<string, any> | null | undefined, colorize: boolean = true): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return colorize && chalk ? chalk.dim('No metadata') : 'No metadata';
  }
  
  if (Table) {
    // Create a nicely formatted table
    const table = new Table({
      chars: {
        'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
        'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
        'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
        'right': '│', 'right-mid': '┤', 'middle': '│'
      },
      style: {
        head: colorize && chalk ? ['cyan', 'bold'] : [],
        border: colorize && chalk ? [COLORS.border] : []
      }
    });
    
    // Add header row
    table.push([
      colorize && chalk ? chalk.cyan.bold('Key') : 'Key',
      colorize && chalk ? chalk.cyan.bold('Value') : 'Value'
    ]);
    
    // Add metadata entries
    for (const [key, value] of Object.entries(metadata)) {
      table.push([
        colorize && chalk ? chalk.cyan(key) : key,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      ]);
    }
    
    return table.toString();
  } else {
    // Fallback format if table isn't available
    let result = '';
    for (const [key, value] of Object.entries(metadata)) {
      const formattedKey = colorize && chalk ? chalk.cyan(key) : key;
      result += `${formattedKey}: ${JSON.stringify(value)}\n`;
    }
    return result;
  }
}

/**
 * Format and wrap text for terminal display with intelligent truncation
 */
function formatText(text: string, width: number, indent: number = 0, options: any = {}): string {
  if (!text) return '';

  // Configuration options
  const maxLines = options.maxLines || 0; // 0 = no limit
  const truncate = options.truncate !== false;
  const showMore = options.showMore !== false;

  // Add proper indentation to wrapped text
  const indentStr = ' '.repeat(indent);

  // Wrap the text first
  let wrappedText: string;

  // Use wrap-ansi if available, otherwise use simple wrapping
  if (wrapAnsi) {
    wrappedText = wrapAnsi(text, width - indent)
      .split('\n')
      .map(line => indentStr + line)
      .join('\n');
  } else {
    // Simple fallback wrapping
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 > width - indent) {
        lines.push(indentStr + currentLine);
        currentLine = word;
      } else {
        if (currentLine.length > 0) currentLine += ' ';
        currentLine += word;
      }
    }

    if (currentLine.length > 0) {
      lines.push(indentStr + currentLine);
    }

    wrappedText = lines.join('\n');
  }

  // Apply line limits and truncation if needed
  if (maxLines > 0 && truncate) {
    const lines = wrappedText.split('\n');

    if (lines.length > maxLines) {
      // Truncate the text and add an indicator
      const truncatedLines = lines.slice(0, maxLines);

      // Add "more lines" indicator
      if (showMore) {
        const moreText = chalk && options.useColor
          ? chalk.dim(`${indentStr}[...${lines.length - maxLines} more lines - use --full-content to show all]`)
          : `${indentStr}[...${lines.length - maxLines} more lines - use --full-content to show all]`;

        truncatedLines.push(moreText);
      }

      return truncatedLines.join('\n');
    }
  }

  return wrappedText;
}

/**
 * Create a section header with icon and title
 */
function createSectionHeader(
  title: string, 
  icon: string, 
  color: string = 'white', 
  useColor: boolean = true
): string {
  if (useColor && chalk) {
    return `${icon} ${chalk[color].bold(title.toUpperCase())}`;
  }
  return `${icon} ${title.toUpperCase()}`;
}

/**
 * Format a single task with a unified, professional layout
 */
export async function formatEnhancedTask(task: Task, options: any = {}): Promise<string> {
  // Make sure dependencies are loaded
  await dependenciesPromise;
  // Configuration options
  const useColor = options.useColor !== false; // Default to using color
  const useBoxes = options.useBoxes !== false && boxen; // Default to using boxes if available
  const terminalWidth = options.width || 80; // Default width, can be overridden
  const showMetadata = options.showMetadata !== false; // Default to showing metadata
  
  // Check for terminal width 
  const contentWidth = terminalWidth - 4; // Subtract padding/borders
  
  // Generate the content for a unified box
  let content = '';
  
  // 1. HEADER SECTION
  // -----------------
  const statusColor = COLORS[task.status as keyof typeof COLORS] || COLORS.title;
  
  if (useColor && chalk) {
    // Colorized header with task ID and title
    const taskId = chalk[COLORS.header].bold(`Task ${task.id}`);
    const title = chalk[statusColor].bold(task.title);
    content += `${ICONS.TASK} ${taskId}: ${title}\n\n`;
  } else {
    // Plain header
    content += `${ICONS.TASK} Task ${task.id}: ${task.title}\n\n`;
  }
  
  // 2. DESCRIPTION SECTION - Always visible
  // -----------------------------
  const descriptionHeader = createSectionHeader('Description', ICONS.DESC, COLORS.subtitle, useColor);
  content += `${descriptionHeader}\n`;

  if (task.description !== undefined && task.description !== null && task.description !== '') {
    // Format and display the actual description with proper wrapping and truncation
    // For descriptions, use a moderate max line limit since it should be brief
    content += `${formatText(task.description, contentWidth, 2, {
      maxLines: options.fullContent ? 0 : 5,  // Limit to 5 lines unless full content requested
      truncate: true,
      showMore: true,
      useColor: useColor
    })}\n`;
  } else {
    // Show placeholder text for empty description
    const placeholderText = useColor && chalk
      ? chalk.dim('  No description provided. Use "tm update --id ' + task.id + ' --description" to add one.')
      : '  No description provided. Use "tm update --id ' + task.id + ' --description" to add one.';
    content += `${placeholderText}\n`;
  }
  content += '\n';

  // 3. BODY/DETAILS SECTION - Always visible
  // -----------------------------
  const detailsHeader = createSectionHeader('Details', ICONS.DETAILS, COLORS.subtitle, useColor);
  content += `${detailsHeader}\n`;

  if (task.body !== undefined && task.body !== null && task.body !== '') {
    // Process and display the body content with intelligent truncation
    // For body content, we allow more lines since it's expected to be longer
    const textOptions = {
      maxLines: options.fullContent ? 0 : 15,  // Limit to 15 lines unless full content requested
      truncate: true,
      showMore: true,
      useColor: useColor
    };

    // Preserve line breaks and apply proper formatting to body content
    const lines = task.body.split('\n');

    // Format each line individually to preserve intended line breaks
    const formattedLines = lines.map(line => {
      // Skip formatting for blank lines
      if (line.trim() === '') return '  ';

      return formatText(line, contentWidth, 2, {
        // Don't truncate individual lines, we'll truncate the whole body
        maxLines: 0,
        truncate: false
      });
    });

    // Join the formatted lines and apply overall truncation
    let formattedBody = formattedLines.join('\n');

    // Apply truncation to the whole body if needed
    if (textOptions.maxLines > 0 && !options.fullContent) {
      const bodyLines = formattedBody.split('\n');
      if (bodyLines.length > textOptions.maxLines) {
        const truncatedLines = bodyLines.slice(0, textOptions.maxLines);

        // Add indicator for more content
        const moreText = useColor && chalk
          ? chalk.dim(`  [...${bodyLines.length - textOptions.maxLines} more lines - use --full-content to show all]`)
          : `  [...${bodyLines.length - textOptions.maxLines} more lines - use --full-content to show all]`;

        truncatedLines.push(moreText);
        formattedBody = truncatedLines.join('\n');
      }
    }

    content += `${formattedBody}\n`;
  } else {
    // Show placeholder text for empty body
    const placeholderText = useColor && chalk
      ? chalk.dim('  No additional details provided. Use "tm update --id ' + task.id + ' --body" to add details.')
      : '  No additional details provided. Use "tm update --id ' + task.id + ' --body" to add details.';
    content += `${placeholderText}\n`;
  }
  content += '\n';
  
  // 4. STATUS SECTION WITH INTEGRATED PROGRESS
  // -----------------------------------------
  const statusHeader = createSectionHeader('Status', ICONS.STATUS, COLORS.section, useColor);
  content += `${statusHeader}\n`;
  
  // Add the progress bar integrated with status
  content += `  ${createProgressBar(task, contentWidth - 4, useColor)}\n`;
  
  // Add readiness status with proper alignment
  if (useColor && chalk) {
    content += `  ${chalk[COLORS.section].bold('Readiness:')} ${formatReadiness(task.readiness, useColor)}\n\n`;
  } else {
    content += `  Readiness: ${formatReadiness(task.readiness, useColor)}\n\n`;
  }
  
  // 5. TAGS SECTION
  // --------------
  const tagsHeader = createSectionHeader('Tags', ICONS.TAGS, COLORS.section, useColor);
  content += `${tagsHeader}\n`;
  content += `  ${formatTagBadges(task.tags, useColor)}\n\n`;
  
  // 6. RELATIONSHIPS SECTION (if parent exists)
  // ------------------------------------------
  if (task.parentId) {
    const relationshipHeader = createSectionHeader('Relationships', ICONS.PARENT, COLORS.section, useColor);
    content += `${relationshipHeader}\n`;
    
    if (useColor && chalk) {
      content += `  ${chalk[COLORS.section].bold('Parent:')} ${chalk.cyan(task.parentId)}\n\n`;
    } else {
      content += `  Parent: ${task.parentId}\n\n`;
    }
  }
  
  // 7. TIMESTAMPS SECTION
  // -------------------
  const timeHeader = createSectionHeader('Timestamps', ICONS.TIME, COLORS.muted, useColor);
  content += `${timeHeader}\n`;
  
  if (useColor && chalk) {
    content += `  ${chalk[COLORS.muted].bold('Created:')} ${formatDate(task.createdAt)}\n`;
    content += `  ${chalk[COLORS.muted].bold('Updated:')} ${formatDate(task.updatedAt)}\n\n`;
  } else {
    content += `  Created: ${formatDate(task.createdAt)}\n`;
    content += `  Updated: ${formatDate(task.updatedAt)}\n\n`;
  }
  
  // 8. METADATA SECTION (if present and requested)
  // --------------------------------------------
  if (showMetadata && task.metadata && Object.keys(task.metadata).length > 0) {
    const metadataHeader = createSectionHeader('Metadata', ICONS.METADATA, COLORS.muted, useColor);
    content += `${metadataHeader}\n`;
    content += formatMetadata(task.metadata, useColor);
  }
  
  // Final output - wrap everything in a unified box or use simple formatting
  if (useBoxes) {
    // Create a single unified box for the entire task
    const boxedContent = boxen(content, {
      padding: { top: 1, bottom: 1, left: 2, right: 2 },
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: useColor ? COLORS.header : undefined,
      title: useColor && chalk ? chalk[COLORS.header].bold('TASK DETAILS') : 'TASK DETAILS',
      titleAlignment: 'center',
      width: terminalWidth,
      // Add a subtle background color if color is enabled
      backgroundColor: useColor && chalk ? '#000000' : undefined,
    });
    
    return boxedContent;
  } else {
    // Fallback to simple formatting if boxen isn't available
    const divider = useColor && chalk 
      ? chalk[COLORS.border]('─'.repeat(terminalWidth)) 
      : '─'.repeat(terminalWidth);
    
    return `\n${divider}\n${content}${divider}\n`;
  }
}