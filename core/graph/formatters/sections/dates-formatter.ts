/**
 * Date formatting utilities for task display
 * Formats timestamps in a visually appealing layout
 */

import { TYPOGRAPHY } from '../typography/constants.ts';
import { COLORS } from '../colors/constants.ts';

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
 * Format date in a simplified way
 * @param timestamp The timestamp to format
 * @returns Formatted date string
 */
export function formatDate(timestamp: number | string | Date): string {
  const date = new Date(timestamp);

  // First, format just the date part
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const dateStr = date.toLocaleDateString('en-US', dateOptions);

  // Check if time is midnight (00:00:00)
  const isDefaultTime = date.getHours() === 0 && date.getMinutes() === 0;

  // Only add time if it's not midnight
  if (!isDefaultTime) {
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };

    return `${dateStr}, ${date.toLocaleTimeString('en-US', timeOptions)}`;
  }

  // Return just the date part if time is midnight
  return dateStr;
}

/**
 * Format dates in a two-column layout
 * @param createdAt Created timestamp
 * @param updatedAt Updated timestamp
 * @param useColor Whether to use colors in the output
 * @returns Formatted dates string
 */
export async function formatDates(
  createdAt: number | string | Date,
  updatedAt: number | string | Date,
  useColor: boolean = true
): Promise<string> {
  // Ensure chalk is loaded if we're using colors
  const chalkInstance = useColor ? await getChalk() : null;
  
  // Format dates
  const createdDate = formatDate(createdAt);
  const updatedDate = formatDate(updatedAt);
  
  // Column titles
  const createdTitle = `${TYPOGRAPHY.ICONS.CREATED} Created`;
  const updatedTitle = `${TYPOGRAPHY.ICONS.UPDATED} Updated`;
  
  // Apply styling if colors are enabled and chalk is available
  if (useColor && chalkInstance) {
    return (
      `${chalkInstance.hex(COLORS.TEXT.MUTED)(createdTitle)}: ${chalkInstance.hex(COLORS.TEXT.BODY)(createdDate)}` +
      `    ${chalkInstance.hex(COLORS.TEXT.MUTED)(updatedTitle)}: ${chalkInstance.hex(COLORS.TEXT.BODY)(updatedDate)}`
    );
  }
  
  // Plain text fallback
  return `${createdTitle}: ${createdDate}    ${updatedTitle}: ${updatedDate}`;
}