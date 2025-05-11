/**
 * Tags formatter for task display
 * Creates visually appealing badges for task tags
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
 * Format tags as beautiful badges
 * @param tags Array of tag strings
 * @param useColor Whether to use colors in the output
 * @returns Formatted tags string
 */
export async function formatTagBadges(
  tags: string[] | null | undefined,
  useColor: boolean = true
): Promise<string> {
  // Ensure chalk is loaded if we're using colors
  const chalkInstance = useColor ? await getChalk() : null;
  
  // Handle empty tags
  if (!tags || tags.length === 0) {
    if (useColor && chalkInstance) {
      return chalkInstance.hex(COLORS.TEXT.PLACEHOLDER).italic('No tags');
    }
    return 'No tags';
  }
  
  // Create styled badges
  const badges = await Promise.all(tags.map(async (tag) => {
    if (useColor && chalkInstance) {
      // Create a badge with beautiful styling
      return chalkInstance.bgHex('#343a40').hex('#69db7c').bold(` ${tag} `);
    }
    return `[${tag}]`;
  }));
  
  // Join with spacing
  return badges.join('  ');
}