/**
 * Readiness formatter for task display
 * Formats task readiness status with appropriate colors and symbols
 */

import { TYPOGRAPHY } from '../typography/constants';
import { COLORS } from '../colors/constants';

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
 * Format readiness with beautiful styling
 * @param readiness The readiness status to format
 * @param useColor Whether to use colors in the output
 * @returns Formatted readiness string
 */
export async function formatReadiness(
  readiness: string,
  useColor: boolean = true
): Promise<string> {
  // Ensure chalk is loaded if we're using colors
  const chalkInstance = useColor ? await getChalk() : null;
  
  let symbol = '';
  let label = '';
  let color = '';
  
  switch (readiness) {
    case 'draft':
      symbol = TYPOGRAPHY.STATUS.DRAFT;
      label = 'DRAFT';
      color = COLORS.STATUS.DRAFT;
      break;
    case 'ready':
      symbol = TYPOGRAPHY.STATUS.READY;
      label = 'READY';
      color = COLORS.STATUS.READY;
      break;
    case 'blocked':
      symbol = TYPOGRAPHY.STATUS.BLOCKED;
      label = 'BLOCKED';
      color = COLORS.STATUS.BLOCKED;
      break;
    default:
      symbol = '?';
      label = readiness ? readiness.toUpperCase() : 'UNKNOWN';
      color = COLORS.MUTED;
  }
  
  // Apply styling if colors are enabled and chalk is available
  if (useColor && chalkInstance) {
    return chalkInstance.hex(color).bold(`${symbol} ${label}`);
  }
  
  // Plain text fallback
  return `${symbol} ${label}`;
}