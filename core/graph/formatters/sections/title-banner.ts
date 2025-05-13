/**
 * Title banner formatter for task display
 */

import { TYPOGRAPHY } from '../typography/constants';
import { COLORS } from '../colors/constants';
import { getGradient } from '../utils/gradient';

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
 * Create a beautiful title banner with gradient and border
 */
export async function createTitleBanner(
  id: string, 
  title: string, 
  status: string,
  useColor: boolean = true,
  width: number = 80
): Promise<string> {
  // Ensure chalk is loaded if we're using colors
  const chalkInstance = useColor ? await getChalk() : null;
  
  // Plain text fallback
  if (!useColor || !chalkInstance) {
    return `${TYPOGRAPHY.ICONS.TASK} Task ${id}: ${title}`;
  }
  
  // Create a beautiful title with gradient and styling
  const taskIdText = chalkInstance.bold(`Task ${id}`);
  
  // Select gradient colors based on status
  let gradientColors: string[];
  let statusSymbol: string;
  
  switch (status) {
    case 'done':
      gradientColors = ['#20c997', '#12b886', '#0ca678'];
      statusSymbol = TYPOGRAPHY.STATUS.DONE;
      break;
    case 'in-progress':
      gradientColors = ['#fcc419', '#fab005', '#f59f00'];
      statusSymbol = TYPOGRAPHY.STATUS.IN_PROGRESS;
      break;
    default:
      gradientColors = ['#748ffc', '#4c6ef5', '#4263eb'];
      statusSymbol = TYPOGRAPHY.STATUS.TODO;
  }
  
  // Get styled title with gradient
  const titleText = await getGradient(title, gradientColors, useColor);
  
  // Create horizontal ruler with a gradient
  const horizontalLine = await getGradient(
    TYPOGRAPHY.DIVIDERS.LIGHT.repeat(width - 4),
    gradientColors,
    useColor
  );
  
  // Combine all elements with proper spacing
  return (
    `${chalkInstance.bold(statusSymbol)} ${taskIdText}\n` +
    `${horizontalLine}\n` +
    `${chalkInstance.bold(titleText)}`
  );
}