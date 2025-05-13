/**
 * Command block formatters for task display
 * Provides utilities for creating styled command blocks and placeholders
 */

import { TYPOGRAPHY } from '@/core/graph/formatters/typography/constants';
import { COLORS } from '@/core/graph/formatters/colors/constants';

// Dynamic imports
let chalk: any;

// Import chalk dynamically when needed
async function getChalk() {
  if (!chalk) {
    try {
      const chalkModule = await import('chalk');
      chalk = chalkModule.default;
    } catch (e) {
      console.warn('Warning: chalk not available, using plain text output');
      chalk = null;
    }
  }
  return chalk;
}

/**
 * Format a code block styling for commands
 * @param command The command string to format
 * @param useColor Whether to use colors in the output
 * @returns Formatted command block string
 */
export async function formatCommandBlock(
  command: string,
  useColor: boolean = true
): Promise<string> {
  // Ensure chalk is loaded if we're using colors
  const chalkInstance = useColor ? await getChalk() : null;
  
  // Apply styling if colors are enabled and chalk is available
  if (useColor && chalkInstance) {
    return `${chalkInstance.gray(TYPOGRAPHY.ICONS.COMMAND)} ${chalkInstance.hex(COLORS.TEXT.COMMAND).bold(command)}`;
  }
  
  // Plain text fallback
  return `${TYPOGRAPHY.ICONS.COMMAND} ${command}`;
}

/**
 * Create an elegant placeholder text with suggested command
 * @param message The placeholder message to display
 * @param command The suggested command to display
 * @param id The task ID to include in the command
 * @param useColor Whether to use colors in the output
 * @returns Formatted placeholder string
 */
export async function createPlaceholder(
  message: string,
  command: string,
  id: string,
  useColor: boolean = true
): Promise<string> {
  // Ensure chalk is loaded if we're using colors
  const chalkInstance = useColor ? await getChalk() : null;
  
  const formattedCommand = `tm update --id ${id} ${command}`;
  
  // Apply styling if colors are enabled and chalk is available
  if (useColor && chalkInstance) {
    return (
      `${chalkInstance.hex(COLORS.TEXT.PLACEHOLDER).italic(message)}\n` +
      `${await formatCommandBlock(formattedCommand, useColor)}`
    );
  }
  
  // Plain text fallback
  return `${message}\n${TYPOGRAPHY.ICONS.COMMAND} ${formattedCommand}`;
}