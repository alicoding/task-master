/**
 * Section header formatter for task display
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
 * Create a professionally styled section header
 * @param title The title of the section
 * @param icon The icon to display before the title
 * @param color The color to use for the title and icon
 * @param useColor Whether to use colors in the output
 * @param width The width of the terminal for proper sizing
 * @returns Formatted section header string
 */
export async function createSectionHeader(
  title: string,
  icon: string,
  color: string,
  useColor: boolean = true,
  width: number = 80
): Promise<string> {
  // Ensure chalk is loaded if we're using colors
  const chalkInstance = useColor ? await getChalk() : null;
  
  // Calculate padding and divider width
  const padding = 2;
  const sideWidth = Math.floor((width - title.length - icon.length - padding * 2 - 2) / 2);
  const leftSide = TYPOGRAPHY.DIVIDERS.LIGHT.repeat(Math.max(2, sideWidth));
  const rightSide = TYPOGRAPHY.DIVIDERS.LIGHT.repeat(
    Math.max(2, sideWidth + (width - title.length - icon.length - padding * 2 - 2) % 2)
  );
  
  // Apply styling if colors are enabled and chalk is available
  if (useColor && chalkInstance) {
    return (
      `${chalkInstance.gray(leftSide)} ${chalkInstance.hex(color).bold(icon)} ${chalkInstance.hex(color).bold(title.toUpperCase())} ${chalkInstance.gray(rightSide)}`
    );
  }
  
  // Plain text fallback
  return `${leftSide} ${icon} ${title.toUpperCase()} ${rightSide}`;
}