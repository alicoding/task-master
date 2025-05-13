/**
 * Simple text formatter for task graph visualization
 */

import { TaskWithChildren } from '@/core/types';

/**
 * Original simple format with indentation
 */
export function formatSimpleText(tasks: TaskWithChildren[], level: number = 0, options: any = {}): string {
  let result = '';
  
  // Import chalk for colorized output if requested
  const useColor = options.useColor === true;
  let chalk;
  
  if (useColor) {
    try {
      // Dynamic import for chalk is not available in ESM
      // This is a workaround that allows the code to work with or without chalk
      // @ts-ignore
      chalk = require('chalk');
    } catch (e) {
      // Fallback to plain text if chalk is not available
      console.log('Warning: chalk not available, using plain text output');
    }
  }
  
  for (const task of tasks) {
    // Indent based on level
    const indent = '  '.repeat(level);
    
    // Format with or without color
    if (useColor && chalk) {
      // Get color based on status
      const idColor = chalk.cyan;
      const titleColor = task.status === 'done' ? chalk.green :
                       task.status === 'in-progress' ? chalk.yellow :
                       chalk.white;
      
      // Format with color
      result += `${indent}${idColor(task.id)}. ${titleColor(task.title)}\n`;
    } else {
      // Plain formatting without color
      result += `${indent}${task.id}. ${task.title}\n`;
    }
    
    // Recursively format children
    if (task.children && task.children.length > 0) {
      result += formatSimpleText(task.children, level + 1, options);
    }
  }
  
  return result;
}