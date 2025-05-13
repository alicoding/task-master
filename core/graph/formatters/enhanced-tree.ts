/**
 * Enhanced tree formatter with advanced visual elements and relationship display
 */

import { TaskWithChildren, DependencyType } from '../../types';

// Import chalk dynamically but without top-level await
let chalk: any;

// Function to initialize chalk
function initChalk() {
  return import('chalk')
    .then(module => {
      chalk = module.default;
    })
    .catch(e => {
      console.warn('Warning: chalk not available, using plain text output');
    });
}

// Start loading chalk in the background
const chalkPromise = initChalk();

// Box drawing characters for enhanced tree
const BOX_CHARS = {
  // Horizontal and vertical lines
  H_LINE: '─',
  V_LINE: '│',
  // Connectors
  BRANCH: '├',
  CORNER: '└',
  // Task status symbols
  TODO: '□',
  IN_PROGRESS: '▶',
  DONE: '✓',
  UNKNOWN: '?',
  // Task readiness symbols
  DRAFT: '✎',
  READY: '▣',
  BLOCKED: '⚠',
  // Dependency relationship symbols
  CHILD: '↳',
  AFTER: '→',
  SIBLING: '↔',
  // Decorative characters
  BULLET: '•',
  TAG_START: '[',
  TAG_END: ']',
};

// Status and readiness colors
const COLORS = {
  TODO: 'white',
  IN_PROGRESS: 'yellow',
  DONE: 'green',
  DRAFT: 'blue',
  READY: 'magenta',
  BLOCKED: 'red',
  ID: 'cyan',
  TITLE: 'white',
  TAG: 'green',
  LINE: 'gray',
  METADATA: 'gray',
  DATE: 'gray',
  LABEL: 'gray',
  DEPENDENCY: 'blue',
  CHILD: 'green',
  AFTER: 'yellow',
  SIBLING: 'magenta',
};

/**
 * Get colored status symbol
 */
function getStatusSymbol(status: string, colorized: boolean = true): string {
  let symbol;
  let color;
  
  switch (status) {
    case 'todo':
      symbol = BOX_CHARS.TODO;
      color = COLORS.TODO;
      break;
    case 'in-progress':
      symbol = BOX_CHARS.IN_PROGRESS;
      color = COLORS.IN_PROGRESS;
      break;
    case 'done':
      symbol = BOX_CHARS.DONE;
      color = COLORS.DONE;
      break;
    default:
      symbol = BOX_CHARS.UNKNOWN;
      color = COLORS.TODO;
  }
  
  return colorized && chalk ? chalk[color](symbol) : symbol;
}

/**
 * Get colored readiness symbol
 */
function getReadinessSymbol(readiness: string, colorized: boolean = true): string {
  let symbol;
  let color;
  
  switch (readiness) {
    case 'draft':
      symbol = BOX_CHARS.DRAFT;
      color = COLORS.DRAFT;
      break;
    case 'ready':
      symbol = BOX_CHARS.READY;
      color = COLORS.READY;
      break;
    case 'blocked':
      symbol = BOX_CHARS.BLOCKED;
      color = COLORS.BLOCKED;
      break;
    default:
      symbol = '';
      color = COLORS.TODO;
  }
  
  return symbol ? (colorized && chalk ? chalk[color](symbol) : symbol) : '';
}

/**
 * Format tags with colors and brackets
 */
function formatTags(tags: string[], colorized: boolean = true): string {
  if (!tags || tags.length === 0) return '';
  
  const formattedTags = tags.map(tag => {
    const formattedTag = `${BOX_CHARS.TAG_START}${tag}${BOX_CHARS.TAG_END}`;
    return colorized && chalk ? chalk[COLORS.TAG](formattedTag) : formattedTag;
  });
  
  return formattedTags.join(' ');
}

/**
 * Format dependency relationship symbol
 */
function formatDependencySymbol(type: DependencyType, colorized: boolean = true): string {
  let symbol;
  let color;

  switch (type) {
    case 'child':
      symbol = BOX_CHARS.CHILD;
      color = COLORS.CHILD;
      break;
    case 'after':
      symbol = BOX_CHARS.AFTER;
      color = COLORS.AFTER;
      break;
    case 'sibling':
      symbol = BOX_CHARS.SIBLING;
      color = COLORS.SIBLING;
      break;
    default:
      symbol = '?';
      color = COLORS.DEPENDENCY;
  }

  return colorized && chalk ? chalk[color](symbol) : symbol;
}

/**
 * Format related dependency tasks
 */
function formatDependencies(
  dependencies: { id: string; title: string; type: DependencyType }[],
  colorized: boolean = true
): string {
  if (!dependencies || dependencies.length === 0) return '';

  const dependencyLabels = dependencies.map(dep => {
    const symbol = formatDependencySymbol(dep.type, colorized);
    const depId = colorized && chalk ? chalk[COLORS.ID](dep.id) : dep.id;
    const depTitle = colorized && chalk ? chalk.dim(dep.title) : dep.title;
    return `${symbol} ${depId} (${depTitle})`;
  });

  return dependencyLabels.join(', ');
}

/**
 * Generate enhanced tree visualization
 */
export async function formatEnhancedTree(
  tasks: TaskWithChildren[],
  options: any = {},
  dependencyMap: Record<string, { id: string; title: string; type: DependencyType }[]> = {}
): Promise<string> {
  // Make sure chalk is initialized
  await chalkPromise;
  const showMetadata = options.showMetadata !== false;
  const useColor = options.useColor !== false; // Default to color
  const showTags = options.showTags !== false; // Default to showing tags
  const showDependencies = options.showDependencies !== false; // Default to showing dependencies

  // Function to format subtree with enhanced visuals
  function formatSubtree(
    nodes: TaskWithChildren[],
    prefix: string = '',
    isLast: boolean = true,
    level: number = 0,
    relationshipType: DependencyType = 'child'
  ): string {
    if (nodes.length === 0) return '';

    let result = '';

    // Calculate appropriate indentation based on level
    // This creates more visual space for deeper nesting levels
    const levelIndent = ' '.repeat(Math.max(0, level - 1));

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeIsLast = i === nodes.length - 1;

      // Get task status and readiness indicators
      const statusSymbol = getStatusSymbol(node.status, useColor);
      const readinessSymbol = getReadinessSymbol(node.readiness, useColor);

      // Add relationship indicator for non-root nodes
      const relationshipSymbol = level > 0 ? formatDependencySymbol(relationshipType, useColor) : '';

      // Determine connector based on position in tree
      const connector = nodeIsLast
        ? `${BOX_CHARS.CORNER}${BOX_CHARS.H_LINE}${BOX_CHARS.H_LINE} `
        : `${BOX_CHARS.BRANCH}${BOX_CHARS.H_LINE}${BOX_CHARS.H_LINE} `;

      // Color the connector line if colors are enabled
      const coloredConnector = useColor && chalk
        ? chalk[COLORS.LINE](connector)
        : connector;

      // Calculate the prefix for child nodes
      const newPrefix = prefix + (nodeIsLast
        ? '    '
        : `${BOX_CHARS.V_LINE}   `);

      // Color the vertical line if colors are enabled
      const coloredNewPrefix = useColor && chalk
        ? newPrefix.replace(BOX_CHARS.V_LINE, chalk[COLORS.LINE](BOX_CHARS.V_LINE))
        : newPrefix;

      // Format the task ID
      const taskId = useColor && chalk
        ? chalk[COLORS.ID](node.id)
        : node.id;

      // Format the task title based on status
      const titleColor = node.status === 'done'
        ? COLORS.DONE
        : node.status === 'in-progress'
          ? COLORS.IN_PROGRESS
          : COLORS.TITLE;

      const taskTitle = useColor && chalk
        ? chalk[titleColor](node.title)
        : node.title;

      // Format tags if present and requested
      const tagStr = showTags && node.tags && node.tags.length > 0
        ? ` ${formatTags(node.tags, useColor)}`
        : '';

      // Create the basic task line
      result += `${prefix}${coloredConnector}${statusSymbol} ${relationshipSymbol} ${taskId}. ${taskTitle} ${readinessSymbol}${tagStr}\n`;

      // Add metadata if requested and present
      if (showMetadata && node.metadata && Object.keys(node.metadata).length > 0) {
        const metadataPrefix = `${coloredNewPrefix}    `;
        const metadataLabel = useColor && chalk
          ? chalk[COLORS.LABEL]('metadata:')
          : 'metadata:';

        // Format each metadata entry on its own line
        result += `${coloredNewPrefix}    ${metadataLabel}\n`;

        for (const [key, value] of Object.entries(node.metadata)) {
          const formattedKey = useColor && chalk ? chalk.cyan(key) : key;
          const formattedValue = JSON.stringify(value);
          result += `${metadataPrefix}${formattedKey}: ${formattedValue}\n`;
        }
      }

      // Add description if present (preview only)
      if (node.description) {
        const descriptionPrefix = `${coloredNewPrefix}    `;
        const descriptionLabel = useColor && chalk
          ? chalk[COLORS.LABEL]('desc:')
          : 'desc:';

        // Truncate description for preview
        const maxDescriptionLength = 50;
        let descriptionText = node.description.toString().replace(/\n/g, ' ');

        if (descriptionText.length > maxDescriptionLength) {
          descriptionText = descriptionText.substring(0, maxDescriptionLength) + '...';
        }

        result += `${descriptionPrefix}${descriptionLabel} ${descriptionText}\n`;
      }

      // Add dependency information if available and requested
      if (showDependencies && dependencyMap[node.id] && dependencyMap[node.id].length > 0) {
        const dependencyPrefix = `${coloredNewPrefix}    `;
        const dependencyLabel = useColor && chalk
          ? chalk[COLORS.LABEL]('deps:')
          : 'deps:';

        const depsStr = formatDependencies(dependencyMap[node.id], useColor);
        result += `${dependencyPrefix}${dependencyLabel} ${depsStr}\n`;
      }

      // Format child nodes
      if (node.children && node.children.length > 0) {
        result += formatSubtree(node.children, coloredNewPrefix, false, level + 1, 'child');
      }
    }

    return result;
  }
  
  // Generate tree with a title banner
  let result = '';

  if (useColor && chalk) {
    result = `${chalk.bold.blue('Task Hierarchy')} ${chalk.gray(`(${tasks.length} root tasks)`)}\n`;
    result += chalk.gray('─'.repeat(80)) + '\n\n';

    // Add a legend for relationship symbols
    result += chalk.bold('Relationship Types:') + '\n';
    result += `  ${chalk[COLORS.CHILD](BOX_CHARS.CHILD)} Child task (parent-child relationship)\n`;
    result += `  ${chalk[COLORS.AFTER](BOX_CHARS.AFTER)} Sequential task (depends on previous task)\n`;
    result += `  ${chalk[COLORS.SIBLING](BOX_CHARS.SIBLING)} Sibling task (related task at same level)\n\n`;
  } else {
    result = `Task Hierarchy (${tasks.length} root tasks)\n`;
    result += '─'.repeat(80) + '\n\n';

    // Add a plain text legend for relationship symbols
    result += 'Relationship Types:\n';
    result += `  ${BOX_CHARS.CHILD} Child task (parent-child relationship)\n`;
    result += `  ${BOX_CHARS.AFTER} Sequential task (depends on previous task)\n`;
    result += `  ${BOX_CHARS.SIBLING} Sibling task (related task at same level)\n\n`;
  }

  result += formatSubtree(tasks);
  return result;
}