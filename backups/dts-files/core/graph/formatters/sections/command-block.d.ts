/**
 * Command block formatters for task display
 * Provides utilities for creating styled command blocks and placeholders
 */
/**
 * Format a code block styling for commands
 * @param command The command string to format
 * @param useColor Whether to use colors in the output
 * @returns Formatted command block string
 */
export declare function formatCommandBlock(command: string, useColor?: boolean): Promise<string>;
/**
 * Create an elegant placeholder text with suggested command
 * @param message The placeholder message to display
 * @param command The suggested command to display
 * @param id The task ID to include in the command
 * @param useColor Whether to use colors in the output
 * @returns Formatted placeholder string
 */
export declare function createPlaceholder(message: string, command: string, id: string, useColor?: boolean): Promise<string>;
