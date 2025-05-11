/**
 * Color Utilities for Search Output
 * 
 * Provides utilities for colorizing console output in the search command.
 */

import chalk from 'chalk';

/**
 * Type for chalk color names
 */
export type ChalkColor = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'
  | 'blackBright' | 'redBright' | 'greenBright' | 'yellowBright' | 'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';

/**
 * Type for chalk style modifiers
 */
export type ChalkStyle = 'bold' | 'dim' | 'italic' | 'underline' | 'inverse' | 'hidden' | 'strikethrough';

/**
 * Type for colorize function
 */
export type ColorizeFunction = (text: string, color?: ChalkColor, style?: ChalkStyle) => string;

/**
 * Get color functions based on whether colors are enabled
 * @param colorEnabled Whether colors are enabled
 * @returns Color utility functions
 */
export function getColorFunctions(colorEnabled: boolean): { colorize: ColorizeFunction } {
  return {
    colorize: (text: string, color?: ChalkColor, style?: ChalkStyle): string => {
      if (!colorEnabled) return text;
      
      let result = text;
      if (color && chalk[color]) {
        result = chalk[color](result);
      }
      if (style && chalk[style]) {
        result = chalk[style](result);
      }
      return result;
    }
  };
}

/**
 * Colorize status text based on task status
 * @param status Task status
 * @param colorEnabled Whether colors are enabled
 * @returns Colorized status text
 */
export function colorizeStatus(status: string, colorEnabled: boolean): string {
  const { colorize } = getColorFunctions(colorEnabled);
  
  switch (status) {
    case 'todo':
      return colorize(status, 'blue');
    case 'in-progress':
      return colorize(status, 'yellow');
    case 'done':
      return colorize(status, 'green');
    default:
      return status;
  }
}

/**
 * Colorize readiness text based on task readiness
 * @param readiness Task readiness
 * @param colorEnabled Whether colors are enabled
 * @returns Colorized readiness text
 */
export function colorizeReadiness(readiness: string, colorEnabled: boolean): string {
  const { colorize } = getColorFunctions(colorEnabled);
  
  switch (readiness) {
    case 'draft':
      return colorize(readiness, 'gray');
    case 'ready':
      return colorize(readiness, 'green');
    case 'blocked':
      return colorize(readiness, 'red');
    default:
      return readiness;
  }
}