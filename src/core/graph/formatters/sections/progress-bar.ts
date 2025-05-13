/**
 * Progress bar formatter for task display
 * Creates visual indicators for task status and completion
 */

import { Task } from '@/core/types';
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
 * Create a beautiful, styled progress bar
 * @param task The task to create a progress bar for
 * @param width The width of the progress bar
 * @param useColor Whether to use colors in the output
 * @returns Formatted progress bar string
 */
export async function createProgressBar(
  task: Task,
  width: number = 40,
  useColor: boolean = true
): Promise<string> {
  // Ensure chalk is loaded if we're using colors
  const chalkInstance = useColor ? await getChalk() : null;
  
  // Calculate progress percentage
  let progress = 0;
  let statusSymbol = '';
  let statusText = '';
  let statusColor = '';
  
  switch (task.status) {
    case 'todo':
      progress = 0;
      statusSymbol = TYPOGRAPHY.STATUS.TODO;
      statusText = 'TO DO';
      statusColor = COLORS.STATUS.TODO;
      break;
    case 'in-progress':
      progress = 50;
      statusSymbol = TYPOGRAPHY.STATUS.IN_PROGRESS;
      statusText = 'IN PROGRESS';
      statusColor = COLORS.STATUS.IN_PROGRESS;
      break;
    case 'done':
      progress = 100;
      statusSymbol = TYPOGRAPHY.STATUS.DONE;
      statusText = 'COMPLETED';
      statusColor = COLORS.STATUS.DONE;
      break;
  }
  
  // Create the bar sizes
  const barWidth = width - 10; // Leave space for percentage
  const completedWidth = Math.floor(barWidth * (progress / 100));
  const remainingWidth = barWidth - completedWidth;
  
  // Create the styled bar
  if (useColor && chalkInstance) {
    // First line: status with symbol and color
    const statusLine = chalkInstance.hex(statusColor).bold(`${statusSymbol} ${statusText}`);
    
    // Second line: progress bar with gradient and percentage
    const completedSection = chalkInstance.bgHex(COLORS.PROGRESS.BAR_COMPLETE)(' '.repeat(completedWidth));
    const remainingSection = chalkInstance.bgHex(COLORS.PROGRESS.BAR_INCOMPLETE)(' '.repeat(remainingWidth));
    const percentText = chalkInstance.bold.white(`${progress}%`);
    
    return `${statusLine}\n  ${chalkInstance.bgHex(COLORS.PROGRESS.BACKGROUND)(`${completedSection}${remainingSection}`)} ${percentText}`;
  }
  
  // Plain text fallback
  const completedSection = '█'.repeat(completedWidth);
  const remainingSection = '░'.repeat(remainingWidth);
  
  return `${statusSymbol} ${statusText}\n  [${completedSection}${remainingSection}] ${progress}%`;
}