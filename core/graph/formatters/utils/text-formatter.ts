/**
 * Text formatter utilities for task display
 * Provides functionality for wrapping, styling and truncating text
 */

import { COLORS } from '../colors/constants';
import { TYPOGRAPHY } from '../typography/constants';

// Dynamic imports
let chalk: any;
let wrapAnsi: any;
let stringWidth: any;

// Import dependencies dynamically when needed
async function loadDependencies() {
  try {
    const chalkModule = await import('chalk');
    chalk = chalkModule.default;
  } catch (e) {
    console.warn('Warning: chalk not available, using plain text output');
    chalk = null;
  }

  try {
    const wrapAnsiModule = await import('wrap-ansi');
    wrapAnsi = wrapAnsiModule.default;
  } catch (e) {
    console.warn('Warning: wrap-ansi not available, using fallback text wrapping');
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
  }

  try {
    const stringWidthModule = await import('string-width');
    stringWidth = stringWidthModule.default;
  } catch (e) {
    console.warn('Warning: string-width not available, using fallback implementation');
    // Fallback implementation
    stringWidth = (str: string) => str.replace(/\u001b\[\d+m/g, '').length;
  }
}

// Load dependencies in the background
const dependenciesPromise = loadDependencies();

/**
 * Format and wrap text with advanced styling
 * @param text The text to format
 * @param width The width to wrap at
 * @param options Formatting options
 * @returns Formatted text
 */
export async function formatText(
  text: string,
  width: number,
  options: any = {}
): Promise<string> {
  // Ensure dependencies are loaded
  await dependenciesPromise;
  
  if (!text) return '';
  
  // Extract options
  const indent = options.indent || 2;
  const maxLines = options.maxLines || 0;
  const truncate = options.truncate !== false;
  const showMore = options.showMore !== false;
  const useColor = options.useColor !== false;
  const style = options.style || 'normal';
  const textColor = options.color || COLORS.TEXT.BODY;
  
  // Create indent string
  const indentStr = ' '.repeat(indent);
  
  // Apply text styling
  let styledText = text;
  if (useColor && chalk) {
    switch (style) {
      case 'muted':
        styledText = chalk.hex(COLORS.TEXT.MUTED)(text);
        break;
      case 'placeholder':
        styledText = chalk.hex(COLORS.TEXT.PLACEHOLDER).italic(text);
        break;
      case 'command':
        styledText = chalk.hex(COLORS.TEXT.COMMAND).bold(text);
        break;
      case 'highlight':
        styledText = chalk.bold.hex(textColor)(text);
        break;
      default:
        styledText = chalk.hex(textColor)(text);
    }
  }
  
  // Wrap text to fit within width
  let wrappedText: string;
  if (wrapAnsi) {
    wrappedText = wrapAnsi(styledText, width - indent)
      .split('\n')
      .map(line => indentStr + line)
      .join('\n');
  } else {
    // Fallback wrapping
    const words = styledText.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine.length + word.length + 1) > (width - indent)) {
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
  
  // Apply line truncation if needed
  if (maxLines > 0 && truncate) {
    const lines = wrappedText.split('\n');
    
    if (lines.length > maxLines) {
      const truncatedLines = lines.slice(0, maxLines);
      
      // Add more lines indicator
      if (showMore) {
        let moreText = `${indentStr}[...${lines.length - maxLines} more lines]`;
        
        if (useColor && chalk) {
          moreText = chalk.hex(COLORS.TEXT.MUTED).italic(
            `${indentStr}${TYPOGRAPHY.ICONS.INFO} ${lines.length - maxLines} more lines - use --full-content to show all`
          );
        }
        
        truncatedLines.push(moreText);
      }
      
      return truncatedLines.join('\n');
    }
  }
  
  return wrappedText;
}