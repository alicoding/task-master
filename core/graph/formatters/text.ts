/**
 * Text formatters for task graph visualization
 */

import { TaskWithChildren } from '../../types.js';
import { formatSimpleText } from './simple.js';
import { formatTreeText, formatHierarchyWithSymbols } from './tree.js';
import { formatDetailedText, formatCompactText } from './detailed.js';

/**
 * Format tasks for human-readable display
 */
export async function formatHierarchyText(
  tasks: TaskWithChildren[] = [],
  format: string = 'simple',
  options: any = {}
): Promise<string> {
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

    case 'original':
      // Backward compatibility with original format
      return formatHierarchyWithSymbols(
        tasks, 
        options.compact === true,
        options.showMetadata === true,
        options.useColor === true
      );
      
    default:
      // Default to simple format
      return formatSimpleText(tasks, 0, options);
  }
}

// Re-export formatters
export {
  formatSimpleText,
  formatTreeText,
  formatDetailedText,
  formatCompactText,
  formatHierarchyWithSymbols
};