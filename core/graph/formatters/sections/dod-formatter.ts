/**
 * Definition of Done formatter
 * Formats DoD items as a checklist
 */

import { DoDManager } from '../../../dod/manager.ts';
import { DoDItem } from '../../../dod/types.ts';

// Dynamic imports for ESM compatibility
let chalk: any;

// Function to initialize dependencies
async function initDependencies() {
  try {
    const chalkModule = await import('chalk');
    chalk = chalkModule.default;
  } catch (e) {
    console.warn('Warning: chalk not available, using plain text output');
    chalk = null;
  }
}

// Start loading dependencies in the background
const dependenciesPromise = initDependencies();

/**
 * Format DoD items as a bullet list
 * @param taskId Task ID to get DoD items for
 * @param useColor Whether to use color in output
 * @returns Formatted DoD bullet list
 */
export async function formatDoD(taskId: string, useColor: boolean = true): Promise<string> {
  // Make sure dependencies are loaded
  await dependenciesPromise;

  // Get DoD for the task
  const manager = new DoDManager();
  const result = await manager.getTaskDoD(taskId);

  if (!result.success || !result.data || result.data.enabled === false) {
    // If DoD is disabled or there was an error, return empty string
    return '';
  }

  const dod = result.data;

  if (!dod.items || dod.items.length === 0) {
    // If no DoD items, return message
    return useColor && chalk
      ? chalk.italic('  No Definition of Done items defined for this task.')
      : '  No Definition of Done items defined for this task.';
  }

  // Format each item as a bullet point (not a checklist)
  const formattedItems = dod.items.map(item => {
    const bullet = useColor && chalk ? chalk.cyan('•') : '•';
    return `  ${bullet} ${item.description}`;
  });

  // No completion status counter - removed as per requirements

  // Return the bullet list directly
  return formattedItems.join('\n');
}