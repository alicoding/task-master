/**
 * Tree text formatter for task graph visualization
 */

import { TaskWithChildren } from '../../types';

/**
 * Get status symbol for visual display
 */
export function getStatusSymbol(status: string): string {
  switch (status) {
    case 'todo': return '□'; // Empty square
    case 'in-progress': return '▶'; // Triangle
    case 'done': return '✓'; // Checkmark
    default: return '?';
  }
}

/**
 * Get readiness symbol for visual display
 */
export function getReadinessSymbol(readiness: string): string {
  switch (readiness) {
    case 'draft': return '✎'; // Pencil
    case 'ready': return '▣'; // Full boxed square
    case 'blocked': return '⚠'; // Warning
    default: return '';
  }
}

/**
 * ASCII tree format with lines and symbols
 */
export function formatTreeText(tasks: TaskWithChildren[], options: any = {}): string {
  // Function to format a subtree with line graphics
  function formatSubtree(
    nodes: TaskWithChildren[], 
    prefix: string = '', 
    isLast: boolean = true
  ): string {
    if (nodes.length === 0) return '';
    
    let result = '';
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeIsLast = i === nodes.length - 1;
      
      // Get status and readiness symbols
      const statusSym = getStatusSymbol(node.status);
      const readinessSym = getReadinessSymbol(node.readiness);
      
      // Determine the connector and new prefix based on position in tree
      const connector = nodeIsLast ? '└── ' : '├── ';
      const newPrefix = prefix + (nodeIsLast ? '    ' : '│   ');
      
      // Format the current node
      result += `${prefix}${connector}${statusSym} ${node.id}. ${node.title} ${readinessSym}\n`;
      
      // Format children if any
      if (node.children && node.children.length > 0) {
        result += formatSubtree(node.children, newPrefix, false);
      }
    }
    
    return result;
  }
  
  // Apply color if requested
  const useColor = options.useColor === true;
  let result = formatSubtree(tasks);
  
  if (useColor) {
    try {
      // @ts-ignore
      const chalk = require('chalk');
      
      // Apply color to status and readiness symbols
      result = result
        .replace(/□/g, chalk.white('□'))
        .replace(/▶/g, chalk.yellow('▶'))
        .replace(/✓/g, chalk.green('✓'))
        .replace(/✎/g, chalk.blue('✎'))
        .replace(/▣/g, chalk.magenta('▣'))
        .replace(/⚠/g, chalk.red('⚠'));
    } catch (e) {
      // Fallback to plain text if chalk is not available
      console.log('Warning: chalk not available, using plain text output');
    }
  }
  
  return result;
}

/**
 * Original formatHierarchyWithSymbols function from CLI for backward compatibility
 */
export function formatHierarchyWithSymbols(
  tasks: TaskWithChildren[],
  compact: boolean = false,
  showMetadata: boolean = false,
  useColor: boolean = false,
  level: number = 0,
  prefix: string = ''
): string {
  let result = '';
  let chalk;
  
  // Try to load chalk if color is requested
  if (useColor) {
    try {
      // @ts-ignore
      chalk = require('chalk');
    } catch (e) {
      console.log('Warning: chalk not available, using plain text output');
    }
  }
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const isLast = i === tasks.length - 1;
    
    // Calculate the current line's prefix
    const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    
    // Format the task with status and readiness symbols
    const statusSym = getStatusSymbol(task.status);
    const readinessSym = getReadinessSymbol(task.readiness);
    
    // Format with or without color
    if (useColor && chalk) {
      // Apply color to different parts based on status/readiness
      const statusColored = task.status === 'done' ? chalk.green(statusSym) :
                          task.status === 'in-progress' ? chalk.yellow(statusSym) :
                          chalk.white(statusSym);
                          
      const readinessColored = task.readiness === 'blocked' ? chalk.red(readinessSym) :
                             task.readiness === 'draft' ? chalk.blue(readinessSym) : 
                             chalk.magenta(readinessSym);
      
      const titleColor = task.status === 'done' ? chalk.green :
                       task.status === 'in-progress' ? chalk.yellow :
                       chalk.white;
      
      // Basic line with colored symbols
      result += `${currentPrefix}${statusColored} ${chalk.cyan(task.id)}. ${titleColor(task.title)} ${readinessColored}\n`;
      
      // Add metadata if requested and not in compact mode
      if (showMetadata && !compact && Object.keys(task.metadata || {}).length > 0) {
        const metadataStr = JSON.stringify(task.metadata);
        result += `${childPrefix}   ${chalk.dim('metadata:')} ${chalk.gray(metadataStr)}\n`;
      }
      
      // Add tags if not empty and not in compact mode
      if (!compact && task.tags && task.tags.length > 0) {
        result += `${childPrefix}   ${chalk.dim('tags:')} ${task.tags.map(tag => chalk.cyan(tag)).join(', ')}\n`;
      }
    } else {
      // Basic line with plain symbols (no color)
      result += `${currentPrefix}${statusSym} ${task.id}. ${task.title} ${readinessSym}\n`;
      
      // Add metadata if requested and not in compact mode
      if (showMetadata && !compact && Object.keys(task.metadata || {}).length > 0) {
        const metadataStr = JSON.stringify(task.metadata);
        result += `${childPrefix}   metadata: ${metadataStr}\n`;
      }
      
      // Add tags if not empty and not in compact mode
      if (!compact && task.tags && task.tags.length > 0) {
        result += `${childPrefix}   tags: ${task.tags?.join(', ')}\n`;
      }
    }
    
    // Recursively format children
    if (task.children && task.children.length > 0) {
      result += formatHierarchyWithSymbols(
        task.children, compact, showMetadata, useColor, level + 1, childPrefix
      );
    }
  }
  
  return result;
}