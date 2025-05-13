/**
 * Date formatting utilities for task display
 * Formats timestamps in a visually appealing layout
 */
/**
 * Format date in a simplified way
 * @param timestamp The timestamp to format
 * @returns Formatted date string
 */
export declare function formatDate(timestamp: number | string | Date): string;
/**
 * Format dates in a two-column layout
 * @param createdAt Created timestamp
 * @param updatedAt Updated timestamp
 * @param useColor Whether to use colors in the output
 * @returns Formatted dates string
 */
export declare function formatDates(createdAt: number | string | Date, updatedAt: number | string | Date, useColor?: boolean): Promise<string>;
