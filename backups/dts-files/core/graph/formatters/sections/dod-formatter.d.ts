/**
 * Definition of Done formatter
 * Formats DoD items as a checklist
 */
/**
 * Format DoD items as a bullet list
 * @param taskId Task ID to get DoD items for
 * @param useColor Whether to use color in output
 * @returns Formatted DoD bullet list
 */
export declare function formatDoD(taskId: string, useColor?: boolean): Promise<string>;
