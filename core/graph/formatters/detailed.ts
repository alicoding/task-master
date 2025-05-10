/**
 * Detailed text formatter for task graph visualization
 */

import { TaskWithChildren } from '../../types.js';
import { getStatusSymbol, getReadinessSymbol } from './tree.js';

/**
 * Detailed text format with full information
 */
export function formatDetailedText(tasks: TaskWithChildren[], options: any = {}): string {
  const showMetadata = options.showMetadata !== false;
  const useColor = options.useColor === true;
  let chalk;
  
  if (useColor) {
    try {
      // @ts-ignore
      chalk = require('chalk');
    } catch (e) {
      // Fallback to plain text if chalk is not available
      console.log('Warning: chalk not available, using plain text output');
    }
  }
  
  // Function to format a task and its details
  function formatTaskDetails(
    node: TaskWithChildren, 
    prefix: string = '', 
    isLast: boolean = true
  ): string {
    // Get status and readiness symbols/text
    const statusMap: Record<string, string> = {
      'todo': 'To Do', 
      'in-progress': 'In Progress', 
      'done': 'Completed'
    };
    
    const readinessMap: Record<string, string> = {
      'draft': 'Draft', 
      'ready': 'Ready', 
      'blocked': 'Blocked'
    };
    
    const status = statusMap[node.status] || node.status;
    const readiness = readinessMap[node.readiness] || node.readiness;
    
    // Determine the connector and new prefix based on position in tree
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = prefix + (isLast ? '    ' : '│   ');
    
    // Format with or without color
    let result = '';
    
    if (useColor && chalk) {
      const titleColor = node.status === 'done' ? chalk.green :
                        node.status === 'in-progress' ? chalk.yellow :
                        chalk.white;
      
      // Format with color
      result += `${prefix}${connector}${chalk.cyan(node.id)}. ${titleColor(node.title)}\n`;
      result += `${childPrefix}${chalk.dim('Status:')} ${chalk.bold(status)}, ${chalk.dim('Readiness:')} ${chalk.bold(readiness)}\n`;
    } else {
      // Format without color
      result += `${prefix}${connector}${node.id}. ${node.title}\n`;
      result += `${childPrefix}Status: ${status}, Readiness: ${readiness}\n`;
    }
    
    // Add tags if present
    if (node.tags && node.tags.length > 0) {
      if (useColor && chalk) {
        result += `${childPrefix}${chalk.dim('Tags:')} ${node.tags.map(tag => chalk.cyan(tag)).join(', ')}\n`;
      } else {
        result += `${childPrefix}Tags: ${node.tags.join(', ')}\n`;
      }
    }
    
    // Add metadata if requested and present
    if (showMetadata && node.metadata && Object.keys(node.metadata).length > 0) {
      if (useColor && chalk) {
        result += `${childPrefix}${chalk.dim('Metadata:')}\n`;
        
        for (const [key, value] of Object.entries(node.metadata)) {
          result += `${childPrefix}  ${chalk.cyan(key)}: ${JSON.stringify(value)}\n`;
        }
      } else {
        result += `${childPrefix}Metadata:\n`;
        
        for (const [key, value] of Object.entries(node.metadata)) {
          result += `${childPrefix}  ${key}: ${JSON.stringify(value)}\n`;
        }
      }
    }
    
    // Add blank line after task details
    result += '\n';
    
    return result;
  }
  
  // Function to format the entire tree with detailed info
  function formatTreeDetailed(
    nodes: TaskWithChildren[], 
    prefix: string = ''
  ): string {
    if (nodes.length === 0) return '';
    
    let result = '';
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const isLast = i === nodes.length - 1;
      
      // Format current node with details
      result += formatTaskDetails(node, prefix, isLast);
      
      // Determine new prefix for children
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      
      // Format children if any
      if (node.children && node.children.length > 0) {
        result += formatTreeDetailed(node.children, newPrefix);
      }
    }
    
    return result;
  }
  
  let result = '';
  
  if (useColor && chalk) {
    result = `${chalk.bold('Task Hierarchy:')}\n\n`;
  } else {
    result = 'Task Hierarchy:\n\n';
  }
  
  result += formatTreeDetailed(tasks);
  return result;
}

/**
 * Compact text format showing just essentials
 */
export function formatCompactText(tasks: TaskWithChildren[], options: any = {}): string {
  const useColor = options.useColor === true;
  let chalk;
  
  if (useColor) {
    try {
      // @ts-ignore
      chalk = require('chalk');
    } catch (e) {
      // Fallback to plain text if chalk is not available
      console.log('Warning: chalk not available, using plain text output');
    }
  }
  
  // Function to format with minimal indentation
  function formatCompact(nodes: TaskWithChildren[], level: number = 0): string {
    if (nodes.length === 0) return '';
    
    let result = '';
    
    for (const node of nodes) {
      // Get status symbol
      const statusSym = node.status === 'todo' ? '□' : 
                       node.status === 'in-progress' ? '▶' : 
                       node.status === 'done' ? '✓' : '?';
      
      // Create minimal formatted line
      const indent = ' '.repeat(level * 2);
      
      if (useColor && chalk) {
        // Format with color
        const statusColor = node.status === 'done' ? chalk.green :
                          node.status === 'in-progress' ? chalk.yellow :
                          chalk.white;
        
        // Apply colors to different parts
        result += `${indent}${statusColor(statusSym)} ${chalk.cyan(node.id)} ${node.status === 'done' ? 
          chalk.gray(node.title) : chalk.white(node.title)}\n`;
      } else {
        // Plain formatting without color
        result += `${indent}${statusSym} ${node.id} ${node.title}\n`;
      }
      
      // Format children
      if (node.children && node.children.length > 0) {
        result += formatCompact(node.children, level + 1);
      }
    }
    
    return result;
  }
  
  return formatCompact(tasks);
}