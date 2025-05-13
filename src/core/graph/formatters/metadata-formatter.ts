/**
 * Metadata formatter for displaying structured metadata
 * with improved handling of nested objects and arrays
 */

import chalk from 'chalk';
import Table from 'cli-table3';

// Import typography and colors from a common file
// or define them here if they're not available
const TYPOGRAPHY = {
  BOX: {
    HORIZONTAL: '─',
    T_DOWN: '┬',
    TOP_LEFT: '╭',
    TOP_RIGHT: '╮',
    BOTTOM: '─',
    BOTTOM_MID: '┴',
    BOTTOM_LEFT: '╰',
    BOTTOM_RIGHT: '╯',
    VERTICAL: '│',
    T_RIGHT: '├',
    MID: '─',
    CROSS: '┼',
    RIGHT: '│',
    T_LEFT: '┤',
    MIDDLE: '│'
  }
};

const COLORS = {
  TEXT: {
    PLACEHOLDER: '#495057',
    HEADER: '#4dabf7',
  }
};

/**
 * Format metadata as a beautiful table with improved object handling
 * @param metadata Metadata object to format
 * @param useColor Whether to use colors in the output
 * @returns Formatted metadata string
 */
export function formatMetadata(
  metadata: Record<string, any> | null | undefined,
  useColor: boolean = true
): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    if (useColor && chalk) {
      return chalk.hex(COLORS.TEXT.PLACEHOLDER).italic('No metadata');
    }
    return 'No metadata';
  }
  
  /**
   * Helper to format a value for display
   * Handles nested objects and arrays with proper formatting
   */
  function formatValue(value: any, indent: number = 0): string {
    if (value === null || value === undefined) {
      return useColor && chalk ? chalk.gray(('null' as string)) : 'null';
    }
    
    if (typeof value === 'string') {
      // Escape quotes and display as a string
      const escapedStr = value.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      return useColor && chalk ? chalk.green(`"${escapedStr}"`) : `"${escapedStr}"`;
    }
    
    if (typeof value === 'number') {
      return useColor && chalk ? chalk.yellow(String(value)) : String(value);
    }
    
    if (typeof value === 'boolean') {
      return useColor && chalk ? chalk.yellow(String(value)) : String(value);
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }
      
      // Format simple arrays on one line if they're short and have primitive values
      const isSimpleArray = value.length <= 5 && value.every(item => 
        item === null || 
        item === undefined || 
        typeof item !== 'object' || 
        (Array.isArray(item) && item.length === 0)
      );
      
      if (isSimpleArray) {
        const items = value.map(item => formatValue(item)).join(', ');
        return `[${items}]`;
      }
      
      // Format complex arrays with items on separate lines
      const itemIndent = ' '.repeat(indent + 2);
      const items = value.map(item => `${itemIndent}${formatValue(item, indent + 2)}`).join(',\n');
      return `[\n${items}\n${' '.repeat(indent)}]`;
    }
    
    if (typeof value === 'object') {
      const objectIndent = ' '.repeat(indent + 2);
      const closingIndent = ' '.repeat(indent);
      
      // Handle empty objects
      if (Object.keys(value).length === 0) {
        return '{}';
      }
      
      // Format each property on a new line
      const properties = Object.entries(value).map(([key, val]) => {
        const formattedKey = useColor && chalk ? chalk.hex('#74c0fc')(`"${key}"`) : `"${key}"`;
        return `${objectIndent}${formattedKey}: ${formatValue(val, indent + 2)}`;
      }).join(',\n');
      
      return `{\n${properties}\n${closingIndent}}`;
    }
    
    // Fallback for any other type
    return String(value);
  }
  
  try {
    // Try to use cli-table3 if available for a beautiful table
    if (Table) {
      // Create a beautiful table
      const table = new Table({
        chars: {
          'top': TYPOGRAPHY.BOX.HORIZONTAL,
          'top-mid': TYPOGRAPHY.BOX.T_DOWN,
          'top-left': TYPOGRAPHY.BOX.TOP_LEFT,
          'top-right': TYPOGRAPHY.BOX.TOP_RIGHT,
          'bottom': TYPOGRAPHY.BOX.HORIZONTAL,
          'bottom-mid': TYPOGRAPHY.BOX.BOTTOM_MID,
          'bottom-left': TYPOGRAPHY.BOX.BOTTOM_LEFT,
          'bottom-right': TYPOGRAPHY.BOX.BOTTOM_RIGHT,
          'left': TYPOGRAPHY.BOX.VERTICAL,
          'left-mid': TYPOGRAPHY.BOX.T_RIGHT,
          'mid': TYPOGRAPHY.BOX.MID,
          'mid-mid': TYPOGRAPHY.BOX.CROSS,
          'right': TYPOGRAPHY.BOX.RIGHT,
          'right-mid': TYPOGRAPHY.BOX.T_LEFT,
          'middle': TYPOGRAPHY.BOX.MIDDLE
        },
        style: {
          head: useColor && chalk ? ['cyan', 'bold'] : [],
          border: useColor && chalk ? ['gray'] : []
        },
        wordWrap: true
      });
      
      // Add header row
      table.push([
        useColor && chalk ? chalk.hex(COLORS.TEXT.HEADER).bold('Key') : 'Key',
        useColor && chalk ? chalk.hex(COLORS.TEXT.HEADER).bold('Value') : 'Value'
      ]);
      
      // Add metadata entries
      for (const [key, value] of Object.entries(metadata)) {
        const formattedKey = useColor && chalk ? chalk.hex('#74c0fc')(key) : key;
        const formattedValue = formatValue(value);
        
        table.push([
          formattedKey,
          formattedValue
        ]);
      }
      
      return table.toString();
    }
  } catch (error) {
    console.warn('Error creating table for metadata:', error);
  }
  
  // Fallback formatting without table
  let result = '';
  for (const [key, value] of Object.entries(metadata)) {
    const formattedKey = useColor && chalk ? chalk.hex('#74c0fc')(key) : key;
    const formattedValue = formatValue(value);
    result += `${formattedKey}: ${formattedValue}\n`;
  }
  
  return result.trim();
}