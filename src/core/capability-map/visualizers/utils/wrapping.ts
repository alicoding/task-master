/**
 * Text wrapping utilities for capability map visualizations
 */

/**
 * Wrap text to a specified width
 * @param text Text to wrap
 * @param width Maximum width in characters
 * @param indent Indentation to apply to each line
 * @returns Wrapped text
 */
export function wrapText(text: string, width: number, indent: string = ''): string {
  // Split text into words
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  // Process each word
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      // Word fits on current line
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      // Word doesn't fit, create new line
      if (currentLine) {
        lines.push(indent + currentLine);
      }
      currentLine = word;
    }
  }
  
  // Add final line
  if (currentLine) {
    lines.push(indent + currentLine);
  }
  
  return lines.join('\n');
}