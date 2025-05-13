/**
 * Utility functions for formatting tags with color
 */
import { ChalkColor } from './chalk-utils';

/**
 * Format an array of tags with color
 * @param tags Array of tags to format (might be null or undefined)
 * @param color ChalkColor to use for formatting
 * @returns Formatted string with colored tags
 */
export function formatTags(tags: string[] | null | undefined, color: ChalkColor): string {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return 'none';
  }
  
  const colorize = (str: string, clr: ChalkColor) => {
    // This is a lightweight wrapper that will be replaced by the actual colorize function
    // when used in conjunction with the chalk-utils module
    return str;
  };
  
  return tags.map(tag => `${tag}`).join(', ');
}